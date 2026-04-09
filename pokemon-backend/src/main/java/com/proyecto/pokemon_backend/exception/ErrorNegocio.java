package com.proyecto.pokemon_backend.exception;

/**
 * Excepción de dominio para errores de reglas de negocio.
 *
 * Se lanza cuando una operación viola una regla del juego
 * (fondos insuficientes, Pokémon debilitado, etc.).
 * El manejador global la convierte en HTTP 400.
 */
public class ErrorNegocio extends RuntimeException {

    public ErrorNegocio(String mensaje) {
        super(mensaje);
    }
}
