package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.RespuestaTurno;
import com.proyecto.pokemon_backend.dto.SolicitudCaptura;
import com.proyecto.pokemon_backend.dto.SolicitudTurno;
import com.proyecto.pokemon_backend.service.BatallaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/batalla")
public class BatallaController {

    private final BatallaService batallaService;

    public BatallaController(BatallaService batallaService) {
        this.batallaService = batallaService;
    }

    @GetMapping("/movimientos/{pokemonUsuarioId}")
    public ResponseEntity<List<Map<String, Object>>> movimientos(
        @PathVariable Long pokemonUsuarioId,
        Authentication auth
    ) {
        return ResponseEntity.ok(batallaService.listarMovimientos(auth.getName(), pokemonUsuarioId));
    }

    @PostMapping("/turno")
    public ResponseEntity<RespuestaTurno> turno(
        @Valid @RequestBody SolicitudTurno request,
        Authentication auth
    ) {
        return ResponseEntity.ok(batallaService.ejecutarTurno(auth.getName(), request));
    }

    @PostMapping("/captura")
    public ResponseEntity<Map<String, String>> captura(
        @Valid @RequestBody SolicitudCaptura request,
        Authentication auth
    ) {
        String resultado = batallaService.intentarCaptura(auth.getName(), request);
        return ResponseEntity.ok(Map.of("mensaje", resultado));
    }
}
