package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa el Catálogo de Movimientos (Moveset).
 * Mapea la tabla 'ATAQUES' de la base de datos.
 * Esta tabla es estática (cargada al inicio por Data Seeding) y contiene 
 * las reglas base para el cálculo de daño en el 'CalculoService'.
 */

@Entity
@Table(name = "ATAQUES")
@Data // Lombok genera automáticamente setCategoria() y getCategoria()
@NoArgsConstructor
public class Ataques {

    /**
     * ID único del ataque (Coincide con el ID oficial de la PokéAPI).
     * No es autogenerado porque queremos mantener la consistencia con los datos oficiales.
     */

    @Id
    @Column(name = "id_ataque") 
    private Integer idAtaque;

    @Column(nullable = false)
    private String nombre;
    
    @Column(nullable = false)
    private String tipo; // fire, water, etc.
    
    /**
     * Categoría de daño: 
     * - "physical": Usa la estadística de Ataque vs Defensa.
     * - "special": Usa la estadística de Atq. Especial vs Def. Especial.
     * - "status": No hace daño directo (ej: Gruñido, Onda Trueno).
     * Este campo decide qué fórmula aplica el 'CalculoService'.
     **/

    @Column(nullable = false)
    private String categoria; 
    
    @Column(nullable = false)
    private Integer potencia;
    
    @Column(name = "precision_base", nullable = false)
    private Integer precisionBase;
    
    @Column(name = "pp_base", nullable = false)
    private Integer ppBase;
}