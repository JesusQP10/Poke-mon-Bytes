package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Interfaz de Acceso a Datos (DAO) para la gestión de Usuarios.
 * Extiende JpaRepository, lo que proporciona operaciones CRUD estándar 
 * (save, findById, delete, etc.) sobre la tabla 'USUARIOS' sin escribir SQL.
 * Es un componente para el módulo de Seguridad (Auth).
 */
public interface RepositorioUsuario extends JpaRepository<Usuario, Long> {
    
    // Método  para el iniciarSesion: Spring lo implementa automáticamente
    Optional<Usuario> findByUsername(String username);
}

