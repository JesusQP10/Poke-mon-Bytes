package com.proyecto.pokemon_backend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * Clase que define la Clave Primaria Compuesta para la tabla intermedia 'INVENTARIO_USUARIO'.
 * @Embeddable: Indica a JPA que esta clase no es una entidad por sí misma, 
 * sino un componente que se incrustará dentro de otra entidad (@EmbeddedId).
 * Implementa 'Serializable': Requisito obligatorio de Hibernate para las clases 
 * que actúan como identificadores compuestos (PK), permitiendo su serialización 
 * en caché o transferencia de red.
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
