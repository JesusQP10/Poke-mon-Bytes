package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ATAQUES")
@Data // Lombok genera automáticamente setCategoria() y getCategoria()
@NoArgsConstructor
public class Ataques {

    @Id
    @Column(name = "id_ataque") // Asegúrate de que coincide con tu SQL
    private Integer idAtaque;

    @Column(nullable = false)
    private String nombre;
    
    @Column(nullable = false)
    private String tipo; // fire, water, etc.
    
    // ESTE ES EL CAMPO QUE FALLA
    @Column(nullable = false)
    private String categoria; // physical, special, status
    
    @Column(nullable = false)
    private Integer potencia;
    
    @Column(name = "precision_base", nullable = false)
    private Integer precisionBase;
    
    @Column(name = "pp_base", nullable = false)
    private Integer ppBase;
}