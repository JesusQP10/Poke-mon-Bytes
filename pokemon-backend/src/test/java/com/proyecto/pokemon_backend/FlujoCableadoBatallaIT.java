package com.proyecto.pokemon_backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyecto.pokemon_backend.component.CargadorDatos;
import com.proyecto.pokemon_backend.component.SembradorObjetos;
import com.proyecto.pokemon_backend.model.Ataques;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.repository.RepositorioAtaques;
import com.proyecto.pokemon_backend.repository.RepositorioPokedexMaestra;
import com.proyecto.pokemon_backend.repository.RepositorioPokemonUsuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba del cableado: registro, starter en BD, instancia salvaje,
 * turno jugador → rival, turno rival → jugador, liberar salvaje, reiniciar partida.
 * No usa PokéAPI ni MySQL (perfil {@code test}, H2).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class FlujoCableadoBatallaIT {

    @MockBean
    private CargadorDatos cargadorDatos;

    @MockBean
    private SembradorObjetos sembradorObjetos;

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RepositorioPokedexMaestra pokedexRepo;

    @Autowired
    private RepositorioAtaques ataquesRepo;

    @Autowired
    private RepositorioPokemonUsuario pokemonRepo;

    @SuppressWarnings("null")
	@BeforeEach
    void sembrarCatalogoMinimo() {
        if (!pokedexRepo.existsById(155)) {
            pokedexRepo.save(especie(155, "Cyndaquil", "Fuego", null, 39, 52, 43, 60, 50, 65));
        }
        if (!pokedexRepo.existsById(19)) {
            pokedexRepo.save(especie(19, "Rattata", "Normal", null, 30, 56, 35, 25, 25, 72));
        }
        if (!ataquesRepo.existsById(33)) {
            ataquesRepo.save(ataque(33, "tackle", "normal", "physical", 40, 100, 35));
        }
    }

    private static PokedexMaestra especie(
        int id,
        String nombre,
        String t1,
        String t2,
        int hp,
        int atk,
        int def,
        int asp,
        int dsp,
        int vel
    ) {
        PokedexMaestra p = new PokedexMaestra();
        p.setId_pokedex(id);
        p.setNombre(nombre);
        p.setTipo_1(t1);
        p.setTipo_2(t2);
        p.setStat_base_hp(hp);
        p.setStat_base_ataque(atk);
        p.setStat_base_defensa(def);
        p.setStat_base_atq_especial(asp);
        p.setStat_base_def_especial(dsp);
        p.setStat_base_velocidad(vel);
        p.setXp_base(125);
        p.setRatioCaptura(255);
        return p;
    }

    private static Ataques ataque(
        int id,
        String nombre,
        String tipo,
        String categoria,
        int potencia,
        int precision,
        int pp
    ) {
        Ataques a = new Ataques();
        a.setIdAtaque(id);
        a.setNombre(nombre);
        a.setTipo(tipo);
        a.setCategoria(categoria);
        a.setPotencia(potencia);
        a.setPrecisionBase(precision);
        a.setPpBase(pp);
        return a;
    }

    @SuppressWarnings("null")
	@Test
    void registro_starter_salvaje_dosTurnos_liberar() throws Exception {
        String user = "itest_" + UUID.randomUUID().toString().substring(0, 8);
        String pass = "pw123456";

        HttpHeaders json = new HttpHeaders();
        json.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<String> reg = rest.postForEntity(
            "/auth/registrar",
            new HttpEntity<>(Map.of("username", user, "password", pass), json),
            String.class
        );
        assertThat(reg.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<String> loginResp = rest.postForEntity(
            "/auth/iniciarSesion",
            new HttpEntity<>(Map.of("username", user, "password", pass), json),
            String.class
        );
        assertThat(loginResp.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode loginRoot = objectMapper.readTree(loginResp.getBody());
        String token = loginRoot.get("token").asText();

        HttpHeaders auth = new HttpHeaders();
        auth.setContentType(MediaType.APPLICATION_JSON);
        auth.setBearerAuth(token);

        ResponseEntity<String> starterResp = rest.postForEntity(
            "/api/v1/juego/starter",
            new HttpEntity<>(Map.of("starterId", 155), auth),
            String.class
        );
        assertThat(starterResp.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<String> estadoResp = rest.exchange(
            "/api/v1/juego/estado",
            HttpMethod.GET,
            new HttpEntity<>(auth),
            String.class
        );
        assertThat(estadoResp.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode estado = objectMapper.readTree(estadoResp.getBody());
        assertThat(estado.has("inventario")).isTrue();
        assertThat(estado.get("inventario").isArray()).isTrue();
        assertThat(estado.has("money")).isTrue();

        ResponseEntity<String> equipoResp = rest.exchange(
            "/api/v1/juego/equipo",
            HttpMethod.GET,
            new HttpEntity<>(auth),
            String.class
        );
        assertThat(equipoResp.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode equipo = objectMapper.readTree(equipoResp.getBody());
        assertThat(equipo.isArray()).isTrue();
        assertThat(equipo.size()).isGreaterThan(0);
        long pokemonJugadorId = equipo.get(0).get("pokemonUsuarioId").asLong();

        ResponseEntity<String> movJResp = rest.exchange(
            "/api/v1/batalla/movimientos/" + pokemonJugadorId,
            HttpMethod.GET,
            new HttpEntity<>(auth),
            String.class
        );
        assertThat(movJResp.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode movsJ = objectMapper.readTree(movJResp.getBody());
        int movimientoId = movsJ.get(0).get("movimientoId").asInt();

        ResponseEntity<String> prepResp = rest.postForEntity(
            "/api/v1/batalla/salvaje/preparar",
            new HttpEntity<>(Map.of("pokedexId", 19, "nivel", 4), auth),
            String.class
        );
        assertThat(prepResp.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode prep = objectMapper.readTree(prepResp.getBody());
        long salvajeId = prep.get("pokemonUsuarioId").asLong();

        ResponseEntity<String> movSalResp = rest.exchange(
            "/api/v1/batalla/movimientos/" + salvajeId,
            HttpMethod.GET,
            new HttpEntity<>(auth),
            String.class
        );
        assertThat(movSalResp.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode movsSal = objectMapper.readTree(movSalResp.getBody());
        int movSalId = movsSal.get(0).get("movimientoId").asInt();

        ResponseEntity<String> turno1 = rest.postForEntity(
            "/api/v1/batalla/turno",
            new HttpEntity<>(
                Map.of(
                    "atacanteId", pokemonJugadorId,
                    "defensorId", salvajeId,
                    "movimientoId", movimientoId
                ),
                auth
            ),
            String.class
        );
        assertThat(turno1.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode r1 = objectMapper.readTree(turno1.getBody());
        assertThat(r1.has("hpRestanteAtacante")).isTrue();
        assertThat(r1.get("hpRestanteDefensor").asInt()).isLessThan(prep.get("hpMax").asInt());

        ResponseEntity<String> turno2 = rest.postForEntity(
            "/api/v1/batalla/turno",
            new HttpEntity<>(
                Map.of(
                    "atacanteId", salvajeId,
                    "defensorId", pokemonJugadorId,
                    "movimientoId", movSalId
                ),
                auth
            ),
            String.class
        );
        assertThat(turno2.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode r2 = objectMapper.readTree(turno2.getBody());
        assertThat(r2.has("hpRestanteAtacante")).isTrue();

        ResponseEntity<String> libResp = rest.postForEntity(
            "/api/v1/batalla/salvaje/liberar",
            new HttpEntity<>(Map.of("pokemonUsuarioId", salvajeId), auth),
            String.class
        );
        assertThat(libResp.getStatusCode().is2xxSuccessful()).isTrue();

        assertThat(pokemonRepo.findById(salvajeId)).isEmpty();

        ResponseEntity<String> reinResp = rest.postForEntity(
            "/api/v1/juego/reiniciar",
            new HttpEntity<>(auth),
            String.class
        );
        assertThat(reinResp.getStatusCode().is2xxSuccessful()).isTrue();
        JsonNode rein = objectMapper.readTree(reinResp.getBody());
        assertThat(rein.get("starter").isNull()).isTrue();
        assertThat(rein.get("team").isArray()).isTrue();
        assertThat(rein.get("team").size()).isEqualTo(0);
        assertThat(rein.get("money").asInt()).isEqualTo(300);
        assertThat(rein.get("inventario").isArray()).isTrue();
        assertThat(rein.get("inventario").size()).isEqualTo(0);
        assertThat(rein.get("mapaActual").asText()).isEqualTo("player-room");
    }
}
