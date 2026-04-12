package com.proyecto.pokemon_backend.exception;

/**
 * Excepción de dominio para recursos que no existen en base de datos.
 * El manejador global la convierte en HTTP 404.
 */
public class RecursoNoEncontrado extends RuntimeException {

    /**
     * @param mensaje detalle para logs y cuerpo de error 404
     */
    public RecursoNoEncontrado(String mensaje) {
        super(mensaje);
    }
}
