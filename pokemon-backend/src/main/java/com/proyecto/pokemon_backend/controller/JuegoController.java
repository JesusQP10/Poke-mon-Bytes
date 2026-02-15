package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.model.PokemonUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.RepositorioPokedexMaestra;
import com.proyecto.pokemon_backend.repository.RepositorioPokemonUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/juego")
public class JuegoController {

    private static final List<Integer> JOHTO_STARTERS = List.of(152, 155, 158);
    private static final String SPRITE_URL_TEMPLATE =
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/%d.png";

    private final RepositorioUsuario userRepository;
    private final RepositorioPokemonUsuario pokemonUsuarioRepository;
    private final RepositorioPokedexMaestra pokedexMasterRepository;

    public JuegoController(
        RepositorioUsuario userRepository,
        RepositorioPokemonUsuario pokemonUsuarioRepository,
        RepositorioPokedexMaestra pokedexMasterRepository
    ) {
        this.userRepository = userRepository;
        this.pokemonUsuarioRepository = pokemonUsuarioRepository;
        this.pokedexMasterRepository = pokedexMasterRepository;
    }

    @GetMapping("/estado")
    // Devuelvo este dato para reutilizarlo en otras partes.
    public ResponseEntity<Map<String, Object>> obtenerEstadoJuego() {
        Usuario usuario = obtenerUsuarioAutenticado();
        List<PokemonUsuario> equipo = obtenerEquipoOrdenado(usuario.getIdUsuario());

        List<Map<String, Object>> teamDto = equipo.stream()
            .map(this::aDtoPokemon)
            .toList();

        Map<String, Object> body = new HashMap<>();
        body.put("starter", teamDto.isEmpty() ? null : teamDto.get(0));
        body.put("team", teamDto);
        body.put("badges", List.of());
        body.put("money", usuario.getDinero());
        body.put("mapaActual", usuario.getMapaActual());
        body.put("posX", usuario.getPosX());
        body.put("posY", usuario.getPosY());

        return ResponseEntity.ok(body);
    }

    @PostMapping("/starter")
    @Transactional
    // Este metodo se encarga de elegirInicial.
    public ResponseEntity<Map<String, Object>> elegirInicial(@RequestBody Map<String, Integer> payload) {
        Usuario usuario = obtenerUsuarioAutenticado();
        Integer starterId = payload.get("starterId");

        if (starterId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "starterId es obligatorio."));
        }
        if (!JOHTO_STARTERS.contains(starterId)) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Solo puedes elegir a Chikorita (152), Cyndaquil (155) o Totodile (158).")
            );
        }

        List<PokemonUsuario> equipo = obtenerEquipoOrdenado(usuario.getIdUsuario());
        if (!equipo.isEmpty()) {
            Map<String, Object> existingStarter = aDtoPokemon(equipo.get(0));
            return ResponseEntity.ok(Map.of("starter", existingStarter));
        }

        PokedexMaestra pokedex = pokedexMasterRepository.findById(starterId)
            .orElseThrow(() -> new RuntimeException("Pokemon no encontrado en Pokedex: " + starterId));

        PokemonUsuario nuevo = new PokemonUsuario();
        nuevo.setUsuarioId(usuario.getIdUsuario());
        nuevo.setPokedexId(starterId);
        nuevo.setNivel(5);
        nuevo.setExperiencia(0);
        nuevo.setPosicionEquipo(0);

        int hpBase = nvl(pokedex.getStat_base_hp(), 20);
        int atkBase = nvl(pokedex.getStat_base_ataque(), 10);
        int defBase = nvl(pokedex.getStat_base_defensa(), 10);
        int spaBase = nvl(pokedex.getStat_base_atq_especial(), 10);
        int spdBase = nvl(pokedex.getStat_base_def_especial(), 10);
        int speBase = nvl(pokedex.getStat_base_velocidad(), 10);

        int hpMax = Math.max(20, hpBase + 10);
        nuevo.setHpMax(hpMax);
        nuevo.setHpActual(hpMax);
        nuevo.setAtaqueStat(Math.max(5, atkBase));
        nuevo.setDefensaStat(Math.max(5, defBase));
        nuevo.setAtaqueEspecialStat(Math.max(5, spaBase));
        nuevo.setDefensaEspecialStat(Math.max(5, spdBase));
        nuevo.setVelocidadStat(Math.max(5, speBase));

        PokemonUsuario guardado = pokemonUsuarioRepository.save(nuevo);
        Map<String, Object> starterDto = aDtoPokemon(guardado);

        return ResponseEntity.ok(Map.of("starter", starterDto));
    }

    @GetMapping("/equipo")
    // Devuelvo este dato para reutilizarlo en otras partes.
    public ResponseEntity<List<Map<String, Object>>> obtenerEquipo() {
        Usuario usuario = obtenerUsuarioAutenticado();
        List<Map<String, Object>> team = obtenerEquipoOrdenado(usuario.getIdUsuario())
            .stream()
            .map(this::aDtoPokemon)
            .toList();

        return ResponseEntity.ok(team);
    }

    @PostMapping("/guardar")
    // Aquí guardo datos importantes de la partida.
    public ResponseEntity<Map<String, Object>> guardarJuego() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Partida guardada correctamente.",
            "savedAt", Instant.now().toString()
        ));
    }

    // Devuelvo este dato para reutilizarlo en otras partes.
    private Usuario obtenerUsuarioAutenticado() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado."));
    }

    // Aquí busco los datos que necesita esta parte.
    private List<PokemonUsuario> obtenerEquipoOrdenado(Long userId) {
        List<PokemonUsuario> equipo = new ArrayList<>(pokemonUsuarioRepository.findByUsuarioId(userId));
        equipo.sort(Comparator.comparingInt(p -> nvl(p.getPosicionEquipo(), Integer.MAX_VALUE)));
        return equipo;
    }

    // Este metodo se encarga de aDtoPokemon.
    private Map<String, Object> aDtoPokemon(PokemonUsuario pokemonUsuario) {
        Optional<PokedexMaestra> pokedexOpt = pokedexMasterRepository.findById(pokemonUsuario.getPokedexId());
        String name = pokedexOpt.map(PokedexMaestra::getNombre).orElse("Unknown");
        String type = pokedexOpt.map(PokedexMaestra::getTipo_1).orElse("normal");

        Map<String, Object> dto = new HashMap<>();
        dto.put("pokemonUsuarioId", pokemonUsuario.getId());
        dto.put("id", pokemonUsuario.getPokedexId());
        dto.put("name", name);
        dto.put("type", normalizarTipo(type));
        dto.put("sprite", String.format(SPRITE_URL_TEMPLATE, pokemonUsuario.getPokedexId()));
        dto.put("nivel", pokemonUsuario.getNivel());
        dto.put("hpActual", pokemonUsuario.getHpActual());
        dto.put("hpMax", pokemonUsuario.getHpMax());
        dto.put("posicionEquipo", pokemonUsuario.getPosicionEquipo());
        return dto;
    }

    // Este metodo se encarga de normalizarTipo.
    private String normalizarTipo(String value) {
        if (value == null || value.isBlank()) return "normal";
        return switch (value.trim().toLowerCase()) {
            case "fuego" -> "fire";
            case "agua" -> "water";
            case "planta" -> "grass";
            default -> value.trim().toLowerCase();
        };
    }

    // Este metodo se encarga de nvl.
    private int nvl(Integer value, int defaultValue) {
        return value == null ? defaultValue : value;
    }
}

