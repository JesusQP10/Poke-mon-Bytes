package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.dto.SolicitudCaptura;
import com.proyecto.pokemon_backend.dto.SolicitudTurno;
import com.proyecto.pokemon_backend.dto.RespuestaTurno;
import com.proyecto.pokemon_backend.model.Ataques;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.model.PokemonUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.model.enums.Estado;
import com.proyecto.pokemon_backend.repository.RepositorioAtaques;
import com.proyecto.pokemon_backend.repository.RepositorioInventarioUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioObjeto;
import com.proyecto.pokemon_backend.repository.RepositorioPokedexMaestra;
import com.proyecto.pokemon_backend.repository.RepositorioEstadoMovimientoPokemon;
import com.proyecto.pokemon_backend.repository.RepositorioPokemonUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import com.proyecto.pokemon_backend.service.api.ServicioPokeApi;
import com.proyecto.pokemon_backend.service.logica.CalculoService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BatallaService {

    // Limites del sistema de combate/equipo.
    private static final int PARTY_LIMIT = 6;
    private static final int MAX_ACTIVE_MOVES = 4;
    private static final String VERSION_GROUP_GS = "gold-silver";

    private final RepositorioPokemonUsuario pokemonUsuarioRepository;
    private final RepositorioPokedexMaestra pokedexMasterRepository;
    private final RepositorioAtaques ataquesRepository;
    private final CalculoService calculoService;
    private final TipoService tipoService;
    private final RepositorioObjeto itemRepository;
    private final RepositorioInventarioUsuario inventarioRepository;
    private final RepositorioUsuario userRepository;
    private final ServicioPokeApi pokeApiService;
    private final RepositorioEstadoMovimientoPokemon moveStateRepository;

    // No pedir a PokeAPI el learnset todo el rato.
    private final ConcurrentHashMap<Integer, List<MovimientoAprendizaje>> learnsetCache = new ConcurrentHashMap<>();

    public BatallaService(
        RepositorioPokemonUsuario pokemonUsuarioRepository,
        RepositorioPokedexMaestra pokedexMasterRepository,
        RepositorioAtaques ataquesRepository,
        CalculoService calculoService,
        TipoService tipoService,
        RepositorioObjeto itemRepository,
        RepositorioInventarioUsuario inventarioRepository,
        RepositorioUsuario userRepository,
        ServicioPokeApi pokeApiService,
        RepositorioEstadoMovimientoPokemon moveStateRepository
    ) {
        this.pokemonUsuarioRepository = pokemonUsuarioRepository;
        this.pokedexMasterRepository = pokedexMasterRepository;
        this.ataquesRepository = ataquesRepository;
        this.calculoService = calculoService;
        this.tipoService = tipoService;
        this.itemRepository = itemRepository;
        this.inventarioRepository = inventarioRepository;
        this.userRepository = userRepository;
        this.pokeApiService = pokeApiService;
        this.moveStateRepository = moveStateRepository;
    }

    // listarMovimientosDisponibles.
    public List<Map<String, Object>> listarMovimientosDisponibles(String username, Long pokemonUsuarioId) {
        // Devuelve los movimientos actuales con PP para pintarlos en frontend.
        Usuario usuario = obtenerUsuarioPorNombreUsuario(username);
        PokemonUsuario pokemon = obtenerPokemonPorId(pokemonUsuarioId, "consultado");

        if (!Objects.equals(pokemon.getUsuarioId(), usuario.getIdUsuario())) {
            throw new RuntimeException("No puedes consultar movimientos de un Pokemon que no es tuyo.");
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (HuecoMovimiento slot : construirHuecosMovimientos(pokemon)) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("movimientoId", slot.ataque().getIdAtaque());
            dto.put("nombre", slot.ataque().getNombre());
            dto.put("tipo", slot.ataque().getTipo());
            dto.put("categoria", slot.ataque().getCategoria());
            dto.put("potencia", slot.ataque().getPotencia());
            dto.put("precision", slot.ataque().getPrecisionBase());
            dto.put("ppActual", slot.ppActual());
            dto.put("ppMax", slot.ppMax());
            result.add(dto);
        }
        return result;
    }

    @Transactional
    
    public RespuestaTurno ejecutarTurno(String username, SolicitudTurno request) {
        // Flujo general del turno:
        // 1) Validar y cargar datos
        // 2) Revisar estados (dormido, confusion, etc.)
        // 3) Resolver precision/tipo/critico/daño
        // 4) Aplicar efectos de final de turno
        // 5) Devolver mensaje listo para mostrar
        validarSolicitudTurno(request);

        Usuario usuario = obtenerUsuarioPorNombreUsuario(username);
        PokemonUsuario atacante = obtenerPokemonPorId(request.getAtacanteId(), "atacante");
        PokemonUsuario defensor = obtenerPokemonPorId(request.getDefensorId(), "defensor");

        if (!Objects.equals(atacante.getUsuarioId(), usuario.getIdUsuario())) {
            throw new RuntimeException("El atacante no pertenece al usuario autenticado.");
        }

        if (Objects.equals(defensor.getUsuarioId(), usuario.getIdUsuario())) {
            throw new RuntimeException("No puedes atacar a un Pokemon de tu propio equipo.");
        }

        if (nvl(atacante.getHpActual(), 0) <= 0) {
            throw new RuntimeException("El Pokemon atacante esta debilitado.");
        }
        if (nvl(defensor.getHpActual(), 0) <= 0) {
            throw new RuntimeException("El Pokemon defensor ya esta debilitado.");
        }

        MovimientoSeleccionado selectedMove = resolverMovimiento(atacante, request);
        Ataques movimiento = selectedMove.ataque();

        PokedexMaestra atacanteMaestro = obtenerPokedexPorId(atacante.getPokedexId(), "atacante");
        PokedexMaestra defensorMaestro = obtenerPokedexPorId(defensor.getPokedexId(), "defensor");

        String mensajeBloqueo = verificarEstadoPreTurno(atacante);
        if (mensajeBloqueo != null) {
            String residualAtacante = aplicarEfectosPostTurno(atacante);
            pokemonUsuarioRepository.save(atacante);

            return construirRespuestaSinDanio(
                nvl(defensor.getHpActual(), 0),
                anexarMensajes(mensajeBloqueo, residualAtacante)
            );
        }

        int precision = nvl(movimiento.getPrecisionBase(), 100);
        if (!calculoService.verificaImpacto(precision)) {
            String residualDefensor = aplicarEfectosPostTurno(defensor);
            String residualAtacante = aplicarEfectosPostTurno(atacante);
            pokemonUsuarioRepository.save(defensor);
            pokemonUsuarioRepository.save(atacante);

            return construirRespuestaSinDanio(
                nvl(defensor.getHpActual(), 0),
                anexarMensajes("El movimiento fallo.", residualAtacante, residualDefensor)
            );
        }

        boolean esEspecial = "special".equalsIgnoreCase(textoPorDefecto(movimiento.getCategoria()));
        boolean esEstado = "status".equalsIgnoreCase(textoPorDefecto(movimiento.getCategoria()))
            || nvl(movimiento.getPotencia(), 0) <= 0;

        if (esEstado) {
            String residualDefensor = aplicarEfectosPostTurno(defensor);
            String residualAtacante = aplicarEfectosPostTurno(atacante);
            pokemonUsuarioRepository.save(defensor);
            pokemonUsuarioRepository.save(atacante);

            String mensajeEstado = "El movimiento no causa daño directo.";
            return construirRespuestaSinDanio(
                nvl(defensor.getHpActual(), 0),
                anexarMensajes(mensajeEstado, residualAtacante, residualDefensor)
            );
        }

        String tipoAtaque = textoPorDefecto(movimiento.getTipo()).toLowerCase(Locale.ROOT);
        double multiplicadorTipo = tipoService.calcularEfectividad(
            tipoAtaque,
            defensorMaestro.getTipo_1(),
            defensorMaestro.getTipo_2()
        );

        boolean esMismoTipo = esMismoTipo(tipoAtaque, atacanteMaestro.getTipo_1(), atacanteMaestro.getTipo_2());
        boolean golpeCritico = calculoService.fueGolpeCritico();
        double multiplicadorFinal = golpeCritico ? multiplicadorTipo * 2.0 : multiplicadorTipo;

        int ataqueStat = esEspecial ? nvl(atacante.getAtaqueEspecialStat(), 1) : nvl(atacante.getAtaqueStat(), 1);
        int defensaStat = esEspecial ? nvl(defensor.getDefensaEspecialStat(), 1) : nvl(defensor.getDefensaStat(), 1);

        int danoInfligido = calculoService.calcularDanio(
            nvl(atacante.getNivel(), 1),
            ataqueStat,
            defensaStat,
            nvl(movimiento.getPotencia(), 0),
            multiplicadorFinal,
            esMismoTipo,
            atacante.getEstado(),
            !esEspecial
        );

        int hpDefensorRestante = Math.max(0, nvl(defensor.getHpActual(), 0) - danoInfligido);
        defensor.setHpActual(hpDefensorRestante);

        String mensajeEfectividad = tipoService.obtenerMensajeEfectividad(multiplicadorTipo);
        String residualDefensor = aplicarEfectosPostTurno(defensor);
        String residualAtacante = aplicarEfectosPostTurno(atacante);

        pokemonUsuarioRepository.save(defensor);
        pokemonUsuarioRepository.save(atacante);

        String nombreMovimiento = textoPorDefecto(movimiento.getNombre());
        String ppMsg = selectedMove.fromMoveSet()
            ? "PP " + selectedMove.ppRestante() + "/" + selectedMove.ppMax() + "."
            : "";

        String mensajeGeneral = anexarMensajes(
            "El Pokemon uso " + nombreMovimiento + ".",
            golpeCritico ? "Golpe critico." : "",
            mensajeEfectividad,
            ppMsg,
            residualAtacante,
            residualDefensor
        );

        return RespuestaTurno.builder()
            .dañoInfligido(danoInfligido)
            .hpRestanteDefensor(hpDefensorRestante)
            .multiplicadorFinal(multiplicadorFinal)
            .golpeCritico(golpeCritico)
            .mensajeEfectividad(mensajeEfectividad)
            .defensorDerrotado(hpDefensorRestante == 0)
            .mensajeGeneral(mensajeGeneral)
            .build();
    }

    @Transactional
    // intentarCaptura.
    public String intentarCaptura(String username, SolicitudCaptura request) {
        // Flujo de captura:
        // - Comprueba que se pueda lanzar la ball
        // - Gasta 1 unidad del inventario
        // - Calcula si entra o no
        // - Si entra, pasa a ser del usuario
        Usuario usuario = obtenerUsuarioPorNombreUsuario(username);
        PokemonUsuario salvaje = obtenerPokemonPorId(request.getDefensorId(), "salvaje");

        if (Objects.equals(salvaje.getUsuarioId(), usuario.getIdUsuario())) {
            throw new RuntimeException("No puedes capturar un Pokemon que ya es tuyo.");
        }

        if (nvl(salvaje.getHpActual(), 0) <= 0) {
            throw new RuntimeException("No puedes capturar un Pokemon debilitado.");
        }

        PokedexMaestra datosMaestros = obtenerPokedexPorId(salvaje.getPokedexId(), "salvaje");
        Item ball = resolverPokeballCaptura(request.getNombreBall());

        InventarioUsuario inventario = inventarioRepository.findByUsuarioAndItem(usuario, ball)
            .orElseThrow(() -> new RuntimeException("No tienes " + textoPorDefecto(request.getNombreBall()) + "."));

        if (nvl(inventario.getCantidad(), 0) <= 0) {
            throw new RuntimeException("Te has quedado sin " + ball.getNombre() + ".");
        }

        inventario.setCantidad(inventario.getCantidad() - 1);
        inventarioRepository.save(inventario);

        double bonoBall = resolverBonoCaptura(ball);
        int ratioCaptura = nvl(datosMaestros.getRatioCaptura(), 45);

        boolean atrapado = calculoService.calcularCaptura(
            nvl(salvaje.getHpMax(), 1),
            nvl(salvaje.getHpActual(), 1),
            ratioCaptura,
            bonoBall,
            salvaje.getEstado()
        );

        if (atrapado) {
            salvaje.setUsuarioId(usuario.getIdUsuario());
            salvaje.setPosicionEquipo(resolverSiguientePosicionEquipo(usuario.getIdUsuario()));
            pokemonUsuarioRepository.save(salvaje);
            return datosMaestros.getNombre() + " ha sido capturado.";
        }

        return "El Pokemon salvaje se ha escapado.";
    }

    // Primero valido una condicion antes de continuar.
    private void validarSolicitudTurno(SolicitudTurno request) {
        if (request == null) {
            throw new RuntimeException("Request de turno vacio.");
        }
        if (request.getAtacanteId() == null || request.getDefensorId() == null) {
            throw new RuntimeException("atacanteId y defensorId son obligatorios.");
        }
    }

    // resolverMovimiento.
    private MovimientoSeleccionado resolverMovimiento(PokemonUsuario atacante, SolicitudTurno request) {
        // Si viene movimiento concreto, usamos ese.
        // Si es cliente antiguo, usamos modo legacy.
        // Si no viene nada, usa el primer movimiento con PP.
        if (request.getMovimientoId() != null) {
            return consumirMovimientoDelConjunto(atacante, request.getMovimientoId().intValue());
        }

        // Compatibilidad temporal con clientes antiguos.
        if (request.getTipoAtaque() != null && request.getPotenciaMovimiento() != null) {
            return new MovimientoSeleccionado(resolverMovimientoLegado(request), null, null, false);
        }

        List<HuecoMovimiento> slots = construirHuecosMovimientos(atacante);
        HuecoMovimiento first = slots.stream()
            .filter(slot -> slot.ppActual() > 0)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("No quedan PP en ningun movimiento."));

        return consumirMovimientoDelConjunto(atacante, first.ataque().getIdAtaque());
    }

    // consumirMovimientoDelConjunto.
    private MovimientoSeleccionado consumirMovimientoDelConjunto(PokemonUsuario atacante, int movimientoId) {
        List<HuecoMovimiento> slots = construirHuecosMovimientos(atacante);
        HuecoMovimiento selected = slots.stream()
            .filter(slot -> Objects.equals(slot.ataque().getIdAtaque(), movimientoId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("El movimiento no pertenece al moveset actual del Pokemon."));

        if (selected.ppActual() <= 0) {
            throw new RuntimeException("No quedan PP para ese movimiento.");
        }

        if (atacante.getId() == null) {
            throw new RuntimeException("Pokemon atacante sin identificador persistido.");
        }
        int ppRestante = selected.ppActual() - 1;
        moveStateRepository.actualizarPpActual(atacante.getId(), movimientoId, ppRestante);

        return new MovimientoSeleccionado(selected.ataque(), ppRestante, selected.ppMax(), true);
    }

    // construirHuecosMovimientos.
    private List<HuecoMovimiento> construirHuecosMovimientos(PokemonUsuario pokemon) {
        // Monta el moveset activo y sincroniza los PP guardados en DB.
        List<Ataques> moves = resolverMovimientosParaPokemon(pokemon);

        if (pokemon.getId() == null) {
            throw new RuntimeException("Pokemon sin identificador persistido.");
        }

        Map<Integer, RepositorioEstadoMovimientoPokemon.EstadoPpMovimiento> persistedByMoveId = moveStateRepository.buscarPorPokemonId(pokemon.getId())
            .stream()
            .collect(Collectors.toMap(
                RepositorioEstadoMovimientoPokemon.EstadoPpMovimiento::moveId,
                row -> row,
                (a, b) -> a,
                HashMap::new
            ));

        List<HuecoMovimiento> slots = new ArrayList<>();
        Set<Integer> validMoveIds = new HashSet<>();
        int slotIndex = 0;

        for (Ataques move : moves) {
            if (move == null || move.getIdAtaque() == null) {
                continue;
            }

            int moveId = move.getIdAtaque();
            int ppMax = Math.max(1, nvl(move.getPpBase(), 1));
            int ppActual = ppMax;

            RepositorioEstadoMovimientoPokemon.EstadoPpMovimiento row = persistedByMoveId.get(moveId);
            if (row != null) {
                ppActual = Math.max(0, Math.min(row.ppActual(), ppMax));
            }

            validMoveIds.add(moveId);
            moveStateRepository.insertarOActualizar(pokemon.getId(), moveId, slotIndex, ppActual);
            slots.add(new HuecoMovimiento(move, ppActual, ppMax));
            slotIndex++;
        }

        moveStateRepository.eliminarPorPokemonIdYNoEn(pokemon.getId(), validMoveIds);
        return slots;
    }

    // resolverMovimientosParaPokemon.
    private List<Ataques> resolverMovimientosParaPokemon(PokemonUsuario pokemon) {
        // Busca los movimientos que deberia tener por nivel en Gold/Silver.
        // Si no hay datos suficientes, cae al fallback.
        List<MovimientoAprendizaje> learnset = obtenerAprendizajePorEspecie(nvl(pokemon.getPokedexId(), 0));
        int currentLevel = nvl(pokemon.getNivel(), 1);

        List<MovimientoAprendizaje> eligible = learnset.stream()
            .filter(move -> move.levelLearnedAt() <= currentLevel)
            .sorted(Comparator.comparingInt(MovimientoAprendizaje::levelLearnedAt).thenComparing(MovimientoAprendizaje::moveId))
            .toList();

        if (eligible.isEmpty() && !learnset.isEmpty()) {
            eligible = List.of(learnset.get(0));
        }

        if (eligible.size() > MAX_ACTIVE_MOVES) {
            eligible = eligible.subList(eligible.size() - MAX_ACTIVE_MOVES, eligible.size());
        }

        List<Ataques> moves = new ArrayList<>();
        for (MovimientoAprendizaje learnsetMove : eligible) {
            ataquesRepository.findById(learnsetMove.moveId()).ifPresent(moves::add);
        }

        if (!moves.isEmpty()) {
            return moves;
        }

        return resolverMovimientosAlternativos(nvl(pokemon.getPokedexId(), 0));
    }

    // Devuelvo este dato para reutilizarlo en otras partes.
    private List<MovimientoAprendizaje> obtenerAprendizajePorEspecie(Integer pokedexId) {
        if (pokedexId == null || pokedexId <= 0) {
            return List.of();
        }
        return learnsetCache.computeIfAbsent(pokedexId, this::consultarAprendizajePorEspecie);
    }

    // consultarAprendizajePorEspecie.
    private List<MovimientoAprendizaje> consultarAprendizajePorEspecie(Integer pokedexId) {
        // Lee la estructura de PokeAPI y se queda solo con movimientos
        // aprendidos por nivel en version gold-silver.
        try {
            Map<String, Object> details = pokeApiService.obtenerDetallesPokemon(String.valueOf(pokedexId)).block();
            if (details == null) {
                return List.of();
            }

            Object rawMoves = details.get("moves");
            if (!(rawMoves instanceof List<?> movesList)) {
                return List.of();
            }

            Map<Integer, Integer> minLearnLevelByMoveId = new HashMap<>();

            for (Object rawMoveEntry : movesList) {
                if (!(rawMoveEntry instanceof Map<?, ?> moveEntry)) {
                    continue;
                }

                String moveName = leerNombreAnidado(moveEntry.get("move"));
                if (moveName.isBlank()) {
                    continue;
                }

                Optional<Ataques> attackOpt = ataquesRepository.findByNombreIgnoreCase(moveName);
                if (attackOpt.isEmpty()) {
                    continue;
                }

                int learnedAt = resolverNivelAprendizajeOroPlata(moveEntry.get("version_group_details"));
                if (learnedAt < 0) {
                    continue;
                }

                int moveId = attackOpt.get().getIdAtaque();
                minLearnLevelByMoveId.merge(moveId, learnedAt, Math::min);
            }

            return minLearnLevelByMoveId.entrySet().stream()
                .map(entry -> new MovimientoAprendizaje(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingInt(MovimientoAprendizaje::levelLearnedAt).thenComparing(MovimientoAprendizaje::moveId))
                .toList();
        } catch (Exception ignored) {
            return List.of();
        }
    }

    // resolverNivelAprendizajeOroPlata.
    private int resolverNivelAprendizajeOroPlata(Object rawVersionDetails) {
        if (!(rawVersionDetails instanceof List<?> detailsList)) {
            return -1;
        }

        int level = Integer.MAX_VALUE;
        for (Object rawDetail : detailsList) {
            if (!(rawDetail instanceof Map<?, ?> detail)) {
                continue;
            }

            String versionGroup = leerNombreAnidado(detail.get("version_group"));
            String learnMethod = leerNombreAnidado(detail.get("move_learn_method"));
            if (!VERSION_GROUP_GS.equalsIgnoreCase(versionGroup)) {
                continue;
            }
            if (!"level-up".equalsIgnoreCase(learnMethod)) {
                continue;
            }

            int levelLearned = aEntero(detail.get("level_learned_at"), 0);
            level = Math.min(level, levelLearned);
        }

        return level == Integer.MAX_VALUE ? -1 : level;
    }

    // resolverMovimientosAlternativos.
    private List<Ataques> resolverMovimientosAlternativos(Integer pokedexId) {
        // Plan B: si no hay learnset util, damos moves basicos por tipo.
        String primaryType = pokedexMasterRepository.findById(pokedexId)
            .map(PokedexMaestra::getTipo_1)
            .map(type -> type.toLowerCase(Locale.ROOT))
            .orElse("normal");

        List<String> candidates = new ArrayList<>();
        candidates.add("tackle");
        candidates.add("growl");

        switch (primaryType) {
            case "fire" -> {
                candidates.add("ember");
                candidates.add("smokescreen");
            }
            case "water" -> {
                candidates.add("water-gun");
                candidates.add("bubble");
            }
            case "grass" -> {
                candidates.add("vine-whip");
                candidates.add("razor-leaf");
            }
            case "electric" -> {
                candidates.add("thunder-shock");
                candidates.add("quick-attack");
            }
            default -> {
                candidates.add("quick-attack");
                candidates.add("scratch");
            }
        }

        LinkedHashMap<Integer, Ataques> selected = new LinkedHashMap<>();
        for (String name : candidates) {
            ataquesRepository.findByNombreIgnoreCase(name).ifPresent(move -> selected.putIfAbsent(move.getIdAtaque(), move));
            if (selected.size() >= MAX_ACTIVE_MOVES) {
                break;
            }
        }

        // Fallback final por IDs clásicos muy comunes en Gen I/II.
        for (int id : List.of(33, 45, 98, 10, 52, 55, 84)) {
            ataquesRepository.findById(id).ifPresent(move -> selected.putIfAbsent(move.getIdAtaque(), move));
            if (selected.size() >= MAX_ACTIVE_MOVES) {
                break;
            }
        }

        return selected.values().stream().limit(MAX_ACTIVE_MOVES).toList();
    }

    // resolverMovimientoLegado.
    private Ataques resolverMovimientoLegado(SolicitudTurno request) {
        Ataques fallback = new Ataques();
        fallback.setIdAtaque(-1);
        fallback.setNombre(textoPorDefecto(request.getTipoAtaque()));
        fallback.setTipo(textoPorDefecto(request.getTipoAtaque()));
        fallback.setCategoria(Boolean.TRUE.equals(request.getEsEspecial()) ? "special" : "physical");
        fallback.setPotencia(nvl(request.getPotenciaMovimiento(), 0));
        fallback.setPrecisionBase(100);
        fallback.setPpBase(1);
        return fallback;
    }

    // esMismoTipo.
    private boolean esMismoTipo(String tipoAtaque, String tipo1, String tipo2) {
        String move = textoPorDefecto(tipoAtaque).toLowerCase(Locale.ROOT);
        String t1 = textoPorDefecto(tipo1).toLowerCase(Locale.ROOT);
        String t2 = textoPorDefecto(tipo2).toLowerCase(Locale.ROOT);
        return move.equals(t1) || move.equals(t2);
    }

    
    private String verificarEstadoPreTurno(PokemonUsuario pkm) {
        // Estados que pueden bloquear el turno o hacer autodano.
        if (pkm.getEstado() == Estado.CONGELADO) {
            if (Math.random() < 0.1) {
                pkm.setEstado(Estado.SALUDABLE);
                return "El Pokemon se ha descongelado.";
            }
            return "El Pokemon esta congelado.";
        }

        if (pkm.getEstado() == Estado.DORMIDO) {
            if (nvl(pkm.getTurnosSueno(), 0) > 0) {
                pkm.setTurnosSueno(pkm.getTurnosSueno() - 1);
                return "El Pokemon esta durmiendo.";
            }
            pkm.setEstado(Estado.SALUDABLE);
            return "El Pokemon se desperto.";
        }

        if (pkm.getEstado() == Estado.PARALIZADO && Math.random() < 0.25) {
            return "El Pokemon esta paralizado y no puede moverse.";
        }

        if (nvl(pkm.getTurnosConfusion(), 0) > 0) {
            pkm.setTurnosConfusion(pkm.getTurnosConfusion() - 1);
            if (Math.random() < 0.5) {
                int autoDano = calculoService.calcularDanio(
                    nvl(pkm.getNivel(), 1),
                    nvl(pkm.getAtaqueStat(), 1),
                    nvl(pkm.getDefensaStat(), 1),
                    40,
                    1.0,
                    false,
                    null,
                    false
                );
                pkm.setHpActual(Math.max(0, nvl(pkm.getHpActual(), 0) - autoDano));
                return "Esta confuso y se hirio a si mismo.";
            }
        }

        return null;
    }

    
    private String aplicarEfectosPostTurno(PokemonUsuario pkm) {
        // Dano residual al final del turno (veneno, quemadura, drenadoras...).
        int hpMax = nvl(pkm.getHpMax(), 1);
        int dano = 0;
        String msg = "";

        if (pkm.getEstado() == Estado.QUEMADO) {
            dano = Math.max(1, hpMax / 8);
            msg = "La quemadura resta PS.";
        } else if (pkm.getEstado() == Estado.ENVENENADO) {
            dano = Math.max(1, hpMax / 8);
            msg = "El veneno resta PS.";
        } else if (pkm.getEstado() == Estado.GRAVE_ENVENENADO) {
            pkm.setContadorToxico(nvl(pkm.getContadorToxico(), 0) + 1);
            dano = Math.max(1, hpMax * pkm.getContadorToxico() / 16);
            msg = "El veneno empeora.";
        }

        if (Boolean.TRUE.equals(pkm.getTieneDrenadoras())) {
            dano += Math.max(1, hpMax / 8);
            msg = anexarMensajes(msg, "Las drenadoras quitan PS.");
        }

        if (dano > 0) {
            pkm.setHpActual(Math.max(0, nvl(pkm.getHpActual(), 0) - dano));
        }

        return msg;
    }

    // resolverPokeballCaptura.
    private Item resolverPokeballCaptura(String requestedName) {
        String raw = textoPorDefecto(requestedName).trim();
        if (raw.isEmpty()) {
            throw new RuntimeException("nombreBall es obligatorio.");
        }

        List<String> candidates = List.of(
            raw,
            raw.replace(" ", "-"),
            raw.replace("-", " ")
        );

        for (String candidate : candidates) {
            Optional<Item> item = itemRepository.findByNombreIgnoreCase(candidate);
            if (item.isPresent() && esPokeballCaptura(item.get())) {
                return item.get();
            }
        }

        throw new RuntimeException("La Pokeball indicada no existe.");
    }

    // esPokeballCaptura.
    private boolean esPokeballCaptura(Item item) {
        String effect = textoPorDefecto(item.getEfecto()).toUpperCase(Locale.ROOT);
        return effect.startsWith("CAPTURE_");
    }

    // resolverBonoCaptura.
    private double resolverBonoCaptura(Item ball) {
        String effect = textoPorDefecto(ball.getEfecto()).toUpperCase(Locale.ROOT);
        return switch (effect) {
            case "CAPTURE_1.0" -> 1.0;
            case "CAPTURE_1.5" -> 1.5;
            case "CAPTURE_2.0" -> 2.0;
            case "CAPTURE_MAX" -> 255.0;
            default -> 1.0;
        };
    }

    // resolverSiguientePosicionEquipo.
    private int resolverSiguientePosicionEquipo(Long userId) {
        // Mete el Pokémon nuevo en hueco libre del equipo.
        // Si el equipo esta lleno, lo manda a caja (PC).
        List<PokemonUsuario> owned = pokemonUsuarioRepository.findByUsuarioId(userId);
        boolean[] usedParty = new boolean[PARTY_LIMIT];
        int maxBoxPosition = PARTY_LIMIT - 1;

        for (PokemonUsuario pokemon : owned) {
            int pos = nvl(pokemon.getPosicionEquipo(), PARTY_LIMIT);
            if (pos >= 0 && pos < PARTY_LIMIT) {
                usedParty[pos] = true;
            } else if (pos >= PARTY_LIMIT) {
                maxBoxPosition = Math.max(maxBoxPosition, pos);
            }
        }

        for (int i = 0; i < PARTY_LIMIT; i++) {
            if (!usedParty[i]) {
                return i;
            }
        }

        return maxBoxPosition + 1;
    }

   
    private RespuestaTurno construirRespuestaSinDanio(int hpDefensor, String mensajeGeneral) {
        return RespuestaTurno.builder()
            .dañoInfligido(0)
            .hpRestanteDefensor(hpDefensor)
            .multiplicadorFinal(1.0)
            .golpeCritico(false)
            .mensajeEfectividad("")
            .defensorDerrotado(hpDefensor == 0)
            .mensajeGeneral(mensajeGeneral)
            .build();
    }

    // anexarMensajes.
    private String anexarMensajes(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            String value = textoPorDefecto(part).trim();
            if (!value.isEmpty()) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(value);
            }
        }
        return sb.toString();
    }

    // Devuelvo para reutilizarlo en otras partes.
    private Usuario obtenerUsuarioPorNombreUsuario(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
    }

    
    private PokemonUsuario obtenerPokemonPorId(Long id, String role) {
        return pokemonUsuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pokemon " + role + " no encontrado: " + id));
    }

    
    private PokedexMaestra obtenerPokedexPorId(Integer id, String role) {
        return pokedexMasterRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Datos de Pokedex no encontrados para " + role + ": " + id));
    }

    // leerNombreAnidado.
    private String leerNombreAnidado(Object raw) {
        if (!(raw instanceof Map<?, ?> map)) {
            return "";
        }
        Object name = map.get("name");
        if (name == null) {
            return "";
        }
        return String.valueOf(name);
    }

    // aEntero.
    private int aEntero(Object raw, int defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        if (raw instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(raw));
        } catch (NumberFormatException ignored) {
            return defaultValue;
        }
    }

    // nvl.
    private int nvl(Integer value, int defaultValue) {
        return value == null ? defaultValue : value;
    }

    // textoPorDefecto.
    private String textoPorDefecto(String value) {
        return value == null ? "" : value;
    }

    private record MovimientoAprendizaje(Integer moveId, int levelLearnedAt) {}

    private record HuecoMovimiento(Ataques ataque, int ppActual, int ppMax) {}

    private record MovimientoSeleccionado(Ataques ataque, Integer ppRestante, Integer ppMax, boolean fromMoveSet) {}
}

