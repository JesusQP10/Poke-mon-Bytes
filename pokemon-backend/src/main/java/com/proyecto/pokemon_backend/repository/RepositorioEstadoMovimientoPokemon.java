package com.proyecto.pokemon_backend.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RepositorioEstadoMovimientoPokemon {

    private static final String TABLE_NAME = "POKEMON_MOVIMIENTOS_USUARIO";
    private static final String CREATE_TABLE_SQL = """
        CREATE TABLE IF NOT EXISTS POKEMON_MOVIMIENTOS_USUARIO (
            id_pokemon_usuario BIGINT NOT NULL,
            id_ataque INT NOT NULL,
            slot_index INT NOT NULL,
            pp_actual INT NOT NULL,
            PRIMARY KEY (id_pokemon_usuario, id_ataque),
            INDEX idx_pmu_pokemon (id_pokemon_usuario)
        )
        """;

    private final JdbcTemplate jdbcTemplate;
    private volatile boolean initialized = false;

    // RepositorioEstadoMovimientoPokemon.
    public RepositorioEstadoMovimientoPokemon(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    
    public List<EstadoPpMovimiento> buscarPorPokemonId(Long pokemonId) {
        asegurarTabla();
        String sql = "SELECT id_ataque, slot_index, pp_actual FROM " + TABLE_NAME
            + " WHERE id_pokemon_usuario = ? ORDER BY slot_index ASC";
        return jdbcTemplate.query(
            sql,
            (rs, rowNum) -> new EstadoPpMovimiento(
                rs.getInt("id_ataque"),
                rs.getInt("slot_index"),
                rs.getInt("pp_actual")
            ),
            pokemonId
        );
    }

    
    public void insertarOActualizar(Long pokemonId, Integer moveId, Integer slotIndex, Integer ppActual) {
        asegurarTabla();
        String sql = "INSERT INTO " + TABLE_NAME
            + " (id_pokemon_usuario, id_ataque, slot_index, pp_actual) VALUES (?, ?, ?, ?) "
            + "ON DUPLICATE KEY UPDATE slot_index = VALUES(slot_index), pp_actual = VALUES(pp_actual)";
        jdbcTemplate.update(sql, pokemonId, moveId, slotIndex, ppActual);
    }

    // actualizarPpActual.
    public void actualizarPpActual(Long pokemonId, Integer moveId, Integer ppActual) {
        asegurarTabla();
        String sql = "UPDATE " + TABLE_NAME + " SET pp_actual = ? WHERE id_pokemon_usuario = ? AND id_ataque = ?";
        jdbcTemplate.update(sql, ppActual, pokemonId, moveId);
    }

    
    public void eliminarPorPokemonIdYNoEn(Long pokemonId, Set<Integer> keepMoveIds) {
        asegurarTabla();
        if (keepMoveIds == null || keepMoveIds.isEmpty()) {
            eliminarPorPokemonId(pokemonId);
            return;
        }

        List<Integer> ids = new ArrayList<>(keepMoveIds);
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        String sql = "DELETE FROM " + TABLE_NAME
            + " WHERE id_pokemon_usuario = ? AND id_ataque NOT IN (" + placeholders + ")";

        List<Object> args = new ArrayList<>();
        args.add(pokemonId);
        args.addAll(ids);
        jdbcTemplate.update(sql, args.toArray());
    }

    // eliminarPorPokemonId.
    public void eliminarPorPokemonId(Long pokemonId) {
        asegurarTabla();
        String sql = "DELETE FROM " + TABLE_NAME + " WHERE id_pokemon_usuario = ?";
        jdbcTemplate.update(sql, pokemonId);
    }

    // asegurarTabla.
    private void asegurarTabla() {
        if (initialized) {
            return;
        }
        synchronized (this) {
            if (initialized) {
                return;
            }
            jdbcTemplate.execute(CREATE_TABLE_SQL);
            initialized = true;
        }
    }

    public record EstadoPpMovimiento(Integer moveId, Integer slotIndex, Integer ppActual) {}
}

