package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.PokedexMaestra; 
import org.springframework.data.jpa.repository.JpaRepository;

// Mapea la Entidad PokedexMaestra y su tipo de Clave Primaria (Integer)
public interface PokedexMasterRepository extends JpaRepository<PokedexMaestra, Integer> {
    // Spring Data JPA provee automáticamente métodos como save(), count(), y findAll().
}
