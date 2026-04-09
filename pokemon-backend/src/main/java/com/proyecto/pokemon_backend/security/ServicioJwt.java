package com.proyecto.pokemon_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

/**
 * Servicio de utilidad para JSON Web Tokens.
 *
 * Genera, firma y valida tokens JWT usando HMAC-SHA256.
 * La API es stateless: no se guardan sesiones en servidor,
 * la identidad del usuario viaja firmada en cada request.
 */
@Service
public class ServicioJwt {

    private static final long EXPIRACION_MS = 1000L * 60 * 60 * 24; // 24 horas

    @Value("${jwt.secret.key}")
    private String secretKey;

    public String generarToken(UserDetails userDetails) {
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + EXPIRACION_MS))
            .signWith(claveFirma())
            .compact();
    }

    public String extraerNombreUsuario(String token) {
        return extraerClaim(token, Claims::getSubject);
    }

    public boolean esTokenValido(String token, UserDetails userDetails) {
        String username = extraerNombreUsuario(token);
        return username.equals(userDetails.getUsername()) && !estaExpirado(token);
    }

    private boolean estaExpirado(String token) {
        return extraerClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extraerClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
            .verifyWith(claveFirma())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return resolver.apply(claims);
    }

    private SecretKey claveFirma() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }
}
