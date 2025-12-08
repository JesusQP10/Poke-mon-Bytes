package com.proyecto.pokemon_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/juego") // URL que requiere Token JWT
public class JuegoController {

    // Este endpoint representa un recurso del juego (ej. cargar el mapa o el estado).
    @GetMapping("/estado")
    public ResponseEntity<String> getJuegoEstado() {
        // En un futuro, aquí se consultaría la BD con los datos del usuario autenticado
        return ResponseEntity.ok("Acceso concedido. ¡La API está lista para el juego y el JWT funciona!");
    }
}