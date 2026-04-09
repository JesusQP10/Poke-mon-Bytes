package com.proyecto.pokemon_backend;

import com.proyecto.pokemon_backend.component.InicializadorTipos;
import com.proyecto.pokemon_backend.config.PropiedadesJwt;
import com.proyecto.pokemon_backend.repository.RepositorioTipo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableConfigurationProperties(PropiedadesJwt.class)
public class PokemonBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PokemonBackendApplication.class, args);
    }

    /**
     * InicializadorTipos se registra aquí como @Bean (sin @Component en la clase)
     * para evitar el doble registro que causaría tener ambas anotaciones.
     */
    @Bean
    public InicializadorTipos inicializadorTipos(RepositorioTipo tipoRepository) {
        return new InicializadorTipos(tipoRepository);
    }
}
