package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.service.JuegoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * API de partida: lo que el cliente considera “save state” dividido entre tablas (dinero, mochila, Pokémon)
 * y el JSON {@code estadoCliente} (flags de historia, nombre, reloj…). El dinero no se manda desde el front
 * para sobrescribir la BD: solo se lee aquí.
 */
@RestController
@RequestMapping("/api/v1/juego")
public class JuegoController {

    private final JuegoService juegoService;

    public JuegoController(JuegoService juegoService) {
        this.juegoService = juegoService;
    }

    // --- Lectura de estado (sincronizar menú, al cargar escena, etc.) ---

    /**
     * Devuelve un solo JSON con equipo, {@code money}, {@code inventario}, mapa/pos y, si existe,
     * {@code estadoCliente} parseado desde la columna larga del usuario.
     */
    @GetMapping("/estado")
    public ResponseEntity<Map<String, Object>> estado(Authentication auth) {
        return ResponseEntity.ok(juegoService.obtenerEstado(auth.getName()));
    }

    /** Lista ordenada de Pokémon del usuario. */
    @GetMapping("/equipo")
    public ResponseEntity<List<Map<String, Object>>> equipo(Authentication auth) {
        return ResponseEntity.ok(juegoService.obtenerEquipo(auth.getName()));
    }

    // --- Progreso jugable ---

    /**
     * Crea el primer Pokémon del run si el equipo va vacío; si ya hay equipo, devuelve el primero sin duplicar.
     * El cuerpo es {@code {"starterId": 152|155|158}}.
     */
    @PostMapping("/starter")
    public ResponseEntity<Map<String, Object>> elegirStarter(
        @RequestBody Map<String, Integer> body,
        Authentication auth
    ) {
        return ResponseEntity.ok(juegoService.elegirStarter(auth.getName(), body.get("starterId")));
    }

    /**
     * Persiste posición, mapa y/o blob de cliente. No toca dinero ni filas de inventario: eso va por
     * {@code /inventario/anadir} o por la tienda. El cuerpo puede ir vacío.
     */
    @PostMapping("/guardar")
    public ResponseEntity<Map<String, Object>> guardar(
        @RequestBody(required = false) Map<String, Object> body,
        Authentication auth
    ) {
        return ResponseEntity.ok(juegoService.guardarPartida(auth.getName(), body));
    }

    /**
     * Alinea las filas de PS en BD con el {@code teamCliente} del último guardado en servidor (blob).
     * Llamar antes de GET /estado al continuar partida (p. ej. tras recargar sin haber guardado en menú).
     */
    @PostMapping("/restaurar-hp-checkpoint")
    public ResponseEntity<Map<String, Object>> restaurarHpCheckpoint(Authentication auth) {
        juegoService.sincronizarHpEquipoDesdeBlobGuardado(auth.getName());
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /**
     * Nueva partida en servidor: borra Pokémon del usuario (y PP asociados), vacía mochila, anula JSON de
     * cliente, dinero base y spawn en habitación. Devuelve el mismo shape que {@code GET /estado}.
     */
    @PostMapping("/reiniciar")
    public ResponseEntity<Map<String, Object>> reiniciar(Authentication auth) {
        return ResponseEntity.ok(juegoService.reiniciarPartida(auth.getName()));
    }

    /**
     * Suma ítems a la tabla de inventario (recompensas, PC). Cuerpo flexible: {@code itemId} o {@code nombreItem}
     * (p. ej. {@code "Potion"}) y opcionalmente {@code cantidad} (por defecto 1). Respuesta: lista completa de líneas de mochila.
     */
    @PostMapping("/inventario/anadir")
    public ResponseEntity<Map<String, Object>> anadirInventario(
        @RequestBody Map<String, Object> body,
        Authentication auth
    ) {
        if (body == null) {
            body = Map.of();
        }
        Integer itemId = null;
        Object rawId = body.get("itemId");
        if (rawId instanceof Number) {
            itemId = ((Number) rawId).intValue();
        }
        String nombreItem = body.get("nombreItem") != null ? String.valueOf(body.get("nombreItem")).trim() : null;
        if (nombreItem != null && nombreItem.isEmpty()) {
            nombreItem = null;
        }
        int cantidad = 1;
        Object rawCant = body.get("cantidad");
        if (rawCant instanceof Number) {
            cantidad = ((Number) rawCant).intValue();
        }
        List<Map<String, Object>> inventario = juegoService.anadirAlInventario(
            auth.getName(),
            itemId,
            nombreItem,
            cantidad
        );
        Map<String, Object> res = new HashMap<>();
        res.put("inventario", inventario);
        return ResponseEntity.ok(res);
    }

    /**
     * Usa un ítem de la mochila sobre un Pokémon del equipo fuera de combate.
     * Cuerpo: {@code itemId} o {@code nombreItem} + {@code pokemonObjetivoId} (obligatorio).
     * Devuelve {@code mensaje}, {@code team} e {@code inventario} actualizados.
     */
    @PostMapping("/inventario/usar")
    public ResponseEntity<Map<String, Object>> usarInventario(
        @RequestBody Map<String, Object> body,
        Authentication auth
    ) {
        if (body == null) {
            body = Map.of();
        }
        Integer itemId = null;
        Object rawId = body.get("itemId");
        if (rawId instanceof Number) {
            itemId = ((Number) rawId).intValue();
        }
        String nombreItem = body.get("nombreItem") != null ? String.valueOf(body.get("nombreItem")).trim() : null;
        if (nombreItem != null && nombreItem.isEmpty()) {
            nombreItem = null;
        }
        Long pokemonObjetivoId = null;
        Object rawPokId = body.get("pokemonObjetivoId");
        if (rawPokId instanceof Number) {
            pokemonObjetivoId = ((Number) rawPokId).longValue();
        }
        return ResponseEntity.ok(juegoService.usarItemFueraCombate(
            auth.getName(), itemId, nombreItem, pokemonObjetivoId
        ));
    }

    /**
     * Descarta ítems de la mochila. Cuerpo igual que {@code /inventario/anadir}: {@code itemId} o
     * {@code nombreItem}, y opcionalmente {@code cantidad} (por defecto 1).
     * Elimina la fila si la cantidad resultante llega a 0.
     */
    @PostMapping("/inventario/tirar")
    public ResponseEntity<Map<String, Object>> tirarInventario(
        @RequestBody Map<String, Object> body,
        Authentication auth
    ) {
        if (body == null) {
            body = Map.of();
        }
        Integer itemId = null;
        Object rawId = body.get("itemId");
        if (rawId instanceof Number) {
            itemId = ((Number) rawId).intValue();
        }
        String nombreItem = body.get("nombreItem") != null ? String.valueOf(body.get("nombreItem")).trim() : null;
        if (nombreItem != null && nombreItem.isEmpty()) {
            nombreItem = null;
        }
        int cantidad = 1;
        Object rawCant = body.get("cantidad");
        if (rawCant instanceof Number) {
            cantidad = ((Number) rawCant).intValue();
        }
        List<Map<String, Object>> inventario = juegoService.tirarDelInventario(
            auth.getName(),
            itemId,
            nombreItem,
            cantidad
        );
        Map<String, Object> res = new HashMap<>();
        res.put("inventario", inventario);
        return ResponseEntity.ok(res);
    }

    /** Centro Pokémon: cura PS y estados del equipo activo (0–5). */
    @PostMapping("/centro/curar")
    public ResponseEntity<Map<String, Object>> curarCentroPokemon(Authentication auth) {
        return ResponseEntity.ok(juegoService.curarEquipoEnCentro(auth.getName()));
    }
}
