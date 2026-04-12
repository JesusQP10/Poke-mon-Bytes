package com.proyecto.pokemon_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cuerpo del POST de login. Sin mínimo de longitud en la contraseña: cualquier intento
 * debe llegar a la autenticación y responder con credenciales inválidas, no con
 * reglas de registro ({@link SolicitudRegistro}).
 */
@Data
@NoArgsConstructor
public class SolicitudInicioSesion {

    @NotBlank(message = "El nombre de usuario es obligatorio.")
    @Size(max = 30, message = "El nombre de usuario no puede superar 30 caracteres.")
    private String username;

    @NotBlank(message = "La contraseña es obligatoria.")
    @Size(max = 200, message = "La contraseña no puede superar 200 caracteres.")
    private String password;
}
