package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.InventarioId;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión del Inventario (Tabla Intermedia M:N).
 * NOTA :
 * A diferencia de los otros repositorios, este NO utiliza un tipo simple (Long/Integer)
 * como ID. Utiliza la clase 'InventarioId', que es una Clave Compuesta (@Embeddable).
 * Esto permite gestionar la relación "Usuario tiene Ítem" con atributos extra (Cantidad).
 */

public interface RepositorioInventarioUsuario extends JpaRepository<InventarioUsuario, InventarioId> {

    /** Todas las líneas de mochila del jugador (cantidad puede ser 0). */
    List<InventarioUsuario> findByUsuario(Usuario usuario);

    /** Una fila concreta usuario+ítem, p. ej. para comprobar stock antes de captura o compra. */
    Optional<InventarioUsuario> findByUsuarioAndItem(Usuario usuario, Item item);

    /**
     * Borra todas las filas de mochila del usuario (nueva partida). JPQL + flush para no depender
     * solo de {@code findByUsuario} + delete en memoria.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM InventarioUsuario i WHERE i.id.usuarioId = :usuarioId")
    void deleteAllByUsuarioId(@Param("usuarioId") Long usuarioId);
}

