package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.dto.RespuestaTurno;
import com.proyecto.pokemon_backend.dto.SolicitudCaptura;
import com.proyecto.pokemon_backend.dto.SolicitudTurno;
import com.proyecto.pokemon_backend.exception.ErrorNegocio;
import com.proyecto.pokemon_backend.exception.RecursoNoEncontrado;
import com.proyecto.pokemon_backend.model.Ataques;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.model.PokemonUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.model.enums.Estado;
import com.proyecto.pokemon_backend.repository.RepositorioAtaques;
import com.proyecto.pokemon_backend.repository.RepositorioEstadoMovimientoPokemon;
import com.proyecto.pokemon_backend.repository.RepositorioInventarioUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioObjeto;
import com.proyecto.pokemon_backend.repository.RepositorioPokedexMaestra;
import com.proyecto.pokemon_backend.repository.RepositorioPokemonUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import com.proyecto.pokemon_backend.service.api.ServicioPokeApi;
import com.proyecto.pokemon_backend.service.logica.CalculoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Motor de combate por turnos (Gen II - Pokémon Oro/Plata).
 *
 * Responsabilidades:
 *   - Ejecutar un turno de combate aplicando la fórmula de daño Gen II.
 *   - Gestionar estados alterados (pre-turno y post-turno).
 *   - Gestionar el moveset activo con PP persistidos en BD.
 *   - Resolver la mecánica de captura con Poké Balls.
 */
@Service
public class BatallaService {

    private static final int LIMITE_EQUIPO = 6;
    private static final int MAX_MOVIMIENTOS_ACTIVOS = 4;
    private static final String VERSION_ORO_PLATA = "gold-silver";

    private final RepositorioPokemonUsuario pokemonRepo;
    private final RepositorioPokedexMaestra pokedexRepo;
    private final RepositorioAtaques ataquesRepo;
    private final CalculoService calculoService;
    private final TipoService tipoService;
    private final RepositorioObjeto itemRepo;
    private final RepositorioInventarioUsuario inventarioRepo;
    private final RepositorioUsuario userRepo;
    private final ServicioPokeApi pokeApiService;
    private final RepositorioEstadoMovimientoPokemon moveStateRepo;

    /** Cache de learnsets para no consultar PokeAPI en cada turno. */
    private final ConcurrentHashMap<Integer, List<EntradaLearnset>> learnsetCache = new ConcurrentHashMap<>();

    public BatallaService(
        RepositorioPokemonUsuario pokemonRepo,
        RepositorioPokedexMaestra pokedexRepo,
        RepositorioAtaques ataquesRepo,
        CalculoService calculoService,
        TipoService tipoService,
        RepositorioObjeto itemRepo,
        RepositorioInventarioUsuario inventarioRepo,
        RepositorioUsuario userRepo,
        ServicioPokeApi pokeApiService,
        RepositorioEstadoMovimientoPokemon moveStateRepo
    ) {
        this.pokemonRepo = pokemonRepo;
        this.pokedexRepo = pokedexRepo;
        this.ataquesRepo = ataquesRepo;
        this.calculoService = calculoService;
        this.tipoService = tipoService;
        this.itemRepo = itemRepo;
        this.inventarioRepo = inventarioRepo;
        this.userRepo = userRepo;
        this.pokeApiService = pokeApiService;
        this.moveStateRepo = moveStateRepo;
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================

    public List<Map<String, Object>> listarMovimientos(String username, Long pokemonId) {
        Usuario usuario = cargarUsuario(username);
        PokemonUsuario pokemon = cargarPokemon(pokemonId);

        if (!Objects.equals(pokemon.getUsuarioId(), usuario.getIdUsuario())) {
            throw new ErrorNegocio("No puedes consultar movimientos de un Pokémon que no es tuyo.");
        }

        return construirSlots(pokemon).stream()
            .map(slot -> {
                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("movimientoId",  slot.ataque().getIdAtaque());
                dto.put("nombre",        slot.ataque().getNombre());
                dto.put("tipo",          slot.ataque().getTipo());
                dto.put("categoria",     slot.ataque().getCategoria());
                dto.put("potencia",      slot.ataque().getPotencia());
                dto.put("precision",     slot.ataque().getPrecisionBase());
                dto.put("ppActual",      slot.ppActual());
                dto.put("ppMax",         slot.ppMax());
                return dto;
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public RespuestaTurno ejecutarTurno(String username, SolicitudTurno request) {
        Usuario usuario = cargarUsuario(username);
        PokemonUsuario atacante = cargarPokemon(request.getAtacanteId());
        PokemonUsuario defensor = cargarPokemon(request.getDefensorId());

        validarParticipantes(usuario, atacante, defensor);

        MovimientoResuelto movResuelto = resolverMovimiento(atacante, request);
        Ataques movimiento = movResuelto.ataque();

        PokedexMaestra datosAtacante = cargarPokedex(atacante.getPokedexId());
        PokedexMaestra datosDefensor = cargarPokedex(defensor.getPokedexId());

        // --- Pre-turno: estados que bloquean o hacen autodaño ---
        String mensajeBloqueo = procesarEstadoPreTurno(atacante);
        if (mensajeBloqueo != null) {
            String residual = procesarEfectosFinTurno(atacante);
            pokemonRepo.save(atacante);
            return sinDanio(defensor.getHpActual(), unir(mensajeBloqueo, residual));
        }

        // --- Precisión ---
        if (!calculoService.verificaImpacto(nvl(movimiento.getPrecisionBase(), 100))) {
            procesarEfectosFinTurno(defensor);
            procesarEfectosFinTurno(atacante);
            pokemonRepo.save(defensor);
            pokemonRepo.save(atacante);
            return sinDanio(defensor.getHpActual(), "¡El movimiento falló!");
        }

        // --- Movimientos de estado (sin daño directo) ---
        boolean esEstado = "status".equalsIgnoreCase(movimiento.getCategoria())
            || nvl(movimiento.getPotencia(), 0) <= 0;

        if (esEstado) {
            procesarEfectosFinTurno(defensor);
            procesarEfectosFinTurno(atacante);
            pokemonRepo.save(defensor);
            pokemonRepo.save(atacante);
            return sinDanio(defensor.getHpActual(), movimiento.getNombre() + " no causó daño directo.");
        }

        // --- Cálculo de daño ---
        boolean esEspecial = "special".equalsIgnoreCase(movimiento.getCategoria());
        String tipoMov = movimiento.getTipo().toLowerCase(Locale.ROOT);

        double efectividad = tipoService.calcularEfectividad(
            tipoMov, datosDefensor.getTipo_1(), datosDefensor.getTipo_2()
        );
        boolean stab = tieneStab(tipoMov, datosAtacante.getTipo_1(), datosAtacante.getTipo_2());
        boolean critico = calculoService.fueGolpeCritico();
        double multiplicadorFinal = critico ? efectividad * 2.0 : efectividad;

        int atkStat = esEspecial ? nvl(atacante.getAtaqueEspecialStat(), 1) : nvl(atacante.getAtaqueStat(), 1);
        int defStat = esEspecial ? nvl(defensor.getDefensaEspecialStat(), 1) : nvl(defensor.getDefensaStat(), 1);

        int danio = calculoService.calcularDanio(
            nvl(atacante.getNivel(), 1),
            atkStat, defStat,
            nvl(movimiento.getPotencia(), 0),
            multiplicadorFinal,
            stab,
            atacante.getEstado(),
            !esEspecial
        );

        int hpRestante = Math.max(0, nvl(defensor.getHpActual(), 0) - danio);
        defensor.setHpActual(hpRestante);

        // --- Post-turno: daño residual ---
        String residualDef = procesarEfectosFinTurno(defensor);
        String residualAtk = procesarEfectosFinTurno(atacante);
        pokemonRepo.save(defensor);
        pokemonRepo.save(atacante);

        String msgEfectividad = tipoService.mensajeEfectividad(efectividad);
        String ppInfo = movResuelto.fromMoveset()
            ? "PP: " + movResuelto.ppRestante() + "/" + movResuelto.ppMax()
            : "";

        String mensajeFinal = unir(
            "¡" + atacante.getPokedexId() + " usó " + movimiento.getNombre() + "!",
            critico ? "¡Golpe crítico!" : "",
            msgEfectividad,
            ppInfo,
            residualAtk,
            residualDef
        );

        return RespuestaTurno.builder()
            .danoInfligido(danio)
            .hpRestanteDefensor(hpRestante)
            .multiplicadorFinal(multiplicadorFinal)
            .golpeCritico(critico)
            .mensajeEfectividad(msgEfectividad)
            .defensorDerrotado(hpRestante == 0)
            .mensajeGeneral(mensajeFinal)
            .build();
    }

    @Transactional
    public String intentarCaptura(String username, SolicitudCaptura request) {
        Usuario usuario = cargarUsuario(username);
        PokemonUsuario salvaje = cargarPokemon(request.getDefensorId());

        if (Objects.equals(salvaje.getUsuarioId(), usuario.getIdUsuario())) {
            throw new ErrorNegocio("No puedes capturar un Pokémon que ya es tuyo.");
        }
        if (nvl(salvaje.getHpActual(), 0) <= 0) {
            throw new ErrorNegocio("No puedes capturar un Pokémon debilitado.");
        }

        PokedexMaestra especie = cargarPokedex(salvaje.getPokedexId());
        Item ball = resolverPokeball(request.getNombreBall());

        InventarioUsuario inventario = inventarioRepo.findByUsuarioAndItem(usuario, ball)
            .filter(inv -> nvl(inv.getCantidad(), 0) > 0)
            .orElseThrow(() -> new ErrorNegocio("No tienes " + ball.getNombre() + "."));

        inventario.setCantidad(inventario.getCantidad() - 1);
        inventarioRepo.save(inventario);

        boolean capturado = calculoService.calcularCaptura(
            nvl(salvaje.getHpMax(), 1),
            nvl(salvaje.getHpActual(), 1),
            nvl(especie.getRatioCaptura(), 45),
            bonoPokeball(ball),
            salvaje.getEstado()
        );

        if (capturado) {
            salvaje.setUsuarioId(usuario.getIdUsuario());
            salvaje.setPosicionEquipo(siguientePosicionEquipo(usuario.getIdUsuario()));
            pokemonRepo.save(salvaje);
            return "¡" + especie.getNombre() + " fue capturado!";
        }

        return "¡El Pokémon salvaje se escapó!";
    }

    // =========================================================================
    // RESOLUCIÓN DE MOVIMIENTOS Y MOVESET
    // =========================================================================

    private MovimientoResuelto resolverMovimiento(PokemonUsuario atacante, SolicitudTurno request) {
        if (request.getMovimientoId() != null) {
            return consumirMovimiento(atacante, request.getMovimientoId().intValue());
        }

        // Compatibilidad legacy: cliente antiguo que envía tipo+potencia directamente
        if (request.getTipoAtaque() != null && request.getPotenciaMovimiento() != null) {
            return new MovimientoResuelto(movimientoLegacy(request), null, null, false);
        }

        // Sin movimientoId: usar el primer movimiento con PP disponible
        HuecoMovimiento primerSlot = construirSlots(atacante).stream()
            .filter(s -> s.ppActual() > 0)
            .findFirst()
            .orElseThrow(() -> new ErrorNegocio("¡No quedan PP en ningún movimiento!"));

        return consumirMovimiento(atacante, primerSlot.ataque().getIdAtaque());
    }

    private MovimientoResuelto consumirMovimiento(PokemonUsuario atacante, int movimientoId) {
        HuecoMovimiento slot = construirSlots(atacante).stream()
            .filter(s -> Objects.equals(s.ataque().getIdAtaque(), movimientoId))
            .findFirst()
            .orElseThrow(() -> new ErrorNegocio("El movimiento no pertenece al moveset actual del Pokémon."));

        if (slot.ppActual() <= 0) {
            throw new ErrorNegocio("¡No quedan PP para ese movimiento!");
        }

        int ppRestante = slot.ppActual() - 1;
        moveStateRepo.actualizarPpActual(atacante.getId(), movimientoId, ppRestante);

        return new MovimientoResuelto(slot.ataque(), ppRestante, slot.ppMax(), true);
    }

    private List<HuecoMovimiento> construirSlots(PokemonUsuario pokemon) {
        List<Ataques> movimientos = resolverMovimientosParaPokemon(pokemon);

        Map<Integer, RepositorioEstadoMovimientoPokemon.EstadoPpMovimiento> ppPersistido =
            moveStateRepo.buscarPorPokemonId(pokemon.getId()).stream()
                .collect(Collectors.toMap(
                    RepositorioEstadoMovimientoPokemon.EstadoPpMovimiento::moveId,
                    r -> r,
                    (a, b) -> a,
                    HashMap::new
                ));

        List<HuecoMovimiento> slots = new ArrayList<>();
        Set<Integer> idsValidos = new HashSet<>();
        int slotIndex = 0;

        for (Ataques mov : movimientos) {
            if (mov == null || mov.getIdAtaque() == null) continue;

            int ppMax = Math.max(1, nvl(mov.getPpBase(), 1));
            int ppActual = ppMax;

            RepositorioEstadoMovimientoPokemon.EstadoPpMovimiento fila = ppPersistido.get(mov.getIdAtaque());
            if (fila != null) {
                ppActual = Math.max(0, Math.min(fila.ppActual(), ppMax));
            }

            idsValidos.add(mov.getIdAtaque());
            moveStateRepo.insertarOActualizar(pokemon.getId(), mov.getIdAtaque(), slotIndex, ppActual);
            slots.add(new HuecoMovimiento(mov, ppActual, ppMax));
            slotIndex++;
        }

        moveStateRepo.eliminarPorPokemonIdYNoEn(pokemon.getId(), idsValidos);
        return slots;
    }

    private List<Ataques> resolverMovimientosParaPokemon(PokemonUsuario pokemon) {
        List<EntradaLearnset> learnset = obtenerLearnset(nvl(pokemon.getPokedexId(), 0));
        int nivel = nvl(pokemon.getNivel(), 1);

        List<EntradaLearnset> aprendibles = learnset.stream()
            .filter(e -> e.nivel() <= nivel)
            .sorted(Comparator.comparingInt(EntradaLearnset::nivel).thenComparing(EntradaLearnset::moveId))
            .toList();

        if (aprendibles.isEmpty() && !learnset.isEmpty()) {
            aprendibles = List.of(learnset.get(0));
        }

        if (aprendibles.size() > MAX_MOVIMIENTOS_ACTIVOS) {
            aprendibles = aprendibles.subList(aprendibles.size() - MAX_MOVIMIENTOS_ACTIVOS, aprendibles.size());
        }

        List<Ataques> movimientos = new ArrayList<>();
        for (EntradaLearnset entrada : aprendibles) {
            Integer moveId = entrada.moveId();
            if (moveId != null) ataquesRepo.findById(moveId).ifPresent(movimientos::add);
        }

        return movimientos.isEmpty() ? movimientosFallback(nvl(pokemon.getPokedexId(), 0)) : movimientos;
    }

    private List<EntradaLearnset> obtenerLearnset(Integer pokedexId) {
        if (pokedexId == null || pokedexId <= 0) return List.of();
        return learnsetCache.computeIfAbsent(pokedexId, this::consultarLearnsetDesdeApi);
    }

    private List<EntradaLearnset> consultarLearnsetDesdeApi(Integer pokedexId) {
        try {
            Map<String, Object> datos = pokeApiService.obtenerDetallesPokemon(String.valueOf(pokedexId)).block();
            if (datos == null) return List.of();

            Object rawMoves = datos.get("moves");
            if (!(rawMoves instanceof List<?> lista)) return List.of();

            Map<Integer, Integer> nivelMinPorMoveId = new HashMap<>();

            for (Object entrada : lista) {
                if (!(entrada instanceof Map<?, ?> movEntry)) continue;

                String nombre = nombreAnidado(movEntry.get("move"));
                if (nombre.isBlank()) continue;

                Optional<Ataques> ataque = ataquesRepo.findByNombreIgnoreCase(nombre);
                if (ataque.isEmpty()) continue;

                int nivel = nivelAprendizajeOroPlata(movEntry.get("version_group_details"));
                if (nivel < 0) continue;

                nivelMinPorMoveId.merge(ataque.get().getIdAtaque(), nivel, (a, b) -> Math.min(a, b));
            }

            return nivelMinPorMoveId.entrySet().stream()
                .map(e -> new EntradaLearnset(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(EntradaLearnset::nivel).thenComparing(EntradaLearnset::moveId))
                .toList();

        } catch (Exception e) {
            return List.of();
        }
    }

    private int nivelAprendizajeOroPlata(Object rawDetalles) {
        if (!(rawDetalles instanceof List<?> lista)) return -1;

        int nivel = Integer.MAX_VALUE;
        for (Object raw : lista) {
            if (!(raw instanceof Map<?, ?> detalle)) continue;

            String version = nombreAnidado(detalle.get("version_group"));
            String metodo  = nombreAnidado(detalle.get("move_learn_method"));

            if (!VERSION_ORO_PLATA.equalsIgnoreCase(version)) continue;
            if (!"level-up".equalsIgnoreCase(metodo)) continue;

            int n = toInt(detalle.get("level_learned_at"), 0);
            nivel = Math.min(nivel, n);
        }

        return nivel == Integer.MAX_VALUE ? -1 : nivel;
    }

    private List<Ataques> movimientosFallback(Integer pokedexId) {
        String tipo = (pokedexId != null ? pokedexRepo.findById(pokedexId) : Optional.<PokedexMaestra>empty())
            .map(p -> p.getTipo_1().toLowerCase(Locale.ROOT))
            .orElse("normal");

        List<String> candidatos = new ArrayList<>(List.of("tackle", "growl"));
        switch (tipo) {
            case "fire"     -> { candidatos.add("ember");        candidatos.add("smokescreen"); }
            case "water"    -> { candidatos.add("water-gun");    candidatos.add("bubble"); }
            case "grass"    -> { candidatos.add("vine-whip");    candidatos.add("razor-leaf"); }
            case "electric" -> { candidatos.add("thunder-shock"); candidatos.add("quick-attack"); }
            default         -> { candidatos.add("quick-attack"); candidatos.add("scratch"); }
        }

        LinkedHashMap<Integer, Ataques> seleccion = new LinkedHashMap<>();
        for (String nombre : candidatos) {
            ataquesRepo.findByNombreIgnoreCase(nombre)
                .ifPresent(m -> seleccion.putIfAbsent(m.getIdAtaque(), m));
            if (seleccion.size() >= MAX_MOVIMIENTOS_ACTIVOS) break;
        }

        // Fallback final por IDs clásicos de Gen I/II
        for (int id : List.of(33, 45, 98, 10, 52, 55, 84)) {
            ataquesRepo.findById(id).ifPresent(m -> seleccion.putIfAbsent(m.getIdAtaque(), m));
            if (seleccion.size() >= MAX_MOVIMIENTOS_ACTIVOS) break;
        }

        return seleccion.values().stream().limit(MAX_MOVIMIENTOS_ACTIVOS).toList();
    }

    private Ataques movimientoLegacy(SolicitudTurno request) {
        Ataques mov = new Ataques();
        mov.setIdAtaque(-1);
        mov.setNombre(str(request.getTipoAtaque()));
        mov.setTipo(str(request.getTipoAtaque()));
        mov.setCategoria(Boolean.TRUE.equals(request.getEsEspecial()) ? "special" : "physical");
        mov.setPotencia(nvl(request.getPotenciaMovimiento(), 0));
        mov.setPrecisionBase(100);
        mov.setPpBase(1);
        return mov;
    }

    // =========================================================================
    // ESTADOS ALTERADOS
    // =========================================================================

    /**
     * Procesa el estado del Pokémon al inicio del turno.
     * Devuelve un mensaje si el turno queda bloqueado, null si puede atacar.
     */
    private String procesarEstadoPreTurno(PokemonUsuario pkm) {
        switch (pkm.getEstado()) {
            case CONGELADO -> {
                // 10% de probabilidad de descongelarse cada turno
                if (Math.random() < 0.10) {
                    pkm.setEstado(Estado.SALUDABLE);
                    return "¡" + pkm.getPokedexId() + " se descongeló!";
                }
                return pkm.getPokedexId() + " está congelado y no puede moverse.";
            }
            case DORMIDO -> {
                if (nvl(pkm.getTurnosSueno(), 0) > 0) {
                    pkm.setTurnosSueno(pkm.getTurnosSueno() - 1);
                    return pkm.getPokedexId() + " está durmiendo...";
                }
                pkm.setEstado(Estado.SALUDABLE);
                return "¡" + pkm.getPokedexId() + " se despertó!";
            }
            case PARALIZADO -> {
                // 25% de probabilidad de no poder moverse
                if (Math.random() < 0.25) {
                    return pkm.getPokedexId() + " está paralizado y no puede moverse.";
                }
            }
            default -> { /* SALUDABLE, QUEMADO, ENVENENADO, GRAVE_ENVENENADO: no bloquean el turno */ }
        }

        // Confusión (estado volátil)
        if (nvl(pkm.getTurnosConfusion(), 0) > 0) {
            pkm.setTurnosConfusion(pkm.getTurnosConfusion() - 1);
            if (Math.random() < 0.5) {
                int autoDanio = calculoService.calcularDanio(
                    nvl(pkm.getNivel(), 1),
                    nvl(pkm.getAtaqueStat(), 1),
                    nvl(pkm.getDefensaStat(), 1),
                    40, 1.0, false, null, true
                );
                pkm.setHpActual(Math.max(0, nvl(pkm.getHpActual(), 0) - autoDanio));
                return "¡Está confuso y se hirió a sí mismo!";
            }
        }

        return null;
    }

    /**
     * Aplica daño residual al final del turno (veneno, quemadura, drenadoras).
     * Devuelve el mensaje para mostrar al jugador, o cadena vacía si no hay efecto.
     */
    private String procesarEfectosFinTurno(PokemonUsuario pkm) {
        int hpMax = nvl(pkm.getHpMax(), 1);
        int danio = 0;
        String msg = "";

        switch (pkm.getEstado()) {
            case QUEMADO -> {
                danio = Math.max(1, hpMax / 8);
                msg = "La quemadura le resta PS.";
            }
            case ENVENENADO -> {
                danio = Math.max(1, hpMax / 8);
                msg = "El veneno le resta PS.";
            }
            case GRAVE_ENVENENADO -> {
                pkm.setContadorToxico(nvl(pkm.getContadorToxico(), 0) + 1);
                danio = Math.max(1, hpMax * pkm.getContadorToxico() / 16);
                msg = "¡El veneno empeora!";
            }
            default -> { /* Sin daño residual */ }
        }

        if (Boolean.TRUE.equals(pkm.getTieneDrenadoras())) {
            danio += Math.max(1, hpMax / 8);
            msg = unir(msg, "Las drenadoras le quitan PS.");
        }

        if (danio > 0) {
            pkm.setHpActual(Math.max(0, nvl(pkm.getHpActual(), 0) - danio));
        }

        return msg;
    }

    // =========================================================================
    // CAPTURA
    // =========================================================================

    private Item resolverPokeball(String nombre) {
        String raw = str(nombre).trim();
        if (raw.isEmpty()) throw new ErrorNegocio("nombreBall es obligatorio.");

        for (String candidato : List.of(raw, raw.replace(" ", "-"), raw.replace("-", " "))) {
            Optional<Item> item = itemRepo.findByNombreIgnoreCase(candidato);
            if (item.isPresent() && esPokeball(item.get())) return item.get();
        }

        throw new RecursoNoEncontrado("La Poké Ball indicada no existe: " + nombre);
    }

    private boolean esPokeball(Item item) {
        return str(item.getEfecto()).toUpperCase(Locale.ROOT).startsWith("CAPTURE_");
    }

    private double bonoPokeball(Item ball) {
        return switch (str(ball.getEfecto()).toUpperCase(Locale.ROOT)) {
            case "CAPTURE_1.0" -> 1.0;
            case "CAPTURE_1.5" -> 1.5;
            case "CAPTURE_2.0" -> 2.0;
            case "CAPTURE_MAX" -> 255.0;
            default            -> 1.0;
        };
    }

    private int siguientePosicionEquipo(Long userId) {
        List<PokemonUsuario> equipo = pokemonRepo.findByUsuarioId(userId);
        boolean[] ocupados = new boolean[LIMITE_EQUIPO];
        int maxCaja = LIMITE_EQUIPO - 1;

        for (PokemonUsuario p : equipo) {
            int pos = nvl(p.getPosicionEquipo(), LIMITE_EQUIPO);
            if (pos >= 0 && pos < LIMITE_EQUIPO) {
                ocupados[pos] = true;
            } else if (pos >= LIMITE_EQUIPO) {
                maxCaja = Math.max(maxCaja, pos);
            }
        }

        for (int i = 0; i < LIMITE_EQUIPO; i++) {
            if (!ocupados[i]) return i;
        }

        return maxCaja + 1; // Va a la caja (PC)
    }

    // =========================================================================
    // VALIDACIONES
    // =========================================================================

    private void validarParticipantes(Usuario usuario, PokemonUsuario atacante, PokemonUsuario defensor) {
        if (!Objects.equals(atacante.getUsuarioId(), usuario.getIdUsuario())) {
            throw new ErrorNegocio("El atacante no pertenece al usuario autenticado.");
        }
        if (Objects.equals(defensor.getUsuarioId(), usuario.getIdUsuario())) {
            throw new ErrorNegocio("No puedes atacar a un Pokémon de tu propio equipo.");
        }
        if (nvl(atacante.getHpActual(), 0) <= 0) {
            throw new ErrorNegocio("El Pokémon atacante está debilitado.");
        }
        if (nvl(defensor.getHpActual(), 0) <= 0) {
            throw new ErrorNegocio("El Pokémon defensor ya está debilitado.");
        }
    }

    // =========================================================================
    // HELPERS DE CARGA
    // =========================================================================

    private Usuario cargarUsuario(String username) {
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new RecursoNoEncontrado("Usuario no encontrado."));
    }

    private PokemonUsuario cargarPokemon(Long id) {
        if (id == null) throw new ErrorNegocio("ID de Pokémon no puede ser null.");
        return pokemonRepo.findById(id)
            .orElseThrow(() -> new RecursoNoEncontrado("Pokémon no encontrado: " + id));
    }

    private PokedexMaestra cargarPokedex(Integer id) {
        if (id == null) throw new ErrorNegocio("ID de Pokédex no puede ser null.");
        return pokedexRepo.findById(id)
            .orElseThrow(() -> new RecursoNoEncontrado("Especie no encontrada en Pokédex: " + id));
    }

    // =========================================================================
    // HELPERS DE CONSTRUCCIÓN DE RESPUESTA
    // =========================================================================

    private RespuestaTurno sinDanio(int hpDefensor, String mensaje) {
        return RespuestaTurno.builder()
            .danoInfligido(0)
            .hpRestanteDefensor(hpDefensor)
            .multiplicadorFinal(1.0)
            .golpeCritico(false)
            .mensajeEfectividad("")
            .defensorDerrotado(hpDefensor == 0)
            .mensajeGeneral(mensaje)
            .build();
    }

    private boolean tieneStab(String tipoMov, String tipo1, String tipo2) {
        String mov = tipoMov.toLowerCase(Locale.ROOT);
        return mov.equals(str(tipo1).toLowerCase(Locale.ROOT))
            || mov.equals(str(tipo2).toLowerCase(Locale.ROOT));
    }

    // =========================================================================
    // UTILIDADES
    // =========================================================================

    private String unir(String... partes) {
        StringBuilder sb = new StringBuilder();
        for (String parte : partes) {
            String v = str(parte).trim();
            if (!v.isEmpty()) {
                if (sb.length() > 0) sb.append(' ');
                sb.append(v);
            }
        }
        return sb.toString();
    }

    private String nombreAnidado(Object raw) {
        if (!(raw instanceof Map<?, ?> map)) return "";
        Object name = map.get("name");
        return name == null ? "" : String.valueOf(name);
    }

    private int toInt(Object raw, int defecto) {
        if (raw == null) return defecto;
        if (raw instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(raw)); }
        catch (NumberFormatException e) { return defecto; }
    }

    private int nvl(Integer value, int defecto) {
        return value == null ? defecto : value;
    }

    private String str(String value) {
        return value == null ? "" : value;
    }

    // =========================================================================
    // RECORDS INTERNOS
    // =========================================================================

    private record EntradaLearnset(Integer moveId, int nivel) {}
    private record HuecoMovimiento(Ataques ataque, int ppActual, int ppMax) {}
    private record MovimientoResuelto(Ataques ataque, Integer ppRestante, Integer ppMax, boolean fromMoveset) {}
}
