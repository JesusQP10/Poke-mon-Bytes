package com.proyecto.pokemon_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class SolicitudCaptura {

    @NotNull(message = "defensorId es obligatorio.")
    private Long defensorId;

    @NotBlank(message = "nombreBall es obligatorio.")
    private String nombreBall;
}
