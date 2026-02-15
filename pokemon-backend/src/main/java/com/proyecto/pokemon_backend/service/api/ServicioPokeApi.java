package com.proyecto.pokemon_backend.service.api;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;

/**
 * Servicio Cliente HTTP para la comunicación con la PokéAPI externa.
 * Este servicio utiliza WebClient, que es parte de Spring WebFlux, para realizar peticiones HTTP de manera reactiva.
 */

@Service
public class ServicioPokeApi {
    private final WebClient webClient;

    // ServicioPokeApi.
    public ServicioPokeApi(WebClient.Builder webClientBuilder) {
        // 1. Configuración para aumentar el límite del buffer (Solución al DataBufferLimitException)
        final int maxBufferSize = 16 * 1024 * 1024; // 16 MB (más que suficiente)
        final ExchangeStrategies strategies = ExchangeStrategies.builder()
            .codecs(codecs -> codecs
                .defaultCodecs()
                .maxInMemorySize(maxBufferSize))
            .build();

        // 2. Construir el WebClient con la URL base y las estrategias
        this.webClient = webClientBuilder
            .baseUrl("https://pokeapi.co/api/v2/") // URL base de la PokéAPI
            .exchangeStrategies(strategies) // Aplicar la configuración de estrategias
            .build();
    }

    // --- MÉTODOS DE EXTRACCIÓN (GET) ---
    // Todos devuelven 'Mono<T>', caja que puede contener el resultado de la petición o un error,
    // pero que no bloquea el programa mientras espera la respuesta de Internet.
    // La petición no se ejecuta hasta que alguien se "suscribe" a este Mono (en CargadorDatos).

    /**
     * Obtiene los datos base de un Pokémon (Stats, Tipos, Sprites).
     * Endpoint: /pokemon/{name}
     */

    // Método para obtner los detalles de un Pokémon
    public Mono<Map<String, Object>> obtenerDetallesPokemon(String name) {
        return webClient.get()
                .uri("pokemon/{name}", name) 
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
    }

    // Método para obtener detalles de un Ataque/Movimiento
    public Mono<Map<String, Object>> obtenerDetallesMovimiento(String moveName) {
        return webClient.get()
                .uri("move/{moveName}", moveName)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
    }

    // Método para obtener la info de un Item (Precio, Nombre)
    public Mono<Map<String, Object>> obtenerDetallesObjeto(String name) {
        return webClient.get()
                .uri("item/{name}", name) 
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
    }

    // Método para obtener capture_rate
    public Mono<Map<String, Object>> obtenerEspeciePokemon(String idOrName){
        return webClient.get()
            .uri("pokemon-species/{id}", idOrName)
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>(){}) ;
    }
    
}

