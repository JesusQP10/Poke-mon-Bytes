package com.proyecto.pokemon_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class SolicitudRegistro {

    @NotBlank(message = "El nombre de usuario es obligatorio.")
    @Size(min = 3, max = 30, message = "El nombre de usuario debe tener entre 3 y 30 caracteres.")
    private String username;

    @NotBlank(message = "La contraseña es obligatoria.")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres.")
    private String password;
}
