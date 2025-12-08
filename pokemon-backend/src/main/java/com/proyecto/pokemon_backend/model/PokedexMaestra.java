package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Table(name = "POKEDEX_MAESTRA")
@NoArgsConstructor
public class PokedexMaestra {

    @Id
    private Integer id_pokedex; // Clave primaria, mapeada al INT en MySQL
    private String nombre;
    private String tipo_1;
    private String tipo_2;

    // Estadísticas de II GEN
    private Integer stat_base_hp;
    private Integer stat_base_ataque;
    private Integer stat_base_defensa;
    private Integer stat_base_velocidad;
    private Integer stat_base_atq_especial;
    private Integer stat_base_def_especial;

    private Integer xp_base;
    private Integer id_evolucion;  //Clave foránea 

    @Column(name = "ratio_captura")
    private Integer ratioCaptura; // 0-255

    // La realación con la clave foranea se gestiona en MySQL directamente
    
}
