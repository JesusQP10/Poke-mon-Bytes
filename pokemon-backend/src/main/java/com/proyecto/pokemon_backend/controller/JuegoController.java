package com.proyecto.pokemon_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador de Recursos del Juego.
 * * Este controlador agrupa los endpoints que requieren que el usuario esté YA logueado.
 * * Objetivo:
 * Servir como prueba de concepto para la seguridad. Si un usuario sin Token intenta entrar aquí,
 * el 'JwtAuthenticationFilter' bloqueará la petición antes de que llegue a este código.
 */

@RestController
@RequestMapping("/api/v1/juego") // URL que requiere Token JWT

/**
     * Endpoint de Estado.
     * URI: GET /api/v1/juego/estado
     * * Función: Validar que el sistema de seguridad JWT está activo y permitiendo paso.
     * * Escalabilidad:
     * En el futuro, este endpoint evolucionará para devolver el "SaveGame" completo:
     * - Coordenadas (X, Y)
     * - Mapa actual
     * - Equipo Pokémon activo
     * * @return Mensaje de éxito 200 OK si el token es válido.
     */
public class JuegoController {

    // Este endpoint representa un recurso del juego (ej. cargar el mapa o el estado).
    @GetMapping("/estado")
    public ResponseEntity<String> getJuegoEstado() {

        // Si el código llega hasta aquí, significa que Spring Security ha validado
        // correctamente la firma y expiración del Token JWT.
        
        // En una versión final, aquí inyectaríamos el 'UsuarioRepository' para
        // devolver un JSON con el estado de la partida.
        return ResponseEntity.ok("Acceso concedido. ¡La API está lista para el juego y el JWT funciona!");
    }
}