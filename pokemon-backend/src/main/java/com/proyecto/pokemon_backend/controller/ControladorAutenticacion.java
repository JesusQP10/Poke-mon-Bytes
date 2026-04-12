package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.SolicitudRegistro;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.security.ServicioJwt;
import com.proyecto.pokemon_backend.service.ServicioAutenticacion;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Registro, login y emisión del JWT (rutas sin prefijo {@code /api/v1}). */
@RestController
@RequestMapping("/auth")
public class ControladorAutenticacion {

    private final AuthenticationManager authManager;
    private final ServicioJwt jwtService;
    private final ServicioAutenticacion authService;

    public ControladorAutenticacion(
        AuthenticationManager authManager,
        ServicioJwt jwtService,
        ServicioAutenticacion authService
    ) {
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.authService = authService;
    }

    /** Crea fila en {@code USUARIOS} con BCrypt; 201 si todo bien, 409/400 vía manejador global si choca. */
    @PostMapping("/registrar")
    public ResponseEntity<Map<String, String>> registrar(@Valid @RequestBody SolicitudRegistro request) {
        Usuario nuevo = new Usuario();
        nuevo.setUsername(request.getUsername());
        nuevo.setPasswordHash(request.getPassword());

        Usuario guardado = authService.registrarUsuarioNuevo(nuevo);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("message", "Usuario registrado: " + guardado.getUsername()));
    }

    /**
     * Autentica contra Spring Security y devuelve JWT + username. El mismo DTO que registro reutiliza
     * usuario/contraseña para no duplicar esquema en OpenAPI a mano.
     */
    @PostMapping("/iniciarSesion")
    public ResponseEntity<Map<String, Object>> iniciarSesion(@Valid @RequestBody SolicitudRegistro request) {
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = authService.cargarUsuarioPorNombreUsuario(request.getUsername());
        String token = jwtService.generarToken(userDetails);

        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", Map.of("username", userDetails.getUsername())
        ));
    }
}
