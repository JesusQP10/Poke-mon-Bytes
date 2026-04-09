package com.proyecto.pokemon_backend.model.enums;

/**
 * Estados alterados persistentes de Gen II.
 *
 * Estos estados se guardan en POKEMON_USUARIO y sobreviven al combate
 * hasta que se curen (Centro Pokémon o ítem).
 *
 * Estados volátiles (confusión, drenadoras) se gestionan con campos
 * separados en PokemonUsuario porque no persisten entre batallas.
 */
public enum Estado {

    /** Sin estado alterado. */
    SALUDABLE,

    /** BRN: Reduce el Ataque físico a la mitad. Pierde 1/8 del HP máximo al final de cada turno. */
    QUEMADO,

    /** PSN: Pierde 1/8 del HP máximo al final de cada turno. */
    ENVENENADO,

    /** SLP: No puede atacar durante 1-3 turnos. */
    DORMIDO,

    /** PAR: Velocidad reducida a la mitad. 25% de probabilidad de no poder atacar cada turno. */
    PARALIZADO,

    /** FRZ: No puede atacar. 10% de probabilidad de descongelarse al inicio de cada turno. */
    CONGELADO,

    /** TOX: Daño progresivo (1/16, 2/16, 3/16... del HP máximo por turno). */
    GRAVE_ENVENENADO
}
