package com.proyecto.pokemon_backend.dto;
import lombok.Data;

/**
 * DTO (Data Transfer Object) para la captura de credenciales.
 * * Mapea el cuerpo de las peticiones JSON enviadas a los endpoints de autenticación:
 * - POST /api/v1/auth/registrar
 * - POST /api/v1/auth/iniciarSesion
 * * Su función es encapsular los datos de entrada (raw data) antes de que sean
 * procesados por la lógica de negocio o convertidos a entidades JPA.
 */

@Data
public class SolicitudRegistro {

    /**
     * El nombre de usuario solicitado por el cliente.
     * En el servicio de registro, se verificará que no exista previamente.
     */

    private String username;

    /**
     * La contraseña en texto plano.
     * Este campo solo vive temporalmente en la memoria durante la petición.
     * Nunca se guarda en la base de datos tal cual. El 'ServicioAutenticacion' se encargará
     * de transformarlo en un Hash (BCrypt) inmediatamente.
     */

    private String password;
}

