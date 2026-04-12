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

    /** @return valor de {@code jwt.secret.key} */
    public String getSecretKey() { return secretKey; }
    /** @param secretKey clave en texto (debe ser suficientemente larga para HMAC-SHA256) */
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
}
