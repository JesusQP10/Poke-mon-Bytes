package com.proyecto.pokemon_backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data; 
import lombok.NoArgsConstructor;

/**
 * Entidad que modela la Matriz de Efectividad (Tabla de Tipos).
 * * Mapea la tabla 'TIPOS' en la base de datos.
 * * Importancia Arquitectónica:
 * Convierte la lógica de "Debilidades y Resistencias" en datos consultables.
 * En lugar de tener miles de 'if-else' anidados , 
 * el sistema consulta esta tabla para saber cuánto daño hace un tipo a otro.
 * Esto permite re-balancear el juego tocando solo la base de datos.
 */

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