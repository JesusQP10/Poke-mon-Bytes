package com.proyecto.pokemon_backend.exception;

/**
 * Fallo controlado en el login (usuario inexistente o contraseña no coincide).
 * El manejador global la convierte en 401 con el mensaje concreto para el cliente.
 */
public class FalloInicioSesion extends RuntimeException {

    public FalloInicioSesion(String mensaje) {
        super(mensaje);
    }
}
