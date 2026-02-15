package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad Intermedia que gestiona el Inventario (Mochila).
 * * Resuelve la relación Muchos a Muchos (M:N) entre 'USUARIOS' e 'ITEMS'.
 * * ¿Por qué una entidad propia en lugar de @ManyToMany directo?
 * Porque necesitamos un atributo extra: 'cantidad'.
 * Una lista simple de ítems no nos diría cuántas Pociones tiene el jugador.
 **/

@Entity
@Data
@NoArgsConstructor
@Table(name = "INVENTARIO_USUARIO")
public class InventarioUsuario {

    @EmbeddedId
    private InventarioId id;

    @Column(nullable = false)
    private Integer cantidad;

    // RELACIONES USUARIO
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("usuarioId") 
    @JoinColumn(name = "id_usuario") 
    private Usuario usuario;

    // RELACIONES ITEM
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("itemId") // 
    @JoinColumn(name = "id_item") // 
    private Item item;

    // Este metodo se encarga de InventarioUsuario.
    public InventarioUsuario(Usuario usuario, Item item, Integer cantidad) {
        this.usuario = usuario;
        this.item = item;
        this.cantidad = cantidad;
        this.id = new InventarioId(usuario.getIdUsuario(), item.getIdItem());
    }
}

