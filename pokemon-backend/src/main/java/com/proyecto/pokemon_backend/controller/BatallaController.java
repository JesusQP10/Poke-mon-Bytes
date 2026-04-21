package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.RespuestaTurno;
import com.proyecto.pokemon_backend.dto.SolicitudCaptura;
import com.proyecto.pokemon_backend.dto.SolicitudHuir;
import com.proyecto.pokemon_backend.dto.SolicitudTurno;
import com.proyecto.pokemon_backend.service.BatallaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Combate: turnos con daño Gen II, PP persistidos, captura con consumo de Ball y ciclo de vida de salvajes
 * (crear instancia bajo usuario técnico → liberar o capturar).
 */
@RestController
@RequestMapping("/api/v1/batalla")
public class BatallaController {

    private final BatallaService batallaService;

    public BatallaController(BatallaService batallaService) {
        this.batallaService = batallaService;
    }

    // --- Moveset ---

    /**
     * Cuatro huecos con PP actual/máximo; el {@code pokemonUsuarioId} debe ser del usuario autenticado
     * o de la cuenta pool de salvajes tras {@code /salvaje/preparar}.
     */
    @GetMapping("/movimientos/{pokemonUsuarioId}")
    public ResponseEntity<List<Map<String, Object>>> movimientos(
        @PathVariable Long pokemonUsuarioId,
        Authentication auth
    ) {
        return ResponseEntity.ok(batallaService.listarMovimientos(auth.getName(), pokemonUsuarioId));
    }

    /**
     * Un ataque del atacante al defensor. Valida propiedad/participación, baja PP, aplica daño o ramas de
     * estado y devuelve HP restantes + texto para la UI.
     */
    @PostMapping("/turno")
    public ResponseEntity<RespuestaTurno> turno(
        @Valid @RequestBody SolicitudTurno request,
        Authentication auth
    ) {
        return ResponseEntity.ok(batallaService.ejecutarTurno(auth.getName(), request));
    }

    /**
     * Intento de huir (combate salvaje). Probabilidad según velocidades e n.º de intento (aprox. Gen II).
     */
    @PostMapping("/huir")
    public ResponseEntity<Map<String, Object>> huir(
        @Valid @RequestBody SolicitudHuir request,
        Authentication auth
    ) {
        return ResponseEntity.ok(batallaService.intentarHuir(auth.getName(), request));
    }

    /**
     * Gasta 1 Ball del inventario, tira la probabilidad Gen II y, si toca, reasigna el salvaje al jugador
     * con hueco en el equipo.
     */
    @PostMapping("/captura")
    public ResponseEntity<Map<String, String>> captura(
        @Valid @RequestBody SolicitudCaptura request,
        Authentication auth
    ) {
        String resultado = batallaService.intentarCaptura(auth.getName(), request);
        return ResponseEntity.ok(Map.of("mensaje", resultado));
    }

    // --- Salvajes ---

    /**
     * Crea una fila en {@code POKEMON_USUARIO} propiedad del usuario {@link com.proyecto.pokemon_backend.support.CuentaSalvajes}.
     * El cliente debe llamar a {@code /salvaje/liberar} al salir del combate si no hubo captura.
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
        @SuppressWarnings("unchecked")
        List<String> ataquesMoveset = body.get("ataquesMoveset") instanceof List<?>
            ? (List<String>) body.get("ataquesMoveset")
            : null;
        Long ataqueDemoId = idLargoOpcional(body.get("ataqueDemostracionId"));
        String ataqueDemoNombre = stringOpcional(body.get("ataqueDemostracionNombre"));
        return ResponseEntity.ok(
            batallaService.prepararInstanciaSalvaje(pokedexId, nivel, ataquesMoveset, ataqueDemoId, ataqueDemoNombre)
        );
    }

    /** Elimina la instancia salvaje y sus PP persistidos; no acepta Pokémon del jugador real. */
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

    /** Acepta número o string desde JSON laxo del cliente. */
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

    /** Igual que {@link #enteroOpcional} pero para {@code pokemonUsuarioId}. */
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

    private static String stringOpcional(Object raw) {
        if (raw == null) {
            return null;
        }
        String s = String.valueOf(raw).trim();
        return s.isEmpty() ? null : s;
    }
}
