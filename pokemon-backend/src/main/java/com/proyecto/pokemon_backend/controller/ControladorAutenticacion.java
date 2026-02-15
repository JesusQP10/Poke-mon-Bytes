package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.SolicitudRegistro;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.security.ServicioJwt;
import com.proyecto.pokemon_backend.service.ServicioAutenticacion;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class ControladorAutenticacion {

    private final AuthenticationManager gestorAutenticacion;
    private final ServicioJwt jwtService;
    private final ServicioAutenticacion servicioAutenticacion;

    // Esta parte controla autenticación y seguridad.
    public ControladorAutenticacion(ServicioJwt jwtService, ServicioAutenticacion servicioAutenticacion, AuthenticationManager gestorAutenticacion) {
        this.jwtService = jwtService;
        this.servicioAutenticacion = servicioAutenticacion;
        this.gestorAutenticacion = gestorAutenticacion;
    }

    @PostMapping("/registrar")
    // Este metodo se encarga de registrarUsuario.
    public ResponseEntity<?> registrarUsuario(@RequestBody SolicitudRegistro registroRequest) {
        try {
            Usuario nuevoUsuario = new Usuario();
            nuevoUsuario.setUsername(registroRequest.getUsername());
            nuevoUsuario.setPasswordHash(registroRequest.getPassword());

            Usuario usuarioGuardado = servicioAutenticacion.registrarUsuarioNuevo(nuevoUsuario);
            return new ResponseEntity<>("Usuario registrado con exito: " + usuarioGuardado.getUsername(), HttpStatus.CREATED);

        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }
    }

    @PostMapping("/iniciarSesion")
    // Esta parte controla autenticación y seguridad.
    public ResponseEntity<?> autenticarYObtenerToken(@RequestBody SolicitudRegistro loginRequest) {
        try {
            Authentication authentication = this.gestorAutenticacion.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            UserDetails userDetails = servicioAutenticacion.cargarUsuarioPorNombreUsuario(loginRequest.getUsername());
            String token = jwtService.generarToken(userDetails);

            Map<String, Object> body = Map.of(
                "token", token,
                "user", Map.of("username", userDetails.getUsername())
            );

            return ResponseEntity.ok(body);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Credenciales invalidas o usuario no encontrado."));
        }
    }
}

