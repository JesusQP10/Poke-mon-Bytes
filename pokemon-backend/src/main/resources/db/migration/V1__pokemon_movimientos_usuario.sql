-- PP por movimiento (tabla auxiliar, no mapeada como entidad JPA).
-- Idempotente: bases que ya tenían la tabla creada en runtime siguen siendo válidas.
CREATE TABLE IF NOT EXISTS POKEMON_MOVIMIENTOS_USUARIO (
    id_pokemon_usuario BIGINT NOT NULL,
    id_ataque INT NOT NULL,
    slot_index INT NOT NULL,
    pp_actual INT NOT NULL,
    PRIMARY KEY (id_pokemon_usuario, id_ataque),
    KEY idx_pmu_pokemon (id_pokemon_usuario)
);
