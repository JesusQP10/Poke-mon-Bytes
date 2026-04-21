package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.exception.ErrorNegocio;
import com.proyecto.pokemon_backend.exception.RecursoNoEncontrado;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.model.PokedexMaestra;
import com.proyecto.pokemon_backend.model.PokemonUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.model.enums.Estado;
import com.proyecto.pokemon_backend.repository.RepositorioEstadoMovimientoPokemon;
import com.proyecto.pokemon_backend.repository.RepositorioInventarioUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioObjeto;
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
    @Mock
    private RepositorioInventarioUsuario inventarioRepo;
    @Mock
    private RepositorioObjeto itemRepo;
    @Mock
    private RepositorioEstadoMovimientoPokemon estadoMovimientoRepo;

    private JuegoService juegoService;

    @BeforeEach
    void setUp() {
        juegoService = new JuegoService(userRepo, pokemonRepo, pokedexRepo, inventarioRepo, itemRepo, estadoMovimientoRepo);
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

    @SuppressWarnings("null")
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

    @SuppressWarnings("null")
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

    // =========================================================================
    // tirarDelInventario
    // =========================================================================

    @Test
    void tirar_cantidadCero_lanzaErrorNegocio() {
        assertThatThrownBy(() -> juegoService.tirarDelInventario("ash", 1, null, 0))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("mayor que cero");
    }

    @Test
    void tirar_cantidadNegativa_lanzaErrorNegocio() {
        assertThatThrownBy(() -> juegoService.tirarDelInventario("ash", 1, null, -3))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("mayor que cero");
    }

    @Test
    void tirar_itemNoEnInventario_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item pocion = itemPocion();
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Potion")).thenReturn(Optional.of(pocion));
        when(inventarioRepo.findByUsuarioAndItem(u, pocion)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> juegoService.tirarDelInventario("ash", null, "Potion", 1))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("No tienes ese ítem");
    }

    @Test
    void tirar_masDeLoQueHay_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item pocion = itemPocion();
        InventarioUsuario entrada = new InventarioUsuario(u, pocion, 2);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Potion")).thenReturn(Optional.of(pocion));
        when(inventarioRepo.findByUsuarioAndItem(u, pocion)).thenReturn(Optional.of(entrada));

        assertThatThrownBy(() -> juegoService.tirarDelInventario("ash", null, "Potion", 5))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("suficientes");
    }

    @Test
    void tirar_cantidadParcial_actualizaFilaConRestante() {
        Usuario u = usuarioBase();
        Item pocion = itemPocion();
        InventarioUsuario entrada = new InventarioUsuario(u, pocion, 5);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Potion")).thenReturn(Optional.of(pocion));
        when(inventarioRepo.findByUsuarioAndItem(u, pocion)).thenReturn(Optional.of(entrada));
        when(inventarioRepo.findByUsuario(u)).thenReturn(List.of(entrada));

        juegoService.tirarDelInventario("ash", null, "Potion", 2);

        ArgumentCaptor<InventarioUsuario> captor = ArgumentCaptor.forClass(InventarioUsuario.class);
        verify(inventarioRepo).save(captor.capture());
        assertThat(captor.getValue().getCantidad()).isEqualTo(3);
        verify(inventarioRepo, never()).delete(any());
    }

    @Test
    void tirar_ultimaUnidad_eliminaFila() {
        Usuario u = usuarioBase();
        Item pocion = itemPocion();
        InventarioUsuario entrada = new InventarioUsuario(u, pocion, 1);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Potion")).thenReturn(Optional.of(pocion));
        when(inventarioRepo.findByUsuarioAndItem(u, pocion)).thenReturn(Optional.of(entrada));
        when(inventarioRepo.findByUsuario(u)).thenReturn(Collections.emptyList());

        List<Map<String, Object>> resultado = juegoService.tirarDelInventario("ash", null, "Potion", 1);

        verify(inventarioRepo).delete(entrada);
        verify(inventarioRepo, never()).save(any());
        assertThat(resultado).isEmpty();
    }

    // =========================================================================
    // usarItemFueraCombate
    // =========================================================================

    @Test
    void usar_sinPokemonId_lanzaErrorNegocio() {
        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", 1, null, null))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("pokemonObjetivoId");
    }

    @Test
    void usar_itemCaptura_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item ball = itemConEfecto("Poke-Ball", "CAPTURE_1.0");
        PokemonUsuario pkm = pokemonSano(u, 30, 30);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Poke-Ball")).thenReturn(Optional.of(ball));
        when(inventarioRepo.findByUsuarioAndItem(u, ball))
            .thenReturn(Optional.of(new InventarioUsuario(u, ball, 1)));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));

        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", null, "Poke-Ball", 10L))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("fuera de combate");
    }

    @Test
    void usar_pocionEnPokemonDebilitado_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item pocion = itemPocion();
        PokemonUsuario pkm = pokemonSano(u, 0, 40); // HP 0 = debilitado
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Potion")).thenReturn(Optional.of(pocion));
        when(inventarioRepo.findByUsuarioAndItem(u, pocion))
            .thenReturn(Optional.of(new InventarioUsuario(u, pocion, 3)));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", null, "Potion", 10L))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("debilitado");
    }

    @Test
    void usar_pocionEnPokemonConPsMax_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item pocion = itemPocion();
        PokemonUsuario pkm = pokemonSano(u, 40, 40); // HP máximo
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Potion")).thenReturn(Optional.of(pocion));
        when(inventarioRepo.findByUsuarioAndItem(u, pocion))
            .thenReturn(Optional.of(new InventarioUsuario(u, pocion, 1)));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", null, "Potion", 10L))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("máximo");
    }

    @Test
    void usar_pocion_restauraPsYDescuentaInventario() {
        Usuario u = usuarioBase();
        Item pocion = itemPocion();      // HEAL_20
        PokemonUsuario pkm = pokemonSano(u, 10, 40);
        InventarioUsuario inv = new InventarioUsuario(u, pocion, 2);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Potion")).thenReturn(Optional.of(pocion));
        when(inventarioRepo.findByUsuarioAndItem(u, pocion)).thenReturn(Optional.of(inv));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());
        when(pokemonRepo.findByUsuarioId(1L)).thenReturn(List.of(pkm));
        when(inventarioRepo.findByUsuario(u)).thenReturn(List.of());

        juegoService.usarItemFueraCombate("ash", null, "Potion", 10L);

        ArgumentCaptor<PokemonUsuario> captor = ArgumentCaptor.forClass(PokemonUsuario.class);
        verify(pokemonRepo).save(captor.capture());
        assertThat(captor.getValue().getHpActual()).isEqualTo(30); // 10 + 20
        ArgumentCaptor<InventarioUsuario> invCaptor = ArgumentCaptor.forClass(InventarioUsuario.class);
        verify(inventarioRepo).save(invCaptor.capture());
        assertThat(invCaptor.getValue().getCantidad()).isEqualTo(1); // 2 - 1
    }

    @Test
    void usar_antidoto_curaEnvenenado() {
        Usuario u = usuarioBase();
        Item antidoto = itemConEfecto("Antidote", "CURE_PSN");
        PokemonUsuario pkm = pokemonSano(u, 20, 40);
        pkm.setEstado(Estado.ENVENENADO);
        InventarioUsuario inv = new InventarioUsuario(u, antidoto, 1);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Antidote")).thenReturn(Optional.of(antidoto));
        when(inventarioRepo.findByUsuarioAndItem(u, antidoto)).thenReturn(Optional.of(inv));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());
        when(pokemonRepo.findByUsuarioId(1L)).thenReturn(List.of(pkm));
        when(inventarioRepo.findByUsuario(u)).thenReturn(List.of());

        juegoService.usarItemFueraCombate("ash", null, "Antidote", 10L);

        ArgumentCaptor<PokemonUsuario> captor = ArgumentCaptor.forClass(PokemonUsuario.class);
        verify(pokemonRepo).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo(Estado.SALUDABLE);
        verify(inventarioRepo).delete(inv); // única unidad, se borra la fila
    }

    @Test
    void usar_maxPocion_restauraHpTotal() {
        Usuario u = usuarioBase();
        Item maxPocion = itemConEfecto("Max-Potion", "HEAL_MAX");
        PokemonUsuario pkm = pokemonSano(u, 15, 50);
        InventarioUsuario inv = new InventarioUsuario(u, maxPocion, 1);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Max-Potion")).thenReturn(Optional.of(maxPocion));
        when(inventarioRepo.findByUsuarioAndItem(u, maxPocion)).thenReturn(Optional.of(inv));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());
        when(pokemonRepo.findByUsuarioId(1L)).thenReturn(List.of(pkm));
        when(inventarioRepo.findByUsuario(u)).thenReturn(List.of());

        juegoService.usarItemFueraCombate("ash", null, "Max-Potion", 10L);

        ArgumentCaptor<PokemonUsuario> captor = ArgumentCaptor.forClass(PokemonUsuario.class);
        verify(pokemonRepo).save(captor.capture());
        assertThat(captor.getValue().getHpActual()).isEqualTo(50);
    }

    @Test
    void usar_fullRestore_curaHpYEstado() {
        Usuario u = usuarioBase();
        Item fullRestore = itemConEfecto("Full-Restore", "HEAL_MAX_STATUS");
        PokemonUsuario pkm = pokemonSano(u, 10, 50);
        pkm.setEstado(Estado.PARALIZADO);
        InventarioUsuario inv = new InventarioUsuario(u, fullRestore, 1);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Full-Restore")).thenReturn(Optional.of(fullRestore));
        when(inventarioRepo.findByUsuarioAndItem(u, fullRestore)).thenReturn(Optional.of(inv));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());
        when(pokemonRepo.findByUsuarioId(1L)).thenReturn(List.of(pkm));
        when(inventarioRepo.findByUsuario(u)).thenReturn(List.of());

        Map<String, Object> res = juegoService.usarItemFueraCombate("ash", null, "Full-Restore", 10L);

        ArgumentCaptor<PokemonUsuario> captor = ArgumentCaptor.forClass(PokemonUsuario.class);
        verify(pokemonRepo).save(captor.capture());
        assertThat(captor.getValue().getHpActual()).isEqualTo(50);
        assertThat(captor.getValue().getEstado()).isEqualTo(Estado.SALUDABLE);
        assertThat((String) res.get("mensaje")).contains("curado");
    }

    @Test
    void usar_fullRestore_pokemonPerfecto_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item fullRestore = itemConEfecto("Full-Restore", "HEAL_MAX_STATUS");
        PokemonUsuario pkm = pokemonSano(u, 50, 50); // HP máximo y SALUDABLE
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Full-Restore")).thenReturn(Optional.of(fullRestore));
        when(inventarioRepo.findByUsuarioAndItem(u, fullRestore))
            .thenReturn(Optional.of(new InventarioUsuario(u, fullRestore, 1)));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", null, "Full-Restore", 10L))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("perfectas condiciones");
    }

    @Test
    void usar_curaTotal_curaEnvenenado() {
        Usuario u = usuarioBase();
        Item curaTotal = itemConEfecto("Full-Heal", "CURE_ALL");
        PokemonUsuario pkm = pokemonSano(u, 30, 50);
        pkm.setEstado(Estado.GRAVE_ENVENENADO);
        pkm.setContadorToxico(3);
        InventarioUsuario inv = new InventarioUsuario(u, curaTotal, 2);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Full-Heal")).thenReturn(Optional.of(curaTotal));
        when(inventarioRepo.findByUsuarioAndItem(u, curaTotal)).thenReturn(Optional.of(inv));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());
        when(pokemonRepo.findByUsuarioId(1L)).thenReturn(List.of(pkm));
        when(inventarioRepo.findByUsuario(u)).thenReturn(List.of());

        juegoService.usarItemFueraCombate("ash", null, "Full-Heal", 10L);

        ArgumentCaptor<PokemonUsuario> captor = ArgumentCaptor.forClass(PokemonUsuario.class);
        verify(pokemonRepo).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo(Estado.SALUDABLE);
        assertThat(captor.getValue().getContadorToxico()).isEqualTo(0);
    }

    @Test
    void usar_antidotoEnParalizado_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item antidoto = itemConEfecto("Antidote", "CURE_PSN");
        PokemonUsuario pkm = pokemonSano(u, 20, 40);
        pkm.setEstado(Estado.PARALIZADO); // estado diferente al que cura el antídoto
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Antidote")).thenReturn(Optional.of(antidoto));
        when(inventarioRepo.findByUsuarioAndItem(u, antidoto))
            .thenReturn(Optional.of(new InventarioUsuario(u, antidoto, 1)));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", null, "Antidote", 10L))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("no cura");
    }

    @Test
    void usar_pokemonNoEsTuyo_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item pocion = itemPocion();
        PokemonUsuario pkm = pokemonSano(u, 10, 40);
        pkm.setUsuarioId(999L); // pertenece a otro usuario
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Potion")).thenReturn(Optional.of(pocion));
        when(inventarioRepo.findByUsuarioAndItem(u, pocion))
            .thenReturn(Optional.of(new InventarioUsuario(u, pocion, 1)));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));

        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", null, "Potion", 10L))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("no es tuyo");
    }

    @Test
    void usar_itemNone_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item cuerda = itemConEfecto("Escape-Rope", "NONE");
        PokemonUsuario pkm = pokemonSano(u, 20, 40);
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Escape-Rope")).thenReturn(Optional.of(cuerda));
        when(inventarioRepo.findByUsuarioAndItem(u, cuerda))
            .thenReturn(Optional.of(new InventarioUsuario(u, cuerda, 1)));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));

        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", null, "Escape-Rope", 10L))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("fuera de combate");
    }

    @Test
    void usar_antidoto_enPokemonSano_lanzaErrorNegocio() {
        Usuario u = usuarioBase();
        Item antidoto = itemConEfecto("Antidote", "CURE_PSN");
        PokemonUsuario pkm = pokemonSano(u, 20, 40); // SALUDABLE por defecto
        when(userRepo.findByUsername("ash")).thenReturn(Optional.of(u));
        when(itemRepo.findByNombreIgnoreCase("Antidote")).thenReturn(Optional.of(antidoto));
        when(inventarioRepo.findByUsuarioAndItem(u, antidoto))
            .thenReturn(Optional.of(new InventarioUsuario(u, antidoto, 1)));
        when(pokemonRepo.findById(10L)).thenReturn(Optional.of(pkm));
        when(pokedexRepo.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> juegoService.usarItemFueraCombate("ash", null, "Antidote", 10L))
            .isInstanceOf(ErrorNegocio.class)
            .hasMessageContaining("estado");
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private static PokemonUsuario pokemonSano(Usuario u, int hpActual, int hpMax) {
        PokemonUsuario p = new PokemonUsuario();
        p.setId(10L);
        p.setUsuarioId(u.getIdUsuario());
        p.setPokedexId(152);
        p.setHpActual(hpActual);
        p.setHpMax(hpMax);
        p.setEstado(Estado.SALUDABLE);
        p.setTurnosSueno(0);
        p.setContadorToxico(0);
        p.setTurnosConfusion(0);
        return p;
    }

    private static Item itemConEfecto(String nombre, String efecto) {
        Item item = new Item();
        item.setIdItem(2);
        item.setNombre(nombre);
        item.setPrecio(1);
        item.setEfecto(efecto);
        return item;
    }

    private static Usuario usuarioBase() {
        Usuario u = new Usuario();
        u.setIdUsuario(1L);
        u.setUsername("ash");
        return u;
    }

    private static Item itemPocion() {
        Item item = new Item();
        item.setIdItem(1);
        item.setNombre("Potion");
        item.setPrecio(1);
        item.setEfecto("HEAL_20");
        return item;
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
