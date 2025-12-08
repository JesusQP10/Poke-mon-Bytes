package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.Tipo; // Asumimos que esta entidad ya está en el paquete 'model'
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// Extiende JpaRepository para heredar todos los métodos CRUD para la entidad Tipo.
public interface TipoRepository extends JpaRepository<Tipo, Integer> {
    
    // Este es un método CRÍTICO para el Motor de Batalla: 
    // Lo usaremos en el BatallaService para buscar el multiplicador (x0.5, x2.0, etc.)
    Optional<Tipo> findByAtacanteAndDefensor(String atacante, String defensor);
}
