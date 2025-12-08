package com.proyecto.pokemon_backend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

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
