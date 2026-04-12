package com.proyecto.pokemon_backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.proyecto.pokemon_backend.model.Item;


/**
 * Repositorio de Acceso a Datos para el Catálogo de Ítems.
 * Gestiona las operaciones CRUD sobre la tabla 'ITEMS'.
 * Esta interfaz es utilizada principalmente por el 'TiendaService' para consultar precios y verificar existencias.
 */

public interface RepositorioObjeto extends JpaRepository<Item, Integer> {

    /** Coincidencia exacta por nombre tal como figura en BD. */
    Optional<Item> findByNombre(String nombre);

    /** Búsqueda tolerante a mayúsculas y variantes de espacios/guiones en nombres de Ball. */
    Optional<Item> findByNombreIgnoreCase(String nombre);
}

