package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Catálogo estático de movimientos (datos de solo lectura).
 *
 * Se carga al arrancar desde la PokéAPI. El ID coincide con el ID oficial
 * para mantener consistencia con los datos de learnset que devuelve la API.
 *
 * La categoría determina qué fórmula aplica CalculoService:
 *   "physical" → Ataque vs Defensa
 *   "special"  → Atq. Especial vs Def. Especial
 *   "status"   → Sin daño directo
 */
@Entity
@Table(name = "ATAQUES")
@Data
@NoArgsConstructor
public class Ataques {

    @Id
    @Column(name = "id_ataque")
    private Integer idAtaque;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String categoria;

    @Column(nullable = false)
    private Integer potencia;

    @Column(name = "precision_base", nullable = false)
    private Integer precisionBase;

    @Column(name = "pp_base", nullable = false)
    private Integer ppBase;
}
