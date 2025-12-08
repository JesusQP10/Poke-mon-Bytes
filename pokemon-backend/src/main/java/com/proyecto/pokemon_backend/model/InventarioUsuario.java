package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@Table(name = "INVENTARIO_USUARIO")
public class InventarioUsuario {

    @EmbeddedId
    private InventarioId id;

    @Column(nullable = false)
    private Integer cantidad;

    // RELATIONSHIP TO USUARIO
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("usuarioId") 
    @JoinColumn(name = "id_usuario") 
    private Usuario usuario;

    // RELATIONSHIP TO ITEM
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("itemId") // 
    @JoinColumn(name = "id_item") // 
    private Item item;

    public InventarioUsuario(Usuario usuario, Item item, Integer cantidad) {
        this.usuario = usuario;
        this.item = item;
        this.cantidad = cantidad;
        this.id = new InventarioId(usuario.getIdUsuario(), item.getIdItem());
    }
}
