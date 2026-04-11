package com.proyecto.pokemon_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyecto.pokemon_backend.exception.ErrorNegocio;
import com.proyecto.pokemon_backend.exception.RecursoNoEncontrado;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.model.PokemonUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
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
import java.util.Optional;

/**
 * Lógica de negocio del estado del juego: equipo, starter, posición del jugador.
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

    public JuegoService(
        RepositorioUsuario userRepo,
        RepositorioPokemonUsuario pokemonRepo,
        RepositorioPokedexMaestra pokedexRepo
    ) {
        this.userRepo = userRepo;
        this.pokemonRepo = pokemonRepo;
        this.pokedexRepo = pokedexRepo;
    }

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
        estado.put("mapaActual", usuario.getMapaActual());
        estado.put("posX",       usuario.getPosX());
        estado.put("posY",       usuario.getPosY());

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
        Object money = body.get("money");
        if (money instanceof Number) {
            u.setDinero(((Number) money).intValue());
        }

        Object ec = body.get("estadoCliente");
        if (ec != null) {
            try {
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

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Partida guardada.");
        resp.put("posX", u.getPosX());
        resp.put("posY", u.getPosY());
        resp.put("mapaActual", u.getMapaActual());
        return resp;
    }

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

        // Si ya tiene starter, devolvemos el existente sin crear uno nuevo
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

    public List<Map<String, Object>> obtenerEquipo(String username) {
        Usuario usuario = cargarUsuario(username);
        return equipoOrdenado(usuario.getIdUsuario()).stream()
            .map(this::toDto)
            .toList();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private Map<String, Object> toDto(PokemonUsuario p) {
        Integer pokedexId = p.getPokedexId();
        Optional<PokedexMaestra> especie = pokedexId != null ? pokedexRepo.findById(pokedexId) : Optional.empty();
        String nombre = especie.map(PokedexMaestra::getNombre).orElse("???");
        String tipo   = especie.map(PokedexMaestra::getTipo_1).orElse("normal");

        Map<String, Object> dto = new HashMap<>();
        dto.put("pokemonUsuarioId", p.getId());
        dto.put("id",               p.getPokedexId());
        dto.put("name",             nombre);
        dto.put("type",             normalizarTipoParaFrontend(tipo));
        dto.put("sprite",           String.format(SPRITE_URL, p.getPokedexId()));
        dto.put("nivel",            p.getNivel());
        dto.put("hpActual",         p.getHpActual());
        dto.put("hpMax",            p.getHpMax());
        dto.put("posicionEquipo",   p.getPosicionEquipo());
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

    private List<PokemonUsuario> equipoOrdenado(Long userId) {
        List<PokemonUsuario> equipo = new ArrayList<>(pokemonRepo.findByUsuarioId(userId));
        equipo.sort(Comparator.comparingInt(p -> nvl(p.getPosicionEquipo(), Integer.MAX_VALUE)));
        return equipo;
    }

    private Usuario cargarUsuario(String username) {
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new RecursoNoEncontrado("Usuario no encontrado."));
    }

    private int nvl(Integer value, int defecto) {
        return value == null ? defecto : value;
    }
}
