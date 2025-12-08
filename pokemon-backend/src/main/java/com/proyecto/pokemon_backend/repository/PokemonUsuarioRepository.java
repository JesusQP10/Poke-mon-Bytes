package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.PokemonUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PokemonUsuarioRepository extends JpaRepository<PokemonUsuario, Long> {
    List<PokemonUsuario> findByUsuarioId(Long usuarioId);
}
