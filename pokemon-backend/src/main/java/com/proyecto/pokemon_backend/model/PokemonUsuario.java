package com.proyecto.pokemon_backend.model;

import com.proyecto.pokemon_backend.model.enums.Estado;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@Table(name = "POKEMON_USUARIO")

public class PokemonUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pokemon_usuario")
    private Long id;

    // Relación N:1 (Muchos Pokemon pueden pertenecer a un Usuario)
    // Asumimos que Usuario tiene un longID
    @Column(name = "id_usuario", nullable = false)
    private Long usuarioId;

    // ID de la Pokedex Maestra para la referencia (FK)
    @Column(name = "id_pokedex", nullable = false)
    private Integer pokedexId;

    // -- Estadísticas que cambian con la progresion --
    @Column(name = "nivel", nullable = false)
    private Integer nivel = 5;
    @Column(name = "experiencia", nullable = false)
    private Integer experiencia = 0;

    // -- Estado durante el combate --
    @Column(name = "hp_max", nullable = false)
    private Integer hpMax;
    @Column(name = "hp_actual", nullable = false)
    private Integer hpActual;
    @Column(name = "posicion_equipo", nullable = false)
    private Integer posicionEquipo = 0;

    // -- STATS ACTUALES (Para calculo de daño y velocidad) --
    @Column (name = "ataque_stat", nullable = false)
    private Integer ataqueStat;

    @Column (name = "defensa_stat", nullable = false)
    private Integer defensaStat;

    @Column (name = "ataque_especial_stat", nullable = false)
    private Integer ataqueEspecialStat;

    @Column (name = "defensa_especial_stat", nullable = false)
    private Integer defensaEspecialStat;

    @Column (name = "velocidad_stat", nullable = false)
    private Integer velocidadStat;


    // -- Campos de Estado --
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado = Estado.SALUDABLE;

    @Column(name = "turnos_confusion", nullable = false)
    private Integer turnosConfusion = 0;

    @Column(name = "contador_toxico", nullable = false)
    private Integer contadorToxico = 0;

    @Column (name = "turnos_sueno", nullable = false)
    private Integer turnosSueno = 0;

    @Column (name = "tiene_drenadoras", nullable = false)
    private Boolean tieneDrenadoras = false;
    
}