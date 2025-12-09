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
import org.springframework.security.core.Authentication;

/**
 * Controlador REST que expone la API del Motor de Batalla.
 * * Actúa como la Capa de Presentación para las fases de Combate y Captura.
 * * Responsabilidades:
 * 1. Definir los Endpoints HTTP (Rutas).
 * 2. Validar la seguridad (asegurar que solo usuarios logueados pueden jugar).
 * 3. Traducir JSON a DTOs y delegar la lógica al 'BatallaService'.
 */

@RestController
@RequestMapping("/api/v1/batalla")
public class BatallaController {

    private final BatallaService batallaService;
    public BatallaController(BatallaService batallaService) {
        this.batallaService = batallaService;
    }

    /**
     * Endpoint PRINCIPAL del Core Loop: Ejecutar un Turno.
     * URI: POST /api/v1/batalla/turno
     * @PreAuthorize("isAuthenticated()"): 
     * Anotación de Spring Security. Verifica que el SecurityContext tenga un usuario válido.
     * Si el JwtAuthenticationFilter no encontró un token válido antes, este método NI SE EJECUTA
     * y devuelve 403 Forbidden automáticamente.
     * @param request DTO con la acción del jugador (Atacar, Movimiento ID...).
     * @return DTO TurnoResponse con el resultado (Daño, mensajes) y código 200 OK.
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
            // En una app final, esto devolvería un DTO de error.
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Endpoint para la Mecánica de Captura (Fase IV).
     * URI: POST /api/v1/batalla/captura
     */

    @PostMapping("/captura")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> intentarCaptura(@RequestBody CapturaRequest request){

        // --- EXTRACCIÓN SEGURA DEL USUARIO ---
        // No confiamos en que el cliente nos diga "Soy X" en el JSON.
        // Extraemos la identidad real desde el Token JWT validado por el filtro de seguridad.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        try{
            // Pasamos el username seguro al servicio para que gestione el inventario
            String resultado = batallaService.intentarCaptura(username, request);
            return ResponseEntity.ok(resultado);
        }catch(RuntimeException e){
            // Si falla (ej: no tiene Pokeballs), devolvemos el mensaje de error al cliente.
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
}
