package com.proyecto.pokemon_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Intento de captura: el salvaje se identifica por {@code defensorId}; la Ball por nombre (catálogo ITEMS).
 */
@Data
@NoArgsConstructor
public class SolicitudCaptura {

    @NotNull(message = "defensorId es obligatorio.")
    private Long defensorId;

    @NotBlank(message = "nombreBall es obligatorio.")
    private String nombreBall;
}
