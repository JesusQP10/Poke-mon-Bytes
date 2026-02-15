package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.SolicitudCompra;
import com.proyecto.pokemon_backend.service.TiendaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para el Módulo de Economía (Tienda).
 * * Actúa como la Capa de Presentación para las transacciones de compra.
 * * Responsabilidad Arquitectónica:
 * Recibir la petición HTTP, extraer de forma segura la identidad del usuario (vía JWT)
 * y delegar la operación atómica al 'TiendaService'.
 */

@RestController
@RequestMapping("api/v1/tienda")
public class TiendaController {

    private final TiendaService tiendaService;

    // Este metodo se encarga de TiendaController.
    public TiendaController(TiendaService tiendaService){
        this.tiendaService = tiendaService;
    }

    /**
     * Endpoint para procesar una compra de ítems.
     * URI: POST /api/v1/tienda/comprar
     * Seguridad:
     * Este método asume que el usuario ya está autenticado (gracias a FiltroAutenticacionJwt).
     * @param request DTO que contiene qué quiere comprar el usuario (ID Item + Cantidad).
     * @return ResponseEntity con el resultado de la transacción o el error de negocio.
     */

    @PostMapping("/comprar")
    // Este metodo se encarga de comprarItem.
    public ResponseEntity<String> comprarItem(@RequestBody SolicitudCompra request){
        try{
            // 1. EXTRACCIÓN SEGURA DE IDENTIDAD
            // No pedimos el ID de usuario en el JSON (eso sería inseguro).
            // Lo extraemos directamente del Contexto de Seguridad de Spring, 
            // que fue rellenado previamente al validar el Token JWT
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            String resultado = tiendaService.comprarItem(username, request);
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e){
            // Si TiendaService lanza una excepción (ej: "Saldo insuficiente"),
            // la capturamos aquí y devolvemos un HTTP 400 Bad Request con el mensaje.
            return ResponseEntity.badRequest().body("Error en la compra: " + e.getMessage());
        }
    }
    
}

