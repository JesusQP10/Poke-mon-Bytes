package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tabla intermedia que resuelve la relación M:N entre USUARIOS e ITEMS.
 *
 * Se usa una entidad propia (en lugar de @ManyToMany directo) porque necesitamos
 * el atributo 'cantidad': una lista simple de ítems no diría cuántas Pociones tiene el jugador.
 */
@Entity
@Data
@NoArgsConstructor
@Table(name = "INVENTARIO_USUARIO")
public class InventarioUsuario {

    @EmbeddedId
    private InventarioId id;

    @Column(nullable = false)
    private Integer cantidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("usuarioId")
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("itemId")
    @JoinColumn(name = "id_item")
    private Item item;

    /**
     * Construye una fila de inventario inicializando la clave compuesta a partir del usuario y el ítem.
     */
    public InventarioUsuario(Usuario usuario, Item item, Integer cantidad) {
        this.usuario = usuario;
        this.item = item;
        this.cantidad = cantidad;
        this.id = new InventarioId(usuario.getIdUsuario(), item.getIdItem());
    }
}
