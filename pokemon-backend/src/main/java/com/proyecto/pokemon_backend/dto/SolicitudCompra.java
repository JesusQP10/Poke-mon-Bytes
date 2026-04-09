package com.proyecto.pokemon_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class SolicitudCompra {

    @NotNull(message = "itemId es obligatorio.")
    private Integer itemId;

    @NotNull(message = "cantidad es obligatoria.")
    @Min(value = 1, message = "La cantidad mínima es 1.")
    private Integer cantidad;
}
