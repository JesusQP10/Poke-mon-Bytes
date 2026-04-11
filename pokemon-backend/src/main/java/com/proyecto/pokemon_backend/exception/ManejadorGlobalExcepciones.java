package com.proyecto.pokemon_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Manejador centralizado de excepciones para toda la API.
 *
 * Convierte excepciones de dominio en respuestas HTTP consistentes,
 * evitando que cada controller tenga su propio try-catch.
 */
@RestControllerAdvice
public class ManejadorGlobalExcepciones {

    private static final Logger log = LoggerFactory.getLogger(ManejadorGlobalExcepciones.class);

    @ExceptionHandler(ErrorNegocio.class)
    public ResponseEntity<Map<String, Object>> manejarErrorNegocio(ErrorNegocio ex) {
        return respuesta(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(RecursoNoEncontrado.class)
    public ResponseEntity<Map<String, Object>> manejarRecursoNoEncontrado(RecursoNoEncontrado ex) {
        return respuesta(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> manejarCredencialesInvalidas(BadCredentialsException ex) {
        return respuesta(HttpStatus.UNAUTHORIZED, "Credenciales inválidas.");
    }

    /** Errores de validación de Bean Validation (@NotNull, @NotBlank, etc.). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> manejarValidacion(MethodArgumentNotValidException ex) {
        String errores = ex.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return respuesta(HttpStatus.BAD_REQUEST, errores);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> manejarGenerico(Exception ex) {
        log.error("Excepción no controlada en la API", ex);
        return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor.");
    }

    private ResponseEntity<Map<String, Object>> respuesta(HttpStatus status, String mensaje) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status.value());
        body.put("error", mensaje);
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(status.value()).body(body);
    }
}
