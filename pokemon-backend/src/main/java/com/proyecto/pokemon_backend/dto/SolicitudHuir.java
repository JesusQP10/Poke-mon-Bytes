package com.proyecto.pokemon_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Intento de huir de un combate salvaje (Gen II: velocidad e intentos). */
@Data
@NoArgsConstructor
public class SolicitudHuir {

    @NotNull(message = "jugadorPokemonId es obligatorio.")
    private Long jugadorPokemonId;

    @NotNull(message = "salvajePokemonId es obligatorio.")
    private Long salvajePokemonId;

    /** N.º de intento de huida (1 en el primero, 2 en el segundo…). */
    private Integer intento;
}
