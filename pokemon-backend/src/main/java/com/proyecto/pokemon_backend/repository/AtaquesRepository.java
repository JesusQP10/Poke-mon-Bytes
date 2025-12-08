package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.Ataques;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AtaquesRepository extends JpaRepository<Ataques, Integer> {
    
}
