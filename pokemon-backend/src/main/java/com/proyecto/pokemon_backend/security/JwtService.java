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
 * Utiliza la librería 'io.jsonwebtoken' (JJWT) en su versión moderna (0.12.x).
 * Este servicio permite que la aplicación sea STATELESS: no guardamos sesiones en memoria,
 * confiamos en la firma digital del token.
 */

@Service
public class JwtService {

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

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }


    /**
     * Construye el JWT paso a paso.
     * 1. Claims: Datos del payload.
     * 2. Subject: El propietario del token (username).
     * 3. IssuedAt: Fecha de creación (ahora).
     * 4. Expiration: Fecha de caducidad (ahora + 24h).
     * 5. SignWith: Firma digital usando HMAC-SHA con nuestra clave secreta.
     */
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) 
                .signWith(getSigningKey())
                .compact();
    }

    private Key getSigningKey() {
        // Usa getBytes() para resolver el error 500 y de codificación
        return Keys.hmacShaKeyFor(secretKey.getBytes()); 
    }
    
    // --- Métodos de Validación y Extracción del Token ---

    /**
     * Extrae el nombre de usuario (Subject) oculto en el token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Método genérico para extraer cualquier dato del Payload.
     * Utiliza programación funcional (Function resolver) para flexibilidad.
     */

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * MÉTODO : Parsea el token para leer su contenido.
     * NOTA : Implementa la sintaxis de JJWT 0.12.5+.
     * Las versiones antiguas usaban 'parser().setSigningKey().parseClaimsJws()'.
     * La nueva versión requiere el patrón Builder (.build()) y usa 'getPayload()' en lugar de 'getBody()'.
     * Esto verifica automáticamente la firma digital; si la firma no coincide, lanza una Excepción.
     */
    private Claims extractAllClaims(String token) {
    // Usamos el patrón moderno para parsear
    return Jwts.parser()
            .setSigningKey(getSigningKey())
            // El patrón Builder es CRÍTICO:
            .build() 
            // Usamos parseSignedClaims() que sustituye al obsoleto parseClaimsJws()
            .parseSignedClaims(token)
            .getPayload(); // Usar getPayload() en lugar de getBody() en esta versión
}

    public Boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}