package com.proyecto.pokemon_backend.dto;

import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO (Data Transfer Object) que encapsula el resultado de un turno de batalla.
 * Es la información que el servidor devuelve al cliente (frontend).
 */

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RespuestaTurno {

    // --- Resultados del combate ---
    private Integer dañoInfligido;
    private Integer hpRestanteDefensor;
    private double multiplicadorFinal;

    // --- Flags y mensajes ---
    private boolean golpeCritico; // Bandera que el frontend usa para mostrar el mensaje "¡Golpe Crítico!"
    private String mensajeEfectividad; // Ej: "¡Es súper efectivo!" o "No es muy efectivo."
    private String mensajeGeneral; // Mensaje resumido del turno (Ej: "Pikachu usó Impactrueno y le hizo 30 de daño a Bulbasaur.") 
    private boolean defensorDerrotado; // True si el HP restante es 0
    
}

