package com.proyecto.pokemon_backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.proyecto.pokemon_backend.model.Item;
import java.util.List;

/**
 * Repositorio de Acceso a Datos para el Catálogo de Ítems.
 * Gestiona las operaciones CRUD sobre la tabla 'ITEMS'.
 * Esta interfaz es utilizada principalmente por el 'TiendaService' para consultar precios y verificar existencias.
 */

public interface ItemRepository extends JpaRepository<Item, Integer> {
    Optional<Item> findByNombre(String nombre);
    
}
