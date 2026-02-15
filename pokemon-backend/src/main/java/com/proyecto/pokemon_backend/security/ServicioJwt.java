package com.proyecto.pokemon_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Servicio de Utilidad para JSON Web Tokens (JWT).
 * Se encarga de toda la lógica criptográfica: generar, firmar, decodificar y validar tokens.
 * Este servicio permite que la aplicación sea STATELESS: no guardamos sesiones en memoria,
 * confiamos en la firma digital del token.
 */

@Service
public class ServicioJwt {

    // Inyectamos la clave secreta desde application.properties
    @Value("${jwt.secret.key}")
    private String secretKey;
    
    // Duración del token: 24 horas.
    // Si el usuario no se loguea en un día, tendrá que volver a hacerlo.
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24; 

    // --- Métodos de Generación del Token ---

    /**
     * Genera un token nuevo para un usuario autenticado.
     * @param userDetails Los datos del usuario (username, roles...).
     * @return String La cadena JWT completa (Header.Payload.Signature).
     */

    public String generarToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return crearToken(claims, userDetails.getUsername());
    }

    /**
     * Construye el JWT paso a paso.
     * 1. Claims: Datos del payload.
     * 2. Subject: El propietario del token (username).
     * 3. IssuedAt: Fecha de creación (ahora).
     * 4. Expiration: Fecha de caducidad (ahora + 24h).
     * 5. SignWith: Firma digital usando HMAC-SHA con nuestra clave secreta.
     */
    private String crearToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) 
                .signWith(obtenerClaveFirma())
                .compact();
    }

    // Devuelvo este dato para reutilizarlo en otras partes.
    private Key obtenerClaveFirma() {
        // Usa getBytes() para resolver el error 500 y de codificación
        return Keys.hmacShaKeyFor(secretKey.getBytes()); 
    }
    
    // --- Métodos de Validación y Extracción del Token ---

    /**
     * Extrae el nombre de usuario (Subject) oculto en el token.
     */
    public String extraerNombreUsuario(String token) {
        return extraerReclamacion(token, Claims::getSubject);
    }

    /**
     * Método genérico para extraer cualquier dato del Payload.
     * Utiliza programación funcional (Function resolver) para flexibilidad.
     */

    public <T> T extraerReclamacion(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extraerTodasReclamaciones(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * MÉTODO : Parsea el token para leer su contenido.
     */
    private Claims extraerTodasReclamaciones(String token) {
    // Usamos el patrón moderno para parsear
    return Jwts.parser()
            .setSigningKey(obtenerClaveFirma())
            
            .build() 
            // Usamos parseSignedClaims() que sustituye al obsoleto parseClaimsJws()
            .parseSignedClaims(token)
            .getPayload(); // Usar getPayload() 
}

    // Primero valido una condicion antes de continuar.
    public Boolean esTokenValido(String token, UserDetails userDetails) {
        final String username = extraerNombreUsuario(token);
        return (username.equals(userDetails.getUsername())) && !esTokenExpirado(token);
    }

    // Controla autenticación y seguridad.
    private boolean esTokenExpirado(String token) {
        return extraerReclamacion(token, Claims::getExpiration).before(new Date());
    }
}

