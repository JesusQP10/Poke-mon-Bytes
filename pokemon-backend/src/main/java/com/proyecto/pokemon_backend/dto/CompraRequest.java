package com.proyecto.pokemon_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CompraRequest {
    private Integer itemId; // Que se quiere comprar
    private Integer cantidad; // Cuantos quiere
}
