package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.SolicitudCaptura;
import com.proyecto.pokemon_backend.dto.SolicitudTurno;
import com.proyecto.pokemon_backend.dto.RespuestaTurno;
import com.proyecto.pokemon_backend.service.BatallaService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/batalla")
public class BatallaController {

    private final BatallaService batallaService;

    // Aquí resuelvo una parte de la lógica de combate.
    public BatallaController(BatallaService batallaService) {
        this.batallaService = batallaService;
    }

    @GetMapping("/movimientos/{pokemonUsuarioId}")
    @PreAuthorize("estaAutenticado()")
    // Este metodo se encarga de listarMovimientos.
    public ResponseEntity<List<Map<String, Object>>> listarMovimientos(@PathVariable Long pokemonUsuarioId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return ResponseEntity.ok(batallaService.listarMovimientosDisponibles(username, pokemonUsuarioId));
    }

    @PostMapping("/turno")
    @PreAuthorize("estaAutenticado()")
    // Aquí resuelvo una parte de la lógica de combate.
    public ResponseEntity<RespuestaTurno> ejecutarTurno(@RequestBody SolicitudTurno request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        try {
            RespuestaTurno response = batallaService.ejecutarTurno(username, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/captura")
    @PreAuthorize("estaAutenticado()")
    // Este metodo se encarga de intentarCaptura.
    public ResponseEntity<String> intentarCaptura(@RequestBody SolicitudCaptura request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        try {
            String resultado = batallaService.intentarCaptura(username, request);
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

