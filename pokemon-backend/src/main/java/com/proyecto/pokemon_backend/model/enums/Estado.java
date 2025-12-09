package com.proyecto.pokemon_backend.model.enums;

/**
 * Enumeración que define los Estados Alterados Persistentes .
 * Estos estados se almacenan en la base de datos (tabla POKEMON_USUARIO) y persisten
 * después del combate si no son curados (Centro Pokémon o Ítems).
 * NOTA: Un Pokémon solo puede tener UNO de estos estados a la vez.
 * Otros estados como "Confusión" o "Drenadoras" son volátiles y se gestionan con booleanos/contadores aparte.
 */

public enum Estado {
    SALUDABLE,
    QUEMADO, // Atq.Fisico se reduce en un 1/8 (BRN) y pierde 1/16 por turno
    ENVENENADO, // Pierde 1/8 de su PS maximos al final de cada turno (PSN)
    DORMIDO, // No puede atacar por 1-3 turnos (SLP)
    PARALIZADO, //Baja la velocidad 1/2 y tiene 25% de probabilidad de no atacar (PAR)
    CONGELADO, // No puede atacar hasta que se descongele (25% de probabilidad de descongelarse cada turno) (FRZ)
    GRAVE_ENVENENADO // Perdida progresiva de PS cada turno (1/16, 2/16, 3/16, etc.) (TOX)
}
