package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Ataques;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.repository.AtaquesRepository;
import com.proyecto.pokemon_backend.repository.PokedexMasterRepository;
import com.proyecto.pokemon_backend.service.api.PokeApiService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2; 

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Componente de Carga Inicial de Datos (Data Seeding).
 * * Implementa 'CommandLineRunner':
 * Spring Boot ejecutará el método 'run' automáticamente justo después de levantar el servidor.
 * * Objetivo:
 * Poblar la base de datos (MySQL) con la información oficial de Pokémon y Movimientos
 * descargándola desde la PokéAPI externa.
 */

@Component
public class DataLoader implements CommandLineRunner {

    private final PokedexMasterRepository pokedexRepository;
    private final AtaquesRepository ataquesRepository;
    private final PokeApiService apiService;

    // LÍMITES DE LA GENERACIÓN II
    private static final int POKEMON_LIMIT = 251; 
    private static final int MOVES_LIMIT = 251;   

    public DataLoader(PokedexMasterRepository pokedexRepository, 
                      AtaquesRepository ataquesRepository, 
                      PokeApiService apiService) {
        this.pokedexRepository = pokedexRepository;
        this.ataquesRepository = ataquesRepository;
        this.apiService = apiService;
    }

    @Override
    public void run(String... args) throws Exception {
        
        // 1. CARGA DE POKÉDEX 
        if (pokedexRepository.count() < POKEMON_LIMIT) {
            System.out.println("--- INICIANDO CARGA DE POKÉDEX (CON RATIO DE CAPTURA) ---");
            System.out.println("Descargando datos combinados (Detalles + Especies)...");

            Flux.range(1, POKEMON_LIMIT)
                .flatMap(id -> 
                    // Para cada ID, lanzamos DOS peticiones HTTP simultáneas:
                    // 1. Datos de combate (Stats, Tipos)
                    // 2. Datos de especie (Ratio de captura)
                    // 'Mono.zip' espera a que ambas terminen y combina los resultados.
                    Mono.zip(
                        apiService.getPokemonDetails(String.valueOf(id)), // T1: Datos base (Stats)
                        apiService.getPokemonSpecies(String.valueOf(id))  // T2: Datos especie (Capture Rate)
                    ).onErrorResume(e -> {
                        System.err.println("Error cargando ID " + id + ": " + e.getMessage());
                        return Mono.empty();
                    }), 5 // Concurrencia controlada
                )
                // Transformación: Convertimos los JSONs en nuestra entidad JPA
                .map(tuple -> mapCombinedDataToEntity(tuple.getT1(), tuple.getT2()))
                .buffer(20)
                .doOnNext(pokedexRepository::saveAll)
                .blockLast();
                
            System.out.println("--- POKÉDEX ACTUALIZADA (" + pokedexRepository.count() + " registros) ---");
        }

        // 2. CARGA DE ATAQUES 
        if (ataquesRepository.count() < MOVES_LIMIT) {
            System.out.println("--- INICIANDO CARGA DE ATAQUES ---");
            Flux.range(1, MOVES_LIMIT)
                .flatMap(id -> apiService.getMoveDetails(String.valueOf(id)).onErrorResume(e -> Mono.empty()), 5)
                .map(this::mapApiDetailsToAtaqueEntity)
                .buffer(20)
                .doOnNext(ataquesRepository::saveAll)
                .blockLast();
            System.out.println("--- ATAQUES CARGADOS ---");
        }
    }
    
    // --- MÉTODOS DE MAPEO (ETL: Extract, Transform, Load) ---

    /**
     * Fusiona los datos de dos fuentes JSON (Detalles y Especies) en una única entidad PokedexMaestra.
    **/
    private PokedexMaestra mapCombinedDataToEntity(Map<String, Object> details, Map<String, Object> species) {
        PokedexMaestra pkm = new PokedexMaestra();
        
        // Datos básicos (mapa 'details')
        pkm.setId_pokedex((Integer) details.get("id"));
        pkm.setNombre((String) details.get("name"));
        pkm.setXp_base((Integer) details.get("base_experience"));
        
        // Mapeo complejo de Stats:
        // La API devuelve una lista, nosotros la convertimos a un Mapa para acceso rápido.
        List<Map<String, Object>> statsList = (List<Map<String, Object>>) details.get("stats");
        Map<String, Integer> statsMap = statsList.stream().collect(Collectors.toMap(
                stat -> (String) ((Map<String, Object>) stat.get("stat")).get("name"),
                stat -> (Integer) stat.get("base_stat")
        ));
        
        pkm.setStat_base_hp(statsMap.get("hp"));
        pkm.setStat_base_ataque(statsMap.get("attack"));
        pkm.setStat_base_defensa(statsMap.get("defense"));
        pkm.setStat_base_atq_especial(statsMap.getOrDefault("special-attack", statsMap.get("special")));
        pkm.setStat_base_def_especial(statsMap.getOrDefault("special-defense", statsMap.get("special")));
        pkm.setStat_base_velocidad(statsMap.get("speed"));

        // Tipos
        List<Map<String, Object>> types = (List<Map<String, Object>>) details.get("types");
        pkm.setTipo_1((String) ((Map<String, Object>) types.get(0).get("type")).get("name"));
        if (types.size() > 1) {
            pkm.setTipo_2((String) ((Map<String, Object>) types.get(1).get("type")).get("name"));
        } else {
             pkm.setTipo_2(null);
        }
        
        // <--- Extracción del Ratio de Captura ( mapa 'species')
        if (species != null && species.containsKey("capture_rate")) {
            pkm.setRatioCaptura((Integer) species.get("capture_rate"));
        } else {
            pkm.setRatioCaptura(45); // Valor por defecto 
        }

        pkm.setId_evolucion(null);
        return pkm;
    }
    
    // Mapper de Ataques 
    private Ataques mapApiDetailsToAtaqueEntity(Map<String, Object> details) {
        Ataques ataque = new Ataques();
        ataque.setIdAtaque((Integer) details.get("id"));
        ataque.setNombre((String) details.get("name"));
        
        Integer power = (Integer) details.get("power");
        ataque.setPotencia(power != null ? power : 0); 

        Integer accuracy = (Integer) details.get("accuracy");
        ataque.setPrecisionBase(accuracy != null ? accuracy : 100); 

        Integer pp = (Integer) details.get("pp");
        ataque.setPpBase(pp != null ? pp : 0);
        
        Map<String, Object> typeMap = (Map<String, Object>) details.get("type");
        ataque.setTipo((String) typeMap.get("name"));
        
        Map<String, Object> damageClassMap = (Map<String, Object>) details.get("damage_class");
        ataque.setCategoria((String) damageClassMap.get("name"));

        return ataque;
    }
}