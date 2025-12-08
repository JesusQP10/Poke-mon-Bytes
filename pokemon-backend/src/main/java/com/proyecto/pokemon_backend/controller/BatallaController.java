package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.CapturaRequest;
import com.proyecto.pokemon_backend.dto.TurnoRequest;
import com.proyecto.pokemon_backend.dto.TurnoResponse; // El DTO de respuesta
import com.proyecto.pokemon_backend.service.BatallaService;

//import org.springframework.boot.autoconfigure.couchbase.CouchbaseProperties.Authentication; <--- Conflicto con CORE.AUTHENTICATION -->
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Para la seguridad JWT
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.Authentication;



@RestController
@RequestMapping("/api/v1/batalla")
public class BatallaController {

    private final BatallaService batallaService;
    public BatallaController(BatallaService batallaService) {
        this.batallaService = batallaService;
    }

    /**
     * Endpoint para ejecutar un turno de combate.
     * URI: POST /api/v1/batalla/turno
     * Requiere un Token JWT válido en el header 'Authorization'.
     */
    @PostMapping("/turno")
    @PreAuthorize("isAuthenticated()") // Asegura que el usuario esté autenticado
    public ResponseEntity<TurnoResponse> ejecutarTurno(@RequestBody TurnoRequest request){
        try {
            // Delega toda la lógica de negocio al BatallaService
            TurnoResponse response = batallaService.ejecutarTurno(request);
            
            // Devuelve el DTO de respuesta con el resultado del turno
            return ResponseEntity.ok(response);
    }   catch (RuntimeException e) {
            // Manejo de errores (ej: Pokémon no encontrado, estado inválido)
            // En una app final, esto devolvería un DTO de error, pero un 400 es suficiente.
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/captura")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> intentarCaptura(@RequestBody CapturaRequest request){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        try{
            String resultado = batallaService.intentarCaptura(username, request);
            return ResponseEntity.ok(resultado);
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
}
