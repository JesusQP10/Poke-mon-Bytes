package com.proyecto.pokemon_backend.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa el Catálogo Maestro de Objetos (Items).
 * * Mapea la tabla 'ITEMS' en la base de datos.
 * Esta entidad contiene la información estática e inmutable de los objetos 
 * disponibles en el juego (Tienda), como su precio y su efecto programado.
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

    /**
     * Código de lógica de negocio.
     * * NO es una descripción de texto para leer.
     * Es un identificador interno (ej: "HEAL_20", "CAPTURE_1.5") que el backend interpreta
     * para aplicar la lógica correspondiente (curar 20 PS o aplicar bono de captura x1.5).
     */
    
    @Column(nullable = false)
    private String efecto;
    
}
