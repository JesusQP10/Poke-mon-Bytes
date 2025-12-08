package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.repository.ItemRepository;
import com.proyecto.pokemon_backend.service.api.PokeApiService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Component
public class ItemSeeder implements CommandLineRunner {

    private final ItemRepository itemRepository;
    private final PokeApiService apiService;

    // Lista de IDs de objetos clásicos de Gen II para la tienda
    private static final List<String> ITEMS_CLASICOS = List.of(
        "potion", "super-potion", "hyper-potion", "max-potion", "full-restore",
        "antidote", "burn-heal", "ice-heal", "awakening", "paralyze-heal", "full-heal",
        "poke-ball", "great-ball", "ultra-ball", "master-ball",
        "escape-rope", "repel"
    );

    public ItemSeeder(ItemRepository itemRepository, PokeApiService apiService) {
        this.itemRepository = itemRepository;
        this.apiService = apiService;
    }

    @Override
    public void run(String... args) throws Exception {
        // Solo cargamos si la tabla está vacía para no duplicar
        if (itemRepository.count() == 0) {
            System.out.println("--- INICIANDO CARGA DE TIENDA (ITEMS GEN II) ---");
            
            Flux.fromIterable(ITEMS_CLASICOS)
                .flatMap(id -> apiService.getItemDetails(id)
                    .onErrorResume(e -> {
                        System.err.println("Error cargando item: " + id);
                        return Mono.empty();
                    }), 5) // Concurrencia controlada
                .map(this::mapApiToItemEntity)
                .collectList()
                .doOnSuccess(itemRepository::saveAll)
                .block();

            System.out.println("--- TIENDA LISTA: " + itemRepository.count() + " objetos originales cargados. ---");
        }
    }

    // Mapeo: Convierte el JSON de la API en tu entidad Java
    private Item mapApiToItemEntity(Map<String, Object> details) {
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

    // Diccionario de efectos para tu motor de juego
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
