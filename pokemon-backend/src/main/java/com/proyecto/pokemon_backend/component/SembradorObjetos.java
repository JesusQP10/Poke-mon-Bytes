package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.repository.RepositorioObjeto;
import com.proyecto.pokemon_backend.service.api.ServicioPokeApi;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Carga el catálogo de ítems de la tienda al arrancar.
 *
 * Los ítems se descargan de la PokéAPI y se les asigna un código de efecto
 * interno que BatallaService/TiendaService interpreta en tiempo de ejecución.
 */
@Component
public class SembradorObjetos implements CommandLineRunner {

    private static final List<String> ITEMS_GEN_II = List.of(
        "potion", "super-potion", "hyper-potion", "max-potion", "full-restore",
        "antidote", "burn-heal", "ice-heal", "awakening", "paralyze-heal", "full-heal",
        "poke-ball", "great-ball", "ultra-ball", "master-ball",
        "escape-rope", "repel"
    );

    private final RepositorioObjeto itemRepo;
    private final ServicioPokeApi apiService;

    /**
     * @param itemRepo persistencia del catálogo ITEMS
     * @param apiService cliente PokéAPI para precios y nombres
     */
    public SembradorObjetos(RepositorioObjeto itemRepo, ServicioPokeApi apiService) {
        this.itemRepo = itemRepo;
        this.apiService = apiService;
    }

    /**
     * {@inheritDoc} — no hace nada si la tabla ITEMS ya tiene filas.
     */
    @Override
    public void run(String... args) {
        if (itemRepo.count() > 0) return;

        System.out.println("--- Cargando ítems de tienda Gen II ---");

        Flux.fromIterable(ITEMS_GEN_II)
            .flatMap(nombre -> apiService.obtenerDetallesObjeto(nombre)
                .onErrorResume(e -> {
                    System.err.println("Error cargando ítem: " + nombre);
                    return Mono.empty();
                }), 5)
            .map(this::mapearItem)
            .collectList()
            .doOnSuccess(itemRepo::saveAll)
            .block();

        System.out.println("--- Tienda lista: " + itemRepo.count() + " ítems ---");
    }

    /** Transforma el JSON de PokéAPI en {@link Item} con {@code efecto} interno para el motor. */
    private Item mapearItem(Map<String, Object> detalles) {
        Item item = new Item();
        String nombre = (String) detalles.get("name");
        item.setNombre(capitalizar(nombre));
        item.setPrecio((Integer) detalles.get("cost"));
        item.setEfecto(efectoPara(nombre));
        return item;
    }

    /** Mapea slugs de PokéAPI a códigos {@code HEAL_*}, {@code CAPTURE_*}, curas de estado, etc. */
    private String efectoPara(String nombre) {
        return switch (nombre) {
            case "potion"        -> "HEAL_20";
            case "super-potion"  -> "HEAL_50";
            case "hyper-potion"  -> "HEAL_200";
            case "max-potion"    -> "HEAL_MAX";
            case "full-restore"  -> "HEAL_MAX_STATUS";
            case "poke-ball"     -> "CAPTURE_1.0";
            case "great-ball"    -> "CAPTURE_1.5";
            case "ultra-ball"    -> "CAPTURE_2.0";
            case "master-ball"   -> "CAPTURE_MAX";
            case "antidote"      -> "CURE_PSN";
            case "burn-heal"     -> "CURE_BRN";
            case "ice-heal"      -> "CURE_FRZ";
            case "awakening"     -> "CURE_SLP";
            case "paralyze-heal" -> "CURE_PAR";
            case "full-heal"     -> "CURE_ALL";
            default              -> "NONE";
        };
    }

    /** Primera letra en mayúscula para nombres mostrables en tienda. */
    private String capitalizar(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
