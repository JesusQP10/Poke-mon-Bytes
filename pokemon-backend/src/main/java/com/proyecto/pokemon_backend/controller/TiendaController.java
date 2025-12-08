package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.CompraRequest;
import com.proyecto.pokemon_backend.service.TiendaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/tienda")
public class TiendaController {

    private final TiendaService tiendaService;

    public TiendaController(TiendaService tiendaService){
        this.tiendaService = tiendaService;
    }

    // Post http: //localhost:8081/api/v1/tienda/comprar
    @PostMapping("/comprar")
    public ResponseEntity<String> comprarItem(@RequestBody CompraRequest request){
        try{
            //Token del usuario
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            String resultado = tiendaService.comprarItem(username, request);
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e){
            return ResponseEntity.badRequest().body("Error en la compra: " + e.getMessage());
        }
    }
    
}
