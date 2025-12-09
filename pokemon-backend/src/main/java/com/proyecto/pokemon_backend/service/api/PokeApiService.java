package com.proyecto.pokemon_backend.service.api;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;

/**
 * Servicio Cliente HTTP para la comunicación con la PokéAPI externa.
 * Implementa el patrón "Reactive Client" usando Spring WebFlux (WebClient).
 * A diferencia de RestTemplate (bloqueante), WebClient permite realizar 
 * cientos de peticiones simultáneas sin detener el hilo principal del servidor,
 * lo cual es crucial para la carga masiva de datos (Data Seeding) al inicio.
 */

@Service
public class PokeApiService {
    private final WebClient webClient;

    public PokeApiService(WebClient.Builder webClientBuilder) {
        // 1. Configuración para aumentar el límite del buffer (Solución al DataBufferLimitException)
        final int maxBufferSize = 16 * 1024 * 1024; // 16 MB (más que suficiente)
        final ExchangeStrategies strategies = ExchangeStrategies.builder()
            .codecs(codecs -> codecs
                .defaultCodecs()
                .maxInMemorySize(maxBufferSize))
            .build();

        // 2. Construir el WebClient con la URL base y las estrategias
        this.webClient = webClientBuilder
            .baseUrl("https://pokeapi.co/api/v2/") // Asegurar la barra al final
            .exchangeStrategies(strategies) // Aplicar el nuevo límite de buffer
            .build();
    }

    // --- MÉTODOS DE EXTRACCIÓN (GET) ---
    // Todos devuelven 'Mono<T>', caja que puede contener el resultado de la petición o un error,
    // pero que no bloquea el programa mientras espera la respuesta de Internet.
    // La petición no se ejecuta hasta que alguien se "suscribe" a este Mono (en DataLoader).

    /**
     * Obtiene los datos base de un Pokémon (Stats, Tipos, Sprites).
     * Endpoint: /pokemon/{name}
     */

    // Método para obtner los detalles de un Pokémon
    public Mono<Map<String, Object>> getPokemonDetails(String name) {
        return webClient.get()
                .uri("pokemon/{name}", name) 
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
    }


    // Método para obtener detalles de un Ataque/Movimiento
    public Mono<Map<String, Object>> getMoveDetails(String moveName) {
        return webClient.get()
                .uri("move/{moveName}", moveName)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
    }

    // Método para obtener la info de un Item (Precio, Nombre)
    public Mono<Map<String, Object>> getItemDetails(String name) {
        return webClient.get()
                .uri("item/{name}", name) 
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
    }

    // Método para obtener capture_rate
    public Mono<Map<String, Object>> getPokemonSpecies(String idOrName){
        return webClient.get()
            .uri("pokemon-species/{id}", idOrName)
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>(){}) ;
    }
    
}
