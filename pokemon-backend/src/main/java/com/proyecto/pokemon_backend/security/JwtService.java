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

@Service
public class JwtService {

    // Inyectamos la clave secreta desde application.properties
    @Value("${jwt.secret.key}")
    private String secretKey;
    
    // Duración del token: 24 horas (en milisegundos)
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24; 

    // --- Métodos de Generación del Token ---

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }

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

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    // Método CRÍTICO: Usa parserBuilder() (requiere JWT 0.12.5)
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