package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.RespuestaTurno;
import com.proyecto.pokemon_backend.dto.SolicitudCaptura;
import com.proyecto.pokemon_backend.dto.SolicitudTurno;
import com.proyecto.pokemon_backend.service.BatallaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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

    /**
     * Crea una instancia de Pokémon salvaje en BD para combate.
     * El cliente debe liberarla con {@code /salvaje/liberar} al terminar si no hubo captura.
     */
    @PostMapping("/salvaje/preparar")
    public ResponseEntity<Map<String, Object>> prepararSalvaje(
        @RequestBody(required = false) Map<String, Object> body,
        @SuppressWarnings("unused") Authentication auth
    ) {
        if (body == null) {
            body = Map.of();
        }
        Integer pokedexId = enteroOpcional(body.get("pokedexId"));
        Integer nivel = enteroOpcional(body.get("nivel"));
        return ResponseEntity.ok(batallaService.prepararInstanciaSalvaje(pokedexId, nivel));
    }

    @PostMapping("/salvaje/liberar")
    public ResponseEntity<Map<String, String>> liberarSalvaje(
        @RequestBody(required = false) Map<String, Object> body,
        @SuppressWarnings("unused") Authentication auth
    ) {
        if (body == null) {
            body = new HashMap<>();
        }
        Long id = idLargoOpcional(body.get("pokemonUsuarioId"));
        batallaService.liberarInstanciaSalvaje(id);
        return ResponseEntity.ok(Map.of("mensaje", "Instancia salvaje eliminada."));
    }

    private static Integer enteroOpcional(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Long idLargoOpcional(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
