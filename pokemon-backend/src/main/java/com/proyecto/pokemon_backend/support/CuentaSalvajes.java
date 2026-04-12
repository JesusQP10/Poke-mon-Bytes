package com.proyecto.pokemon_backend.support;

/**
 * Los Pokémon salvajes de combate pertenecen a esta cuenta
 * hasta que se liberan o el jugador los captura.
 */
public final class CuentaSalvajes {

    /** Nombre de usuario técnico cuya PK aparece en {@code POKEMON_USUARIO.id_usuario} para salvajes. */
    public static final String USERNAME = "__wild_battle_pool__";

    /** Utilidad: no instanciar. */
    private CuentaSalvajes() {}
}
