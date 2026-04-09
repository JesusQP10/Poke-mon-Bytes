package com.proyecto.pokemon_backend.model;

import com.proyecto.pokemon_backend.model.enums.Estado;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Instancia concreta de un Pokémon capturado por un jugador.
 *
 * Diferencia clave con PokedexMaestra:
 *   PokedexMaestra  → define la especie (stats base, tipos, ratio captura).
 *   PokemonUsuario  → es ESTE Pokémon específico (nivel, HP actual, estado alterado).
 *
 * Esta entidad se actualiza tras cada turno de combate.
 */
@Entity
@Data
@NoArgsConstructor
@Table(name = "POKEMON_USUARIO")
public class PokemonUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pokemon_usuario")
    private Long id;

    /** FK al propietario. Se guarda el ID directamente para evitar cargar el Usuario completo en cada consulta de batalla. */
    @Column(name = "id_usuario", nullable = false)
    private Long usuarioId;

    /** FK a la especie en PokedexMaestra. */
    @Column(name = "id_pokedex", nullable = false)
    private Integer pokedexId;

    // --- Progresión ---
    @Column(name = "nivel", nullable = false)
    private Integer nivel = 5;

    @Column(name = "experiencia", nullable = false)
    private Integer experiencia = 0;

    // --- Puntos de salud ---
    @Column(name = "hp_max", nullable = false)
    private Integer hpMax;

    @Column(name = "hp_actual", nullable = false)
    private Integer hpActual;

    /** Posición en el equipo (0-5). Valores >= 6 indican caja (PC). */
    @Column(name = "posicion_equipo", nullable = false)
    private Integer posicionEquipo = 0;

    // --- Stats de combate ---
    @Column(name = "ataque_stat", nullable = false)
    private Integer ataqueStat;

    @Column(name = "defensa_stat", nullable = false)
    private Integer defensaStat;

    @Column(name = "ataque_especial_stat", nullable = false)
    private Integer ataqueEspecialStat;

    @Column(name = "defensa_especial_stat", nullable = false)
    private Integer defensaEspecialStat;

    @Column(name = "velocidad_stat", nullable = false)
    private Integer velocidadStat;

    // --- Estado alterado persistente ---
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado = Estado.SALUDABLE;

    /** Turnos restantes de confusión (volátil, se resetea al salir de batalla). */
    @Column(name = "turnos_confusion", nullable = false)
    private Integer turnosConfusion = 0;

    /** Contador de turnos para Tóxico (daño progresivo: 1/16, 2/16, 3/16...). */
    @Column(name = "contador_toxico", nullable = false)
    private Integer contadorToxico = 0;

    /** Turnos restantes de sueño (1-3 al dormirse). */
    @Column(name = "turnos_sueno", nullable = false)
    private Integer turnosSueno = 0;

    /** True si el Pokémon tiene Drenadoras activas. */
    @Column(name = "tiene_drenadoras", nullable = false)
    private Boolean tieneDrenadoras = false;
}
