package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.service.JuegoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/juego")
public class JuegoController {

    private final JuegoService juegoService;

    public JuegoController(JuegoService juegoService) {
        this.juegoService = juegoService;
    }

    @GetMapping("/estado")
    public ResponseEntity<Map<String, Object>> estado(Authentication auth) {
        return ResponseEntity.ok(juegoService.obtenerEstado(auth.getName()));
    }

    @PostMapping("/starter")
    public ResponseEntity<Map<String, Object>> elegirStarter(
        @RequestBody Map<String, Integer> body,
        Authentication auth
    ) {
        return ResponseEntity.ok(juegoService.elegirStarter(auth.getName(), body.get("starterId")));
    }

    @GetMapping("/equipo")
    public ResponseEntity<List<Map<String, Object>>> equipo(Authentication auth) {
        return ResponseEntity.ok(juegoService.obtenerEquipo(auth.getName()));
    }

    @PostMapping("/guardar")
    public ResponseEntity<Map<String, Object>> guardar() {
        return ResponseEntity.ok(Map.of(
            "success",   true,
            "message",   "Partida guardada correctamente.",
            "savedAt",   Instant.now().toString()
        ));
    }
}
