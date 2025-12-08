package com.proyecto.pokemon_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.proyecto.pokemon_backend.component.TipoInitializer;
import com.proyecto.pokemon_backend.repository.TipoRepository;

@SpringBootApplication
public class PokemonBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PokemonBackendApplication.class, args);
	}

	// 1. FORZAMOS EL BEAN DE INICIALIZACIÓN AQUI
    @Bean
    public TipoInitializer tipoInitializer(TipoRepository tipoRepository) {
        // Spring ahora sabe que debe crear el Inicializador pasándole el Repositorio.
        return new TipoInitializer(tipoRepository);
    }

}
