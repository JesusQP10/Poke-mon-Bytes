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
 * Componente de Carga Inicial para la Tienda (Seeder).
 * * Responsabilidad:
 * Poblar la tabla 'ITEMS' al arrancar la aplicación, descargando los datos oficiales
 * (precio, nombre) de la PokéAPI y asignándoles lógica interna del juego.
 * * Implementa 'CommandLineRunner' para ejecutarse automáticamente tras el inicio del contexto Spring.
 */

@Component
public class SembradorObjetos implements CommandLineRunner {

    private final RepositorioObjeto itemRepository;
    private final ServicioPokeApi apiService;

    // Lista de IDs de objetos clásicos de Gen II para la tienda
    private static final List<String> ITEMS_CLASICOS = List.of(
        "potion", "super-potion", "hyper-potion", "max-potion", "full-restore",
        "antidote", "burn-heal", "ice-heal", "awakening", "paralyze-heal", "full-heal",
        "poke-ball", "great-ball", "ultra-ball", "master-ball",
        "escape-rope", "repel"
    );

    // Aquí preparo datos necesarios al arrancar la app.
    public SembradorObjetos(RepositorioObjeto itemRepository, ServicioPokeApi apiService) {
        this.itemRepository = itemRepository;
        this.apiService = apiService;
    }

    @Override
    // Este metodo se encarga de run.
    public void run(String... args) throws Exception {
        // Solo cargamos si la tabla está vacía para no duplicar
        if (itemRepository.count() == 0) {
            System.out.println("--- INICIANDO CARGA DE TIENDA (ITEMS GEN II) ---");
            
            Flux.fromIterable(ITEMS_CLASICOS)
                .flatMap(id -> apiService.obtenerDetallesObjeto(id)
                    .onErrorResume(e -> {
                        System.err.println("Error cargando item: " + id);
                        return Mono.empty();
                    }), 5) // Concurrencia controlada
                .map(this::mapearApiAEntidadObjeto)
                .collectList()
                .doOnSuccess(itemRepository::saveAll)
                .block();

            System.out.println("--- TIENDA LISTA: " + itemRepository.count() + " objetos originales cargados. ---");
        }
    }

    // --- LÓGICA DE TRANSFORMACIÓN (ETL) ---

    /**
     * Convierte el Map dinámico (JSON) de la API en una Entidad fuertemente tipada.
     */
    private Item mapearApiAEntidadObjeto(Map<String, Object> details) {
        Item item = new Item();
        
        // 1. Nombre (Capitalizado)
        String nombreApi = (String) details.get("name");
        item.setNombre(nombreApi.substring(0, 1).toUpperCase() + nombreApi.substring(1));
        
        // 2. Precio Original (Dato oficial)
        item.setPrecio((Integer) details.get("cost"));
        
        // 3. Efecto (Lógica interna)
        // Como la API da descripciones de texto y no códigos, asignamos la lógica manualmente
        item.setEfecto(determinarEfecto(nombreApi));
        
        return item;
    }

    /**
     * Diccionario de traducción: API Name -> Game Engine Code.
     * Este método define qué hace realmente cada objeto dentro de 'BatallaService'.
     */
    private String determinarEfecto(String apiName) {
        switch (apiName) {
            case "potion": return "HEAL_20";
            case "super-potion": return "HEAL_50";
            case "hyper-potion": return "HEAL_200";
            case "max-potion": return "HEAL_MAX";
            case "full-restore": return "HEAL_MAX_STATUS";
            
            case "poke-ball": return "CAPTURE_1.0";
            case "great-ball": return "CAPTURE_1.5";
            case "ultra-ball": return "CAPTURE_2.0";
            case "master-ball": return "CAPTURE_MAX";
            
            case "antidote": return "CURE_PSN";
            case "burn-heal": return "CURE_BRN";
            case "ice-heal": return "CURE_FRZ";
            case "awakening": return "CURE_SLP";
            case "paralyze-heal": return "CURE_PAR";
            case "full-heal": return "CURE_ALL";
            
            default: return "NONE";
        }
    }
}

