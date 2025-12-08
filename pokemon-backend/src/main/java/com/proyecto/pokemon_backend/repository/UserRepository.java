package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// JpaRepository permite a Spring crear automáticamente todos los métodos CRUD básicos
public interface UserRepository extends JpaRepository<Usuario, Long> {
    
    // Método CRÍTICO para el login: Spring lo implementa automáticamente
    Optional<Usuario> findByUsername(String username);
}