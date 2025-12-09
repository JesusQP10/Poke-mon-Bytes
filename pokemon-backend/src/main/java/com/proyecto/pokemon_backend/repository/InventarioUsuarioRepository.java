package com.proyecto.pokemon_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.proyecto.pokemon_backend.model.InventarioId;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
import java.util.List;
import java.util.Optional;

import com.proyecto.pokemon_backend.model.Item;

/**
 * Repositorio para la gestión del Inventario (Tabla Intermedia M:N).
 * NOTA :
 * A diferencia de los otros repositorios, este NO utiliza un tipo simple (Long/Integer)
 * como ID. Utiliza la clase 'InventarioId', que es una Clave Compuesta (@Embeddable).
 * Esto permite gestionar la relación "Usuario tiene Ítem" con atributos extra (Cantidad).
 */

public interface InventarioUsuarioRepository extends JpaRepository<InventarioUsuario, InventarioId> {

    // Buscar todo el inventario de un usario ( para mostrar la mochila)
    List<InventarioUsuario> findByUsuario(Usuario usuario);

    // Buscar un objeto específico en la mochila del usuario (Por ej: ver si tiene pociones)
    Optional<InventarioUsuario> findByUsuarioAndItem(Usuario usuario, Item item);
    
}
