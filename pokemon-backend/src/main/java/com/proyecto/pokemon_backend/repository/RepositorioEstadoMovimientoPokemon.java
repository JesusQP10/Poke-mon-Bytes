package com.proyecto.pokemon_backend.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Persistencia de PP por movimiento y Pokémon en tabla auxiliar {@code POKEMON_MOVIMIENTOS_USUARIO}.
 *
 * <p>La tabla se crea con Flyway ({@code db/migration}); este repositorio solo ejecuta DML.</p>
 */
@Repository
public class RepositorioEstadoMovimientoPokemon {

    private static final String TABLE_NAME = "POKEMON_MOVIMIENTOS_USUARIO";

    private final JdbcTemplate jdbcTemplate;

    public RepositorioEstadoMovimientoPokemon(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Lee todos los movimientos persistidos de un Pokémon, ordenados por slot.
     *
     * @param pokemonId {@code id_pokemon_usuario}
     */
    public List<EstadoPpMovimiento> buscarPorPokemonId(Long pokemonId) {
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

    /**
     * Upsert de una fila de PP (al materializar slots o al sincronizar learnset).
     */
    public void insertarOActualizar(Long pokemonId, Integer moveId, Integer slotIndex, Integer ppActual) {
        String sql = "INSERT INTO " + TABLE_NAME
            + " (id_pokemon_usuario, id_ataque, slot_index, pp_actual) VALUES (?, ?, ?, ?) "
            + "ON DUPLICATE KEY UPDATE slot_index = VALUES(slot_index), pp_actual = VALUES(pp_actual)";
        jdbcTemplate.update(sql, pokemonId, moveId, slotIndex, ppActual);
    }

    /**
     * Tras consumir PP en un turno de batalla.
     */
    public void actualizarPpActual(Long pokemonId, Integer moveId, Integer ppActual) {
        String sql = "UPDATE " + TABLE_NAME + " SET pp_actual = ? WHERE id_pokemon_usuario = ? AND id_ataque = ?";
        jdbcTemplate.update(sql, ppActual, pokemonId, moveId);
    }

    /**
     * Elimina movimientos que ya no forman parte del learnset activo (mantiene solo {@code keepMoveIds}).
     */
    public void eliminarPorPokemonIdYNoEn(Long pokemonId, Set<Integer> keepMoveIds) {
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

    /** Borra todas las filas de PP asociadas a un Pokémon (liberar salvaje, reinicio, etc.). */
    public void eliminarPorPokemonId(Long pokemonId) {
        String sql = "DELETE FROM " + TABLE_NAME + " WHERE id_pokemon_usuario = ?";
        jdbcTemplate.update(sql, pokemonId);
    }

    /**
     * Fila mínima para hidratar slots: id de ataque en catálogo, orden visual y PP restante.
     */
    public record EstadoPpMovimiento(Integer moveId, Integer slotIndex, Integer ppActual) {}
}
