package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.exception.ErrorNegocio;
import com.proyecto.pokemon_backend.exception.RecursoNoEncontrado;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.model.PokemonUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.RepositorioPokedexMaestra;
import com.proyecto.pokemon_backend.repository.RepositorioPokemonUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JuegoServiceTest {

    @Mock
    private RepositorioUsuario userRepo;
    @Mock
    private RepositorioPokemonUsuario pokemonRepo;
    @Mock
    private RepositorioPokedexMaestra pokedexRepo;

    private JuegoService juegoService;

    @BeforeEach
    void setUp() {
        juegoService = new JuegoService(userRepo, pokemonRepo, pokedexRepo);
    }

    @Test
    void elegirStarter_sinId_lanzaErrorNegocio() {
        assertThatThrownBy(() -> juegoService.elegirStarter("ash", null))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("starterId");
    }

    @Test
    void elegirStarter_idInvalido_lanzaErrorNegocio() {
        assertThatThrownBy(() -> juegoService.elegirStarter("ash", 25))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("Chikorita");
    }

    @Test
    void elegirStarter_equipoYaConPokemon_devuelveExistenteSinGuardarOtro() {
        Usuario u = new Usuario();
        u.setIdUsuario(1L);
        u.setUsername("ash");
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));

        PokemonUsuario existente = new PokemonUsuario();
        existente.setId(99L);
        existente.setUsuarioId(1L);
        existente.setPokedexId(152);
        existente.setNivel(5);
        existente.setHpMax(22);
        existente.setHpActual(22);
        existente.setPosicionEquipo(0);
        when(pokemonRepo.findByUsuarioId(1L)).thenReturn(List.of(existente));
        when(pokedexRepo.findById(152)).thenReturn(Optional.of(especiePlanta()));

        Map<String, Object> res = juegoService.elegirStarter("ash", 152);

        assertThat(res).containsKey("starter");
        @SuppressWarnings("unchecked")
        Map<String, Object> starter = (Map<String, Object>) res.get("starter");
        assertThat(starter.get("id")).isEqualTo(152);
        verify(pokemonRepo, never()).save(any());
    }

    @Test
    void elegirStarter_vacio_persisteStarter() {
        Usuario u = new Usuario();
        u.setIdUsuario(7L);
        u.setUsername("misty");
        when(userRepo.findByUsername("misty")).thenReturn(Optional.of(u));
        when(pokemonRepo.findByUsuarioId(7L)).thenReturn(Collections.emptyList());
        when(pokedexRepo.findById(155)).thenReturn(Optional.of(especieFuego()));

        PokemonUsuario guardado = new PokemonUsuario();
        guardado.setId(200L);
        guardado.setUsuarioId(7L);
        guardado.setPokedexId(155);
        guardado.setNivel(5);
        guardado.setHpMax(24);
        guardado.setHpActual(24);
        when(pokemonRepo.save(any(PokemonUsuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> res = juegoService.elegirStarter("misty", 155);

        assertThat(res).containsKey("starter");
        ArgumentCaptor<PokemonUsuario> captor = ArgumentCaptor.forClass(PokemonUsuario.class);
        verify(pokemonRepo).save(captor.capture());
        assertThat(captor.getValue().getPokedexId()).isEqualTo(155);
        assertThat(captor.getValue().getUsuarioId()).isEqualTo(7L);
    }

    @Test
    void elegirStarter_especieNoEnPokedex_lanzaRecursoNoEncontrado() {
        Usuario u = new Usuario();
        u.setIdUsuario(1L);
        when(userRepo.findByUsername("brock")).thenReturn(Optional.of(u));
        when(pokemonRepo.findByUsuarioId(1L)).thenReturn(Collections.emptyList());
        when(pokedexRepo.findById(152)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> juegoService.elegirStarter("brock", 152))
            .isInstanceOf(RecursoNoEncontrado.class);
    }

    private static PokedexMaestra especiePlanta() {
        PokedexMaestra p = new PokedexMaestra();
        p.setId_pokedex(152);
        p.setNombre("Chikorita");
        p.setTipo_1("planta");
        p.setStat_base_hp(45);
        p.setStat_base_ataque(49);
        p.setStat_base_defensa(65);
        p.setStat_base_velocidad(45);
        p.setStat_base_atq_especial(65);
        p.setStat_base_def_especial(65);
        return p;
    }

    private static PokedexMaestra especieFuego() {
        PokedexMaestra p = new PokedexMaestra();
        p.setId_pokedex(155);
        p.setNombre("Cyndaquil");
        p.setTipo_1("fuego");
        p.setStat_base_hp(39);
        p.setStat_base_ataque(52);
        p.setStat_base_defensa(43);
        p.setStat_base_velocidad(65);
        p.setStat_base_atq_especial(60);
        p.setStat_base_def_especial(50);
        return p;
    }
}
