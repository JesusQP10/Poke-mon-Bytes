package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Fila de la matriz de efectividad de tipos (Gen II).
 *
 * En lugar de miles de if-else, el sistema consulta esta tabla para saber
 * cuánto daño hace un tipo a otro. Permite rebalancear el juego tocando
 * solo la base de datos.
 *
 * Multiplicadores posibles: 0.0 (inmune), 0.5 (resistencia), 1.0 (neutro), 2.0 (debilidad).
 * Solo se persisten las relaciones no neutras (1.0 es el valor por defecto en TipoService).
 */
@Entity
@Table(name = "TIPOS")
@Data
@NoArgsConstructor
public class Tipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idTipo;

    private String atacante;
    private String defensor;
    private Double multiplicador;
}
