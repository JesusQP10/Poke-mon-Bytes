package com.proyecto.pokemon_backend;

import com.proyecto.pokemon_backend.component.CargadorDatos;
import com.proyecto.pokemon_backend.component.SembradorObjetos;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PokemonBackendApplicationTests {

	/** Evita llamadas a la PokéAPI al levantar el contexto en tests. */
	@MockBean
	private CargadorDatos cargadorDatos;

	@MockBean
	private SembradorObjetos sembradorObjetos;

	@Test
	void contextLoads() {
	}

}

