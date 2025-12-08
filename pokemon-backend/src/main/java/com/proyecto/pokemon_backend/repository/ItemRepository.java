package com.proyecto.pokemon_backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.proyecto.pokemon_backend.model.Item;
import java.util.List;


public interface ItemRepository extends JpaRepository<Item, Integer> {
    Optional<Item> findByNombre(String nombre);
    
}
