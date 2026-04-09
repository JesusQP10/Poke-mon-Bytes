package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Ataques;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.repository.RepositorioAtaques;
import com.proyecto.pokemon_backend.repository.RepositorioPokedexMaestra;
import com.proyecto.pokemon_backend.service.api.ServicioPokeApi;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Carga inicial de Pokédex y movimientos desde la PokéAPI al arrancar.
 *
 * Solo se ejecuta si la tabla está incompleta, evitando re-descargas innecesarias.
 * Usa WebFlux con concurrencia controlada (5 peticiones simultáneas) para no
 * saturar la PokéAPI.
 */
@Component
public class CargadorDatos implements CommandLineRunner {

    private static final int LIMITE_GEN_II = 251;

    private final RepositorioPokedexMaestra pokedexRepo;
    private final RepositorioAtaques ataquesRepo;
    private final ServicioPokeApi apiService;

    public CargadorDatos(
        RepositorioPokedexMaestra pokedexRepo,
        RepositorioAtaques ataquesRepo,
        ServicioPokeApi apiService
    ) {
        this.pokedexRepo = pokedexRepo;
        this.ataquesRepo = ataquesRepo;
        this.apiService = apiService;
    }

    @Override
    public void run(String... args) {
        cargarPokedex();
        cargarAtaques();
    }

    private void cargarPokedex() {
        if (pokedexRepo.count() >= LIMITE_GEN_II) return;

        System.out.println("--- Descargando Pokédex Gen II (251 Pokémon) ---");

        Flux.range(1, LIMITE_GEN_II)
            .flatMap(id -> Mono.zip(
                apiService.obtenerDetallesPokemon(String.valueOf(id)),
                apiService.obtenerEspeciePokemon(String.valueOf(id))
            ).onErrorResume(e -> {
                System.err.println("Error cargando Pokémon #" + id + ": " + e.getMessage());
                return Mono.empty();
            }), 5)
            .map(tuple -> mapearPokemon(tuple.getT1(), tuple.getT2()))
            .buffer(20)
            .doOnNext(pokedexRepo::saveAll)
            .blockLast();

        System.out.println("--- Pokédex lista: " + pokedexRepo.count() + " registros ---");
    }

    private void cargarAtaques() {
        if (ataquesRepo.count() >= LIMITE_GEN_II) return;

        System.out.println("--- Descargando movimientos Gen II ---");

        Flux.range(1, LIMITE_GEN_II)
            .flatMap(id -> apiService.obtenerDetallesMovimiento(String.valueOf(id))
                .onErrorResume(e -> Mono.empty()), 5)
            .map(this::mapearAtaque)
            .buffer(20)
            .doOnNext(ataquesRepo::saveAll)
            .blockLast();

        System.out.println("--- Movimientos cargados: " + ataquesRepo.count() + " registros ---");
    }

    @SuppressWarnings("unchecked")
    private PokedexMaestra mapearPokemon(Map<String, Object> detalles, Map<String, Object> especie) {
        PokedexMaestra pkm = new PokedexMaestra();

        pkm.setId_pokedex((Integer) detalles.get("id"));
        pkm.setNombre((String) detalles.get("name"));
        pkm.setXp_base((Integer) detalles.get("base_experience"));

        // Stats
        List<Map<String, Object>> statsList = (List<Map<String, Object>>) detalles.get("stats");
        Map<String, Integer> stats = statsList.stream().collect(Collectors.toMap(
            s -> (String) ((Map<String, Object>) s.get("stat")).get("name"),
            s -> (Integer) s.get("base_stat")
        ));

        pkm.setStat_base_hp(stats.get("hp"));
        pkm.setStat_base_ataque(stats.get("attack"));
        pkm.setStat_base_defensa(stats.get("defense"));
        pkm.setStat_base_atq_especial(stats.getOrDefault("special-attack", stats.get("special")));
        pkm.setStat_base_def_especial(stats.getOrDefault("special-defense", stats.get("special")));
        pkm.setStat_base_velocidad(stats.get("speed"));

        // Tipos
        List<Map<String, Object>> tipos = (List<Map<String, Object>>) detalles.get("types");
        pkm.setTipo_1((String) ((Map<String, Object>) tipos.get(0).get("type")).get("name"));
        pkm.setTipo_2(tipos.size() > 1
            ? (String) ((Map<String, Object>) tipos.get(1).get("type")).get("name")
            : null);

        // Ratio de captura
        pkm.setRatioCaptura(especie != null && especie.containsKey("capture_rate")
            ? (Integer) especie.get("capture_rate")
            : 45);

        pkm.setId_evolucion(null);
        return pkm;
    }

    @SuppressWarnings("unchecked")
    private Ataques mapearAtaque(Map<String, Object> detalles) {
        Ataques ataque = new Ataques();
        ataque.setIdAtaque((Integer) detalles.get("id"));
        ataque.setNombre((String) detalles.get("name"));
        ataque.setPotencia(detalles.get("power") != null ? (Integer) detalles.get("power") : 0);
        ataque.setPrecisionBase(detalles.get("accuracy") != null ? (Integer) detalles.get("accuracy") : 100);
        ataque.setPpBase(detalles.get("pp") != null ? (Integer) detalles.get("pp") : 0);
        ataque.setTipo((String) ((Map<String, Object>) detalles.get("type")).get("name"));
        ataque.setCategoria((String) ((Map<String, Object>) detalles.get("damage_class")).get("name"));
        return ataque;
    }
}
