package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.SolicitudCompra;
import com.proyecto.pokemon_backend.service.TiendaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tienda")
public class TiendaController {

    private final TiendaService tiendaService;

    public TiendaController(TiendaService tiendaService) {
        this.tiendaService = tiendaService;
    }

    @PostMapping("/comprar")
    public ResponseEntity<Map<String, String>> comprar(
        @Valid @RequestBody SolicitudCompra request,
        Authentication auth
    ) {
        String resultado = tiendaService.comprarItem(auth.getName(), request);
        return ResponseEntity.ok(Map.of("mensaje", resultado));
    }
}
