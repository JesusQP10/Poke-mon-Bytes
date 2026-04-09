package com.proyecto.pokemon_backend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Clave primaria compuesta para INVENTARIO_USUARIO.
 *
 * Serializable es obligatorio para claves compuestas en Hibernate
 * (necesario para caché de segundo nivel y serialización de sesión).
 */
@Embeddable
@Data
@NoArgsConstructor
public class InventarioId implements Serializable {

    private Long usuarioId;
    private Integer itemId;

    public InventarioId(Long usuarioId, Integer itemId) {
        this.usuarioId = usuarioId;
        this.itemId = itemId;
    }
}
