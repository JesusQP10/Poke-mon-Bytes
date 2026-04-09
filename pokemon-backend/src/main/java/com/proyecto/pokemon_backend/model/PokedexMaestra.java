package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Catálogo estático de especies Pokémon (datos de solo lectura).
 *
 * Se carga al arrancar desde la PokéAPI mediante CargadorDatos.
 * No se modifica durante el juego — es la "plantilla" de cada especie.
 *
 * Diferencia con PokemonUsuario:
 *   PokedexMaestra  → "Todos los Charizard tienen 78 HP base y son Fuego/Volador."
 *   PokemonUsuario  → "Mi Charizard tiene nivel 50, 120 HP actuales y está quemado."
 */
@Entity
@Data
@Table(name = "POKEDEX_MAESTRA")
@NoArgsConstructor
public class PokedexMaestra {

    /** Número de la Pokédex Nacional. Coincide con el ID oficial para facilitar integración con sprites y APIs. */
    @Id
    private Integer id_pokedex;

    private String nombre;

    // --- Tipos (usados por TipoService para calcular efectividad) ---
    private String tipo_1;
    private String tipo_2;

    // --- Stats base Gen II ---
    private Integer stat_base_hp;
    private Integer stat_base_ataque;
    private Integer stat_base_defensa;
    private Integer stat_base_velocidad;
    private Integer stat_base_atq_especial;
    private Integer stat_base_def_especial;

    private Integer xp_base;

    /** FK a la especie de evolución (gestionada directamente en MySQL). */
    private Integer id_evolucion;

    /**
     * Ratio de captura oficial (0-255).
     * Cuanto mayor, más fácil de capturar. Ej: Pidgey=255, Mewtwo=3.
     * Usado por CalculoService.calcularCaptura().
     */
    @Column(name = "ratio_captura")
    private Integer ratioCaptura;
}
