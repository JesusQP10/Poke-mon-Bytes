package com.proyecto.pokemon_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor

public class CapturaRequest {
    private Long defensorId; // Pokémon salvaje que queremos capturar
    private String nombreBall; // Pokeball que se usará (pokeball, superball, ultraball...)
}
