package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.SolicitudInicioSesion;
import com.proyecto.pokemon_backend.dto.SolicitudRegistro;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.security.ServicioJwt;
import com.proyecto.pokemon_backend.service.ServicioAutenticacion;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Registro, login y emisión del JWT (rutas sin prefijo {@code /api/v1}). */
@RestController
@RequestMapping("/auth")
public class ControladorAutenticacion {

    private final ServicioJwt jwtService;
    private final ServicioAutenticacion authService;

    public ControladorAutenticacion(ServicioJwt jwtService, ServicioAutenticacion authService) {
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
     * Autentica con mensajes distintos si el usuario no existe o la contraseña no coincide.
     * DTO {@link SolicitudInicioSesion} evita reglas de registro (p. ej. mínimo 6 en password) en este endpoint.
     */
    @PostMapping("/iniciarSesion")
    public ResponseEntity<Map<String, Object>> iniciarSesion(@Valid @RequestBody SolicitudInicioSesion request) {
        UserDetails userDetails = authService.autenticarParaLogin(
            request.getUsername().trim(),
            request.getPassword()
        );
        String token = jwtService.generarToken(userDetails);

        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", Map.of("username", userDetails.getUsername())
        ));
    }
}
