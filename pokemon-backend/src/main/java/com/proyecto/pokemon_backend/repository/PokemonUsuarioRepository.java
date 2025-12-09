package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.PokemonUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio de Persistencia para las instancias de Pokémon capturados.
 * Mapea la tabla transaccional 'POKEMON_USUARIO'.
 * A diferencia de la PokedexMaestra (que es estática), esta tabla cambia constantemente
 * (HP, experiencia, nivel, estado alterado) después de cada turno de combate.
 */

@Repository
public interface PokemonUsuarioRepository extends JpaRepository<PokemonUsuario, Long> {
    List<PokemonUsuario> findByUsuarioId(Long usuarioId);
}
