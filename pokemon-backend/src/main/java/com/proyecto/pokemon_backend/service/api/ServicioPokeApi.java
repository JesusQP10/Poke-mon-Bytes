package com.proyecto.pokemon_backend.service.api;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;

/**
 * WebClient contra {@code https://pokeapi.co/api/v2/}: sprites u otros recursos sin acoplar
 * el dominio al JSON de la API. El buffer grande evita cortes en respuestas pesadas.
 */
@Service
public class ServicioPokeApi {
    private final WebClient webClient;

    /**
     * Configura {@code WebClient} con URL base de PokéAPI y buffer de cuerpo ampliado (evita {@code DataBufferLimitException}).
     */
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
    // Todos devuelven Mono: la petición HTTP no corre hasta que el llamador hace block()/subscribe().

    /**
     * GET {@code /pokemon/{name}} — stats, tipos y metadatos del Pokémon (id numérico o nombre).
     */
    public Mono<Map<String, Object>> obtenerDetallesPokemon(String name) {
        return webClient.get()
                .uri("pokemon/{name}", name) 
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
    }

    /** GET {@code /move/{moveName}} — potencia, precisión, tipo y categoría del movimiento. */
    public Mono<Map<String, Object>> obtenerDetallesMovimiento(String moveName) {
        return webClient.get()
                .uri("move/{moveName}", moveName)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
    }

    /** GET {@code /item/{name}} — coste y nombre del objeto de tienda. */
    public Mono<Map<String, Object>> obtenerDetallesObjeto(String name) {
        return webClient.get()
                .uri("item/{name}", name) 
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
    }

    /** GET {@code /pokemon-species/{id}} — incluye {@code capture_rate} para la fórmula de captura. */
    public Mono<Map<String, Object>> obtenerEspeciePokemon(String idOrName){
        return webClient.get()
            .uri("pokemon-species/{id}", idOrName)
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>(){}) ;
    }
    
}

