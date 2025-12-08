package com.proyecto.pokemon_backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data; 
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TIPOS")
@Data // Incluye getters, setters, toString, etc.
@NoArgsConstructor
public class Tipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idTipo; // Clave primaria
    
    // Tipo del ataque
    private String atacante; 
    
    // Tipo del Pokémon defensor
    private String defensor;

    // Multiplicador de daño (0.0, 0.5, 1.0, 2.0)
    private Double multiplicador; 
}