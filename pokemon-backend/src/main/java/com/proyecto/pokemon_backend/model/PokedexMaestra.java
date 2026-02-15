package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad Maestra que representa el catálogo de especies Pokémon (Datos estáticos).
 * * Mapea la tabla 'POKEDEX_MAESTRA'.
 * * Diferencia clave con PokemonUsuario:
 * - PokemonUsuario: Es la instancia concreta (Mi Pikachu de Nivel 5 con 20 HP).
 * - PokedexMaestra: Es la definición de la especie (Todos los Pikachu tienen 35 HP base y son Eléctricos).
 * * Esta tabla se carga automáticamente al inicio desde la PokeAPI (Data Seeding).
 */

@Entity
@Data
@Table(name = "POKEDEX_MAESTRA")
@NoArgsConstructor
public class PokedexMaestra {

    /**
     * Número de la Pokédex Nacional.
     * preservar los IDs oficiales (ej: 1 = Bulbasaur, 25 = Pikachu).
     * Esto facilita la integración con APIs externas y el uso de sprites por ID.
     */
    @Id
    private Integer id_pokedex; // Clave primaria, mapeada al INT en MySQL
    private String nombre;
    // --- Sistema de Tipos ---
    // Usados por 'TipoService' para calcular la matriz de efectividad.
    private String tipo_1;
    private String tipo_2;

    // --- Estadísticas Base (Gen II) ---
    // Estos valores NO son los stats finales del Pokémon, sino la base
    // matemática que usa 'CalculoService' junto con el Nivel para determinar el poder real.
    private Integer stat_base_hp;
    private Integer stat_base_ataque;
    private Integer stat_base_defensa;
    private Integer stat_base_velocidad;
    private Integer stat_base_atq_especial;
    private Integer stat_base_def_especial;

    private Integer xp_base;
    private Integer id_evolucion;  //Clave foránea 

    /**
     * Ratio de Captura (0 - 255).
     * * Variable FUNDAMENTAL para la Fase IV (Mecánica de Captura).
     * Cuanto más alto el número, más fácil de capturar.
     * (ej: Pidgey = 255, Mewtwo = 3).
     */
    @Column(name = "ratio_captura")
    private Integer ratioCaptura; // 0-255

    // La realación con la clave foranea se gestiona en MySQL directamente
    
}

