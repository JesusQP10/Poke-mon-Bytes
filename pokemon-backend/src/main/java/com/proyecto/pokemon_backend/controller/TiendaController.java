package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.SolicitudCompra;
import com.proyecto.pokemon_backend.service.TiendaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Tienda in-game: precios del catálogo de {@code ITEMS}. El dinero vive en {@code USUARIOS};
 * la mochila en {@code INVENTARIO_USUARIO}.
 */
@RestController
@RequestMapping("/api/v1/tienda")
public class TiendaController {

    private final TiendaService tiendaService;

    public TiendaController(TiendaService tiendaService) {
        this.tiendaService = tiendaService;
    }

    /** Cuerpo validado ({@link SolicitudCompra}): descuenta y devuelve mensaje, {@code money} e {@code inventario}. */
    @PostMapping("/comprar")
    public ResponseEntity<Map<String, Object>> comprar(
        @Valid @RequestBody SolicitudCompra request,
        Authentication auth
    ) {
        return ResponseEntity.ok(tiendaService.comprarItem(auth.getName(), request));
    }
}
