package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.Ataques;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Interfaz de Acceso a Datos (DAO) para la entidad 'Ataques'.
 * * Patrón Repository:
 * Esta interfaz extiende JpaRepository, lo que permite a Spring Boot
 * generar automáticamente la implementación en tiempo de ejecución.
 * * No necesitamos escribir SQL manual. Al extender JpaRepository obtenemos :
 * - save() -> INSERT / UPDATE
 * - findById() -> SELECT * FROM ataques WHERE id = ?
 * - findAll() -> SELECT * FROM ataques
 * - count() -> SELECT COUNT(*) FROM ataques
 * - delete() -> DELETE FROM ataques
 */

public interface RepositorioAtaques extends JpaRepository<Ataques, Integer> {

    /** Coincide nombres de la API (inglés, kebab-case) con filas de {@code ATAQUES}. */
    Optional<Ataques> findByNombreIgnoreCase(String nombre);
}

