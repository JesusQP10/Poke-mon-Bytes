package com.proyecto.pokemon_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.proyecto.pokemon_backend.model.InventarioId;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Usuario;
import java.util.List;
import java.util.Optional;

import com.proyecto.pokemon_backend.model.Item;



public interface InventarioUsuarioRepository extends JpaRepository<InventarioUsuario, InventarioId> {

    // Buscar todo el inventario de un usario ( para mostrar la mochila)
    List<InventarioUsuario> findByUsuario(Usuario usuario);

    // Buscar un objeto específico en la mochila del usuario (Por ej: ver si tiene pociones)
    Optional<InventarioUsuario> findByUsuarioAndItem(Usuario usuario, Item item);
    
}
