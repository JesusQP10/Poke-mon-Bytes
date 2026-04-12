package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.PokedexMaestra;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * CRUD sobre la tabla estática {@code POKEDEX_MAESTRA} (especies Gen II cargadas desde PokéAPI).
 */
public interface RepositorioPokedexMaestra extends JpaRepository<PokedexMaestra, Integer> {
}

