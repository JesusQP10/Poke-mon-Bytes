package com.proyecto.pokemon_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.proyecto.pokemon_backend.component.TipoInitializer;
import com.proyecto.pokemon_backend.repository.TipoRepository;

/**
 * Clase Principal de la aplicación Pokemon Bytes.
 * * La anotación @SpringBootApplication es una combinación de:
 * 1. @Configuration: Permite definir Beans en esta clase.
 * 2. @EnableAutoConfiguration: Spring configura automáticamente la BD, Seguridad, etc. basándose en las librerías (.jar) detectadas.
 * 3. @ComponentScan: Busca otros componentes (@Service, @Controller) en el paquete 'com.proyecto.pokemon_backend'.
 */

@SpringBootApplication
public class PokemonBackendApplication {
    /**
     * Método principal que arranca el motor de Spring Boot.
     * Inicia el servidor Tomcat embebido (por defecto en puerto 8081 según configuración)
     * y levanta el contexto de la aplicación.
     */

	public static void main(String[] args) {
		SpringApplication.run(PokemonBackendApplication.class, args);
	}
    // -------------------------------------------------------------------------
    // CONFIGURACIÓN DE BEANS DE INICIALIZACIÓN
    // -------------------------------------------------------------------------

    /**
     * Definición explícita del Bean 'TipoInitializer'.
     * * Este método asegura que Spring cree una instancia de nuestra clase TipoInitializer
     * al arrancar el servidor. Su objetivo es cargar la Matriz de Tipos (Agua vence a Fuego, etc.)
     * en la base de datos si esta se encuentra vacía.
     * * @param tipoRepository Repositorio inyectado automáticamente por Spring (Inyección de Dependencias).
     * Es necesario para que el Initializer pueda guardar los datos en MySQL.
     * @return Una nueva instancia de TipoInitializer lista para ejecutarse.
     */

	// 1. FORZAMOS EL BEAN DE INICIALIZACIÓN AQUI
    @Bean
    public TipoInitializer tipoInitializer(TipoRepository tipoRepository) {
        // Spring ahora sabe que debe crear el Inicializador pasándole el Repositorio.
        return new TipoInitializer(tipoRepository);
    }

}
