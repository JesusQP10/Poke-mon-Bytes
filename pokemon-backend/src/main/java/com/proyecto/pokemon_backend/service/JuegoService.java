package com.proyecto.pokemon_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyecto.pokemon_backend.exception.ErrorNegocio;
import com.proyecto.pokemon_backend.exception.RecursoNoEncontrado;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.model.PokemonUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.model.enums.Estado;
import java.util.Locale;
import com.proyecto.pokemon_backend.repository.RepositorioEstadoMovimientoPokemon;
import com.proyecto.pokemon_backend.repository.RepositorioInventarioUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioObjeto;
import com.proyecto.pokemon_backend.repository.RepositorioPokedexMaestra;
import com.proyecto.pokemon_backend.repository.RepositorioPokemonUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Partida single-player persistida: equipo y starter, dinero, inventario en tablas, guardado de
 * posición/mapas y blob {@code estadoCliente}. También reinicio completo (nueva partida).
 */
@Service
public class JuegoService {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static final List<Integer> STARTERS_JOHTO = List.of(152, 155, 158);
    private static final String SPRITE_URL =
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/%d.png";

    private final RepositorioUsuario userRepo;
    private final RepositorioPokemonUsuario pokemonRepo;
    private final RepositorioPokedexMaestra pokedexRepo;
    private final RepositorioInventarioUsuario inventarioRepo;
    private final RepositorioObjeto itemRepo;
    private final RepositorioEstadoMovimientoPokemon estadoMovimientoRepo;

    /**
     * Inyecta repositorios de usuario, equipo, catálogo, mochila, ítems y PP por movimiento.
     */
    public JuegoService(
        RepositorioUsuario userRepo,
        RepositorioPokemonUsuario pokemonRepo,
        RepositorioPokedexMaestra pokedexRepo,
        RepositorioInventarioUsuario inventarioRepo,
        RepositorioObjeto itemRepo,
        RepositorioEstadoMovimientoPokemon estadoMovimientoRepo
    ) {
        this.userRepo = userRepo;
        this.pokemonRepo = pokemonRepo;
        this.pokedexRepo = pokedexRepo;
        this.inventarioRepo = inventarioRepo;
        this.itemRepo = itemRepo;
        this.estadoMovimientoRepo = estadoMovimientoRepo;
    }

    /**
     * Nueva partida en BD: deja al usuario como recién creado en cuanto a Pokémon, mochila y JSON de cliente.
     * Las medallas siguen en el mapa vacío por ahora; el mapa/spawn coinciden con lo que espera el overworld.
     */
    @Transactional
    public Map<String, Object> reiniciarPartida(String username) {
        Usuario u = cargarUsuario(username);
        Long uid = u.getIdUsuario();
        List<PokemonUsuario> owned = pokemonRepo.findByUsuarioId(uid);
        // Hay FK o tablas de PP por Pokémon: limpiar antes de borrar la fila del monstruo
        for (PokemonUsuario p : owned) {
            estadoMovimientoRepo.eliminarPorPokemonId(p.getId());
        }
        pokemonRepo.deleteByUsuarioId(uid);
        inventarioRepo.deleteAllByUsuarioId(uid);

        u.setDinero(300);
        u.setMapaActual("player-room");
        u.setPosX(5);
        u.setPosY(7);
        u.setEstadoClienteJson(null);
        userRepo.save(u);
        return obtenerEstado(username);
    }

    /**
     * Foto actual del jugador para hidratar el cliente: equipo enriquecido desde Pokédex maestra, dinero e
     * inventario desde tablas, más {@code estadoCliente} si el blob en usuario no es null.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerEstado(String username) {
        Usuario usuario = cargarUsuario(username);
        List<Map<String, Object>> equipo = equipoOrdenado(usuario.getIdUsuario()).stream()
            .map(this::toDto)
            .toList();

        Map<String, Object> estado = new HashMap<>();
        estado.put("starter",    equipo.isEmpty() ? null : equipo.get(0));
        estado.put("team",       equipo);
        estado.put("badges",     List.of());
        estado.put("money",      usuario.getDinero());
        estado.put("inventario", inventarioADtos(usuario));
        estado.put("mapaActual", usuario.getMapaActual());
        estado.put("posX",       usuario.getPosX());
        estado.put("posY",       usuario.getPosY());

        // Flags de historia / nombre / reloj serializados por el front; si el JSON está corrupto no rompemos el GET
        String blob = usuario.getEstadoClienteJson();
        if (blob != null && !blob.isBlank()) {
            try {
                estado.put("estadoCliente", JSON.readValue(blob, new TypeReference<Map<String, Object>>() {}));
            } catch (Exception ignored) {
                estado.put("estadoCliente", Map.of());
            }
        }
        return estado;
    }

    /**
     * Suma cantidad a la fila (usuario, ítem) o la crea en 0+cantidad. La clave compuesta evita duplicar tipos
     * de objeto para el mismo jugador.
     */
    @Transactional
    public List<Map<String, Object>> anadirAlInventario(
        String username,
        Integer itemId,
        String nombreItem,
        int cantidad
    ) {
        if (cantidad <= 0) {
            throw new ErrorNegocio("La cantidad debe ser mayor que cero.");
        }
        Usuario usuario = cargarUsuario(username);
        Item item = resolverItem(itemId, nombreItem);
        InventarioUsuario entrada = inventarioRepo.findByUsuarioAndItem(usuario, item)
            .orElse(new InventarioUsuario(usuario, item, 0));
        entrada.setCantidad(entrada.getCantidad() + cantidad);
        inventarioRepo.save(entrada);
        return inventarioADtos(usuario);
    }

    /**
     * Actualiza columnas “de mundo” del usuario y, si viene, el JSON de cliente. No modifica dinero ni
     * inventario: el front no debe mandar eso aquí para evitar trampas o desincronización.
     */
    @SuppressWarnings("null")
    @Transactional
    public Map<String, Object> guardarPartida(String username, Map<String, Object> body) {
        if (body == null) {
            body = Map.of();
        }
        Usuario u = cargarUsuario(username);

        Object px = body.get("posX");
        Object py = body.get("posY");
        if (px instanceof Number) {
            u.setPosX(((Number) px).intValue());
        }
        if (py instanceof Number) {
            u.setPosY(((Number) py).intValue());
        }
        Object mapa = body.get("mapaActual");
        if (mapa != null && !String.valueOf(mapa).isBlank()) {
            u.setMapaActual(String.valueOf(mapa));
        }

        Object ec = body.get("estadoCliente");
        if (ec != null) {
            try {
                // El cliente a veces manda Map (Jackson) y otras un String ya serializado
                if (ec instanceof String s && !s.isBlank()) {
                    u.setEstadoClienteJson(s);
                } else if (ec instanceof Map<?, ?> map) {
                    u.setEstadoClienteJson(JSON.writeValueAsString(map));
                } else {
                    u.setEstadoClienteJson(JSON.writeValueAsString(ec));
                }
            } catch (Exception e) {
                throw new ErrorNegocio("No se pudo guardar el estado del cliente.");
            }
        }

        userRepo.save(u);

        sincronizarHpPokemonConTeamClienteEnBlob(u);

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Partida guardada.");
        resp.put("posX", u.getPosX());
        resp.put("posY", u.getPosY());
        resp.put("mapaActual", u.getMapaActual());
        return resp;
    }

    /**
     * Alinea {@code hp_actual} en BD con {@code teamCliente} del JSON guardado (último POST /guardar).
     * También borra los registros de PP persistidos en batalla: el siguiente combate los reiniciará a ppMax.
     * Sin esto, recargar sin guardar dejaba PS y PP del combate en BD aunque el jugador no hubiera guardado.
     */
    @Transactional
    public void sincronizarHpEquipoDesdeBlobGuardado(String username) {
        Usuario u = cargarUsuario(username);
        sincronizarHpPokemonConTeamClienteEnBlob(u);
        for (PokemonUsuario p : pokemonRepo.findByUsuarioId(u.getIdUsuario())) {
            int pos = nvl(p.getPosicionEquipo(), 99);
            if (pos >= 0 && pos <= 5) {
                estadoMovimientoRepo.eliminarPorPokemonId(p.getId());
            }
        }
    }

    /**
     * Inserta un {@link PokemonUsuario} en posición 0 con stats derivadas de {@link PokedexMaestra}.
     * Idempotente: si el usuario ya tiene equipo (p. ej. doble click en el lab), no crea otro.
     */
    @Transactional
    public Map<String, Object> elegirStarter(String username, Integer starterId) {
        if (starterId == null) {
            throw new ErrorNegocio("starterId es obligatorio.");
        }
        if (!STARTERS_JOHTO.contains(starterId)) {
            throw new ErrorNegocio("Solo puedes elegir a Chikorita (152), Cyndaquil (155) o Totodile (158).");
        }

        Usuario usuario = cargarUsuario(username);
        List<PokemonUsuario> equipo = equipoOrdenado(usuario.getIdUsuario());

        if (!equipo.isEmpty()) {
            return Map.of("starter", toDto(equipo.get(0)));
        }

        PokedexMaestra especie = pokedexRepo.findById(starterId)
            .orElseThrow(() -> new RecursoNoEncontrado("Pokémon no encontrado en Pokédex: " + starterId));

        PokemonUsuario starter = new PokemonUsuario();
        starter.setUsuarioId(usuario.getIdUsuario());
        starter.setPokedexId(starterId);
        starter.setNivel(5);
        starter.setExperiencia(0);
        starter.setPosicionEquipo(0);

        int hpMax = Math.max(20, nvl(especie.getStat_base_hp(), 20) + 10);
        starter.setHpMax(hpMax);
        starter.setHpActual(hpMax);
        starter.setAtaqueStat(Math.max(5, nvl(especie.getStat_base_ataque(), 10)));
        starter.setDefensaStat(Math.max(5, nvl(especie.getStat_base_defensa(), 10)));
        starter.setAtaqueEspecialStat(Math.max(5, nvl(especie.getStat_base_atq_especial(), 10)));
        starter.setDefensaEspecialStat(Math.max(5, nvl(especie.getStat_base_def_especial(), 10)));
        starter.setVelocidadStat(Math.max(5, nvl(especie.getStat_base_velocidad(), 10)));

        PokemonUsuario guardado = pokemonRepo.save(starter);
        return Map.of("starter", toDto(guardado));
    }

    /** Misma lista que {@link #obtenerEstado} en la clave {@code team}, sin el resto de campos del estado. */
    public List<Map<String, Object>> obtenerEquipo(String username) {
        Usuario usuario = cargarUsuario(username);
        return equipoOrdenado(usuario.getIdUsuario()).stream()
            .map(this::toDto)
            .toList();
    }

    /**
     * Centro Pokémon: equipo activo (posiciones 0–5) a PS máximos y sin estado alterado.
     * La caja ({@code posicionEquipo} ≥ 6) no se modifica.
     */
    @Transactional
    public Map<String, Object> curarEquipoEnCentro(String username) {
        Usuario usuario = cargarUsuario(username);
        for (PokemonUsuario p : pokemonRepo.findByUsuarioId(usuario.getIdUsuario())) {
            int pos = nvl(p.getPosicionEquipo(), 99);
            if (pos < 0 || pos > 5) {
                continue;
            }
            int max = Math.max(1, nvl(p.getHpMax(), 1));
            p.setHpActual(max);
            p.setEstado(Estado.SALUDABLE);
            p.setTurnosConfusion(0);
            p.setContadorToxico(0);
            p.setTurnosSueno(0);
            p.setTieneDrenadoras(false);
            pokemonRepo.save(p);
            estadoMovimientoRepo.eliminarPorPokemonId(p.getId());
        }
        Map<String, Object> res = new HashMap<>();
        res.put("mensaje", "¡Tu equipo ha recuperado la energía!");
        res.put("team", obtenerEquipo(username));
        return res;
    }

    // =========================================================================
    // HELPERS — DTOs para el front (nombres en inglés en parte del JSON por compatibilidad con Phaser)
    // =========================================================================

    /** Ensambla el mapa JSON que consume Phaser (sprite Gen II, tipos en inglés, stats de combate). */
    private Map<String, Object> toDto(PokemonUsuario p) {
        Integer pokedexId = p.getPokedexId();
        Optional<PokedexMaestra> especie = pokedexId != null ? pokedexRepo.findById(pokedexId) : Optional.empty();
        String nombre = especie.map(PokedexMaestra::getNombre).orElse("???");
        String tipo1es = especie.map(PokedexMaestra::getTipo_1).orElse("normal");
        String tipo1en = normalizarTipoParaFrontend(tipo1es);

        Map<String, Object> dto = new HashMap<>();
        dto.put("pokemonUsuarioId", p.getId());
        dto.put("id",               p.getPokedexId());
        dto.put("name",             nombre);
        dto.put("type",             tipo1en);
        dto.put("tipo1",            tipo1en);
        especie.map(PokedexMaestra::getTipo_2).filter(t -> t != null && !t.isBlank())
            .ifPresent(t2 -> dto.put("tipo2", normalizarTipoParaFrontend(t2)));
        dto.put("sprite",           String.format(SPRITE_URL, p.getPokedexId()));
        dto.put("nivel",            p.getNivel());
        dto.put("hpActual",         p.getHpActual());
        dto.put("hpMax",            p.getHpMax());
        dto.put("posicionEquipo",   p.getPosicionEquipo());
        dto.put("ataque",           p.getAtaqueStat());
        dto.put("defensa",          p.getDefensaStat());
        dto.put("ataqueEspecial",   p.getAtaqueEspecialStat());
        dto.put("defensaEspecial",  p.getDefensaEspecialStat());
        dto.put("velocidad",        p.getVelocidadStat());
        return dto;
    }

    /** Convierte nombres de tipo en español a inglés para el frontend. */
    private String normalizarTipoParaFrontend(String tipo) {
        if (tipo == null || tipo.isBlank()) return "normal";
        return switch (tipo.trim().toLowerCase()) {
            case "fuego"    -> "fire";
            case "agua"     -> "water";
            case "planta"   -> "grass";
            case "eléctrico", "electrico" -> "electric";
            case "hielo"    -> "ice";
            case "lucha"    -> "fighting";
            case "veneno"   -> "poison";
            case "tierra"   -> "ground";
            case "volador"  -> "flying";
            case "psíquico", "psiquico" -> "psychic";
            case "bicho"    -> "bug";
            case "roca"     -> "rock";
            case "fantasma" -> "ghost";
            case "dragón", "dragon" -> "dragon";
            case "siniestro" -> "dark";
            case "acero"    -> "steel";
            default         -> tipo.trim().toLowerCase();
        };
    }

    /** Pokémon del usuario en posiciones 0–5 (equipo activo), ordenados por posición. */
    private List<PokemonUsuario> equipoOrdenado(Long userId) {
        List<PokemonUsuario> equipo = pokemonRepo.findByUsuarioId(userId).stream()
            .filter(p -> nvl(p.getPosicionEquipo(), 100) < 6)
            .sorted(Comparator.comparingInt(p -> nvl(p.getPosicionEquipo(), 5)))
            .collect(java.util.stream.Collectors.toList());
        return equipo;
    }

    /** @throws RecursoNoEncontrado si el login no corresponde a ninguna fila */
    private Usuario cargarUsuario(String username) {
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new RecursoNoEncontrado("Usuario no encontrado."));
    }

    /**
     * Resuelve un ítem por PK o por nombre; exige exactamente uno de los dos criterios.
     *
     * @throws RecursoNoEncontrado si no hay coincidencia en catálogo
     * @throws ErrorNegocio si faltan ambos identificadores
     */
    private Item resolverItem(Integer itemId, String nombreItem) {
        if (itemId != null && itemId > 0) {
            return itemRepo.findById(itemId)
                .orElseThrow(() -> new RecursoNoEncontrado("Ítem no encontrado: id " + itemId));
        }
        if (nombreItem != null && !nombreItem.isBlank()) {
            return itemRepo.findByNombreIgnoreCase(nombreItem.trim())
                .orElseThrow(() -> new RecursoNoEncontrado("Ítem no encontrado: " + nombreItem));
        }
        throw new ErrorNegocio("Indica itemId o nombreItem.");
    }

    /**
     * Descarta {@code cantidad} unidades de un ítem del inventario.
     * Si la cantidad resultante llega a 0 o menos, elimina la fila completa.
     *
     * @throws ErrorNegocio si la cantidad es inválida o el jugador no tiene suficiente stock
     */
    @Transactional
    public List<Map<String, Object>> tirarDelInventario(
        String username,
        Integer itemId,
        String nombreItem,
        int cantidad
    ) {
        if (cantidad <= 0) {
            throw new ErrorNegocio("La cantidad debe ser mayor que cero.");
        }
        Usuario usuario = cargarUsuario(username);
        Item item = resolverItem(itemId, nombreItem);
        InventarioUsuario entrada = inventarioRepo.findByUsuarioAndItem(usuario, item)
            .orElseThrow(() -> new ErrorNegocio("No tienes ese ítem en la mochila."));
        int restante = entrada.getCantidad() - cantidad;
        if (restante < 0) {
            throw new ErrorNegocio("No tienes suficientes unidades de ese ítem.");
        }
        if (restante == 0) {
            inventarioRepo.delete(entrada);
        } else {
            entrada.setCantidad(restante);
            inventarioRepo.save(entrada);
        }
        return inventarioADtos(usuario);
    }

    /**
     * Aplica un ítem de la mochila a un Pokémon del equipo fuera de combate.
     * Descuenta 1 unidad del inventario y devuelve equipo + inventario actualizados.
     *
     * <p>Efectos soportados: {@code HEAL_N}, {@code HEAL_MAX}, {@code HEAL_MAX_STATUS},
     * {@code CURE_PSN/BRN/FRZ/SLP/PAR}, {@code CURE_ALL}.
     * Los ítems {@code CAPTURE_*} y {@code NONE} lanzan {@link ErrorNegocio}.</p>
     */
    @Transactional
    public Map<String, Object> usarItemFueraCombate(
        String username,
        Integer itemId,
        String nombreItem,
        Long pokemonObjetivoId
    ) {
        if (pokemonObjetivoId == null) {
            throw new ErrorNegocio("pokemonObjetivoId es obligatorio.");
        }
        Usuario usuario = cargarUsuario(username);
        Item item = resolverItem(itemId, nombreItem);

        InventarioUsuario entrada = inventarioRepo.findByUsuarioAndItem(usuario, item)
            .filter(inv -> nvl(inv.getCantidad(), 0) > 0)
            .orElseThrow(() -> new ErrorNegocio("No tienes ese ítem en la mochila."));

        PokemonUsuario pokemon = pokemonRepo.findById(pokemonObjetivoId)
            .orElseThrow(() -> new RecursoNoEncontrado("Pokémon no encontrado."));
        if (!Objects.equals(pokemon.getUsuarioId(), usuario.getIdUsuario())) {
            throw new ErrorNegocio("Ese Pokémon no es tuyo.");
        }

        String mensaje = aplicarEfectoItem(item.getEfecto(), pokemon);
        pokemonRepo.save(pokemon);

        int restante = entrada.getCantidad() - 1;
        if (restante == 0) {
            inventarioRepo.delete(entrada);
        } else {
            entrada.setCantidad(restante);
            inventarioRepo.save(entrada);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("mensaje", mensaje);
        res.put("team", obtenerEquipo(username));
        res.put("inventario", inventarioADtos(usuario));
        return res;
    }

    /**
     * Lógica de aplicación de efecto: valida estado del Pokémon, modifica sus stats y
     * devuelve el texto para la UI. No persiste — el caller hace {@code pokemonRepo.save}.
     */
    private String aplicarEfectoItem(String efecto, PokemonUsuario pokemon) {
        if (efecto == null) {
            throw new ErrorNegocio("Este ítem no se puede usar fuera de combate.");
        }
        String ef = efecto.toUpperCase(Locale.ROOT);

        if (ef.startsWith("CAPTURE_") || ef.equals("NONE")) {
            throw new ErrorNegocio("Este ítem no se puede usar fuera de combate.");
        }

        int hpActual = nvl(pokemon.getHpActual(), 0);
        int hpMax    = Math.max(1, nvl(pokemon.getHpMax(), 1));
        String nom   = nombrePokemon(pokemon);

        if (hpActual <= 0) {
            throw new ErrorNegocio("No puedes usar este ítem en un Pokémon debilitado.");
        }

        if (ef.startsWith("HEAL_")) {
            String sufijo = ef.substring(5);
            boolean esFullRestore = sufijo.equals("MAX_STATUS");
            boolean esMaxPotion   = sufijo.equals("MAX") || esFullRestore;

            boolean necesitaCura  = pokemon.getEstado() != Estado.SALUDABLE;
            boolean necesitaHeal  = hpActual < hpMax;

            if (esFullRestore && !necesitaHeal && !necesitaCura) {
                throw new ErrorNegocio(nom + " ya está en perfectas condiciones.");
            }
            if (!esFullRestore && !necesitaHeal) {
                throw new ErrorNegocio("Los PS de " + nom + " ya están al máximo.");
            }

            int recuperado;
            if (esMaxPotion) {
                recuperado = hpMax - hpActual;
                pokemon.setHpActual(hpMax);
            } else {
                int cantidad = Integer.parseInt(sufijo);
                recuperado = Math.min(cantidad, hpMax - hpActual);
                pokemon.setHpActual(hpActual + recuperado);
            }

            if (esFullRestore) {
                pokemon.setEstado(Estado.SALUDABLE);
                pokemon.setContadorToxico(0);
                pokemon.setTurnosSueno(0);
                return nom + " recuperó " + recuperado + " PS y fue curado de cualquier estado.";
            }
            return nom + " recuperó " + recuperado + " PS.";
        }

        // CURE_*
        Estado estadoActual = pokemon.getEstado();
        if (estadoActual == Estado.SALUDABLE) {
            throw new ErrorNegocio(nom + " no tiene ningún estado que curar.");
        }

        if (!ef.equals("CURE_ALL")) {
            boolean coincide = switch (ef) {
                case "CURE_PSN" -> estadoActual == Estado.ENVENENADO || estadoActual == Estado.GRAVE_ENVENENADO;
                case "CURE_BRN" -> estadoActual == Estado.QUEMADO;
                case "CURE_FRZ" -> estadoActual == Estado.CONGELADO;
                case "CURE_SLP" -> estadoActual == Estado.DORMIDO;
                case "CURE_PAR" -> estadoActual == Estado.PARALIZADO;
                default         -> false;
            };
            if (!coincide) {
                throw new ErrorNegocio("Ese ítem no cura el estado de " + nom + ".");
            }
        }

        pokemon.setEstado(Estado.SALUDABLE);
        pokemon.setContadorToxico(0);
        pokemon.setTurnosSueno(0);
        return nom + " fue curado de su estado alterado.";
    }

    /** Nombre de especie para mensajes, sin lanzar excepción si falta la fila. */
    private String nombrePokemon(PokemonUsuario p) {
        if (p == null || p.getPokedexId() == null) return "?";
        return pokedexRepo.findById(p.getPokedexId())
            .map(PokedexMaestra::getNombre)
            .orElse("?");
    }

    /** Usado tras comprar en tienda: devuelve la mochila tal como la vería {@link #obtenerEstado}. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarInventarioDtos(String username) {
        return inventarioADtos(cargarUsuario(username));
    }

    /** Omite líneas con cantidad 0 para no inflar la respuesta (el front agrupa por id/nombre). */
    private List<Map<String, Object>> inventarioADtos(Usuario usuario) {
        return inventarioRepo.findByUsuario(usuario).stream()
            .filter(e -> e.getCantidad() != null && e.getCantidad() > 0)
            .map(this::inventarioLineaDto)
            .collect(Collectors.toList());
    }

    /** ids duplicados por compatibilidad con distintas versiones del cliente. */
    private Map<String, Object> inventarioLineaDto(InventarioUsuario e) {
        Item it = e.getItem();
        Map<String, Object> m = new HashMap<>();
        m.put("itemId", it.getIdItem());
        m.put("id", it.getIdItem());
        m.put("nombre", it.getNombre());
        m.put("cantidad", e.getCantidad());
        m.put("efecto", it.getEfecto());
        return m;
    }

    /**
     * Lee {@code estadoClienteJson} del usuario y aplica {@code teamCliente[].hpActual} a cada fila
     * {@link PokemonUsuario} del jugador (ids que no coinciden o salvajes se ignoran).
     */
    private void sincronizarHpPokemonConTeamClienteEnBlob(Usuario usuario) {
        String blob = usuario.getEstadoClienteJson();
        if (blob == null || blob.isBlank()) {
            return;
        }
        Map<String, Object> ec;
        try {
            ec = JSON.readValue(blob, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return;
        }
        Object raw = ec.get("teamCliente");
        if (!(raw instanceof List<?> lista)) {
            return;
        }
        Long uid = usuario.getIdUsuario();
        for (Object o : lista) {
            if (!(o instanceof Map<?, ?> m)) {
                continue;
            }
            Long pokemonId = extraerLongId(m.get("pokemonUsuarioId"));
            if (pokemonId == null) {
                continue;
            }
            Object hpObj = m.get("hpActual");
            if (hpObj == null) {
                hpObj = m.get("hp");
            }
            if (hpObj == null) {
                continue;
            }
            int hp = ((Number) hpObj).intValue();
            Optional<PokemonUsuario> opt = pokemonRepo.findById(pokemonId);
            if (opt.isEmpty()) {
                continue;
            }
            PokemonUsuario p = opt.get();
            if (!Objects.equals(p.getUsuarioId(), uid)) {
                continue;
            }
            int max = Math.max(1, nvl(p.getHpMax(), 1));
            p.setHpActual(Math.max(0, Math.min(max, hp)));
            pokemonRepo.save(p);
        }
    }

    private static Long extraerLongId(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(o).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** {@code null}-safe: devuelve {@code defecto} si el Integer es null. */
    private int nvl(Integer value, int defecto) {
        return value == null ? defecto : value;
    }
}
