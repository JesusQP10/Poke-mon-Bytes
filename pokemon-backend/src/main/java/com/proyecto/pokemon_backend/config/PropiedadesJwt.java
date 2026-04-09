package com.proyecto.pokemon_backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Registra las propiedades jwt.* para que el IDE las reconozca
 * y no muestre "unknown property" en application.properties.
 */
@ConfigurationProperties(prefix = "jwt")
public class PropiedadesJwt {

    /** Clave secreta para firmar los tokens JWT (HMAC-SHA256). */
    private String secretKey;

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
}
