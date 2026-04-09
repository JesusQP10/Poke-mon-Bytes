package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Catálogo estático de objetos disponibles en la tienda.
 *
 * El campo 'efecto' es un código interno que BatallaService/TiendaService
 * interpreta para aplicar la lógica correspondiente.
 * Ejemplos: "HEAL_20", "CAPTURE_1.5", "CURE_PSN".
 */
@Entity
@Data
@NoArgsConstructor
@Table(name = "ITEMS")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item")
    private Integer idItem;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(nullable = false)
    private Integer precio;

    /** Código de lógica de negocio. No es texto descriptivo para el usuario. */
    @Column(nullable = false)
    private String efecto;
}
