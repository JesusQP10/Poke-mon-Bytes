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

    /**
     * Emite un JWT firmado con el subject = nombre de usuario y caducidad de 24 horas.
     */
    public String generarToken(UserDetails userDetails) {
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + EXPIRACION_MS))
            .signWith(claveFirma())
            .compact();
    }

    /** Lee el claim {@code sub} del token (nombre de usuario). */
    public String extraerNombreUsuario(String token) {
        return extraerClaim(token, Claims::getSubject);
    }

    /** Coincide el subject con el usuario cargado y comprueba que el token no haya expirado. */
    public boolean esTokenValido(String token, UserDetails userDetails) {
        String username = extraerNombreUsuario(token);
        return username.equals(userDetails.getUsername()) && !estaExpirado(token);
    }

    /** Compara la fecha de expiración del token con el reloj del servidor. */
    private boolean estaExpirado(String token) {
        return extraerClaim(token, Claims::getExpiration).before(new Date());
    }

    /** Parsea y verifica la firma del token, luego aplica el extractor al payload. */
    private <T> T extraerClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
            .verifyWith(claveFirma())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return resolver.apply(claims);
    }

    /** Construye la clave simétrica a partir de {@code jwt.secret.key}. */
    private SecretKey claveFirma() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }
}
