package com.proyecto.pokemon_backend.controller;

import com.proyecto.pokemon_backend.dto.RegistroRequest;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.security.JwtService; 
import com.proyecto.pokemon_backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager; // CRÍTICO
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para la Gestión de Identidad (Autenticación y Registro).
 * * Expone los endpoints públicos que permiten a los usuarios obtener sus credenciales (Token JWT).
 * * Arquitectura:
 * Cliente (JSON) -> AuthController -> AuthenticationManager -> AuthService -> JWTService
 */

@RestController
// URL base de la clase: /api/v1/auth
@RequestMapping("/api/v1/auth") 
public class AuthController {

    // --- DEPENDENCIAS CLAVE ---
    
    /**
     * Componente central de Spring Security.
     * Es el encargado demanejar la verificación de usuario/contraseña.
     * Delega internamente en nuestro 'CustomUserDetailsService' y 'PasswordEncoder'.
     */
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService; 
    private final AuthService authService; 

    // Constructor con Inyección de Dependencias
    public AuthController(JwtService jwtService, AuthService authService, AuthenticationManager authenticationManager) {
        this.jwtService = jwtService;
        this.authService = authService;
        this.authenticationManager = authenticationManager; 
    }

    // -------------------------------------------------------------------------
    // ENDPOINT DE REGISTRO
    // -------------------------------------------------------------------------

    /**
     * Crea una nueva cuenta de usuario en el sistema.
     * Endpoint: POST /api/v1/auth/register
     * @param registroRequest DTO con username y password en texto plano.
     * @return ResponseEntity indicando éxito (201 Created) o fallo (409 Conflict).
     */

    @PostMapping("/register") // Mapea el método POST a la ruta /register
    public ResponseEntity<?> registerUser(@RequestBody RegistroRequest registroRequest) {
        try {
            Usuario nuevoUsuario = new Usuario();
            nuevoUsuario.setUsername(registroRequest.getUsername());
            nuevoUsuario.setPasswordHash(registroRequest.getPassword()); 

            Usuario usuarioGuardado = authService.registerNewUser(nuevoUsuario);
            
            // Éxito: Código 201 CREATED
            return new ResponseEntity<>("Usuario registrado con éxito: " + usuarioGuardado.getUsername(), HttpStatus.CREATED);
            
        } catch (RuntimeException e) {
            // Error de lógica: 409 CONFLICT
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }
    }

    // -------------------------------------------------------------------------
    // ENDPOINT DE LOGIN
    // -------------------------------------------------------------------------

    /**
     * Autentica al usuario y genera un Token JWT.
     * Endpoint: POST /api/v1/auth/login
     * * Flujo:
     * 1. Recibe credenciales.
     * 2. Intenta autenticar con Spring Security.
     * 3. Si tiene éxito, genera el Token firmado.
     * @param loginRequest DTO con username y password.
     * @return El Token JWT en formato String (200 OK) o error (401 Unauthorized).
     */
    @PostMapping("/login")
    public ResponseEntity<String> authenticateAndGetToken(
        @RequestBody RegistroRequest loginRequest // Parámetros del cuerpo de la petición
    ) {

        try {
        // 1. Verificación de credenciales: Usamos el campo de clase 'this.authenticationManager' inyectado
        Authentication authentication = this.authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        // 2. Si la autenticación es exitosa (no hay excepción), cargamos los detalles y generamos el Token
        UserDetails userDetails = authService.loadUserByUsername(loginRequest.getUsername());
        String token = jwtService.generateToken(userDetails);
        
        // 3. Devolvemos el Token al cliente (200 OK)
        return ResponseEntity.ok(token);

    } catch (Exception e) {
        // 4. Capturamos la excepción de credenciales fallidas (401 Unauthorized)
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales inválidas o usuario no encontrado.");
    }
}
}
