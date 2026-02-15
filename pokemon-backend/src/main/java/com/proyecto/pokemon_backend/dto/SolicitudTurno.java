package com.proyecto.pokemon_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO (Data Transfer Object) para la solicitud de un Turno de Combate.
 * * Actúa como contrato de entrada para el endpoint 'POST /api/v1/batalla/turno'.
 * * Su responsabilidad es encapsular todos los parámetros variables necesarios
 * para que el 'CalculoService' pueda aplicar la fórmula de daño de la Gen II.
 */

@Data
@NoArgsConstructor
public class SolicitudTurno {

    // --- Identificadores de Persistencia (Instancias de POKEMON_USUARIO)---
    // Serán usados por BatallaService para cargar el estado dinámico( Nivel, HP,...) de la Base de Datos
    private Long atacanteId;
    private Long defensorId;
    private Long movimientoId;

    // --- Parámetros de la Fórmula de Daño ---

    // Nivel del Pokémon Atacante
    private Integer nivelAtacante;
    // Potencia del Movimiento usado por el Atacante
    private Integer potenciaMovimiento;
    // Tipo de ataque
    private String tipoAtaque;
    // --- STATS Físicas/Especiales ---
    private Integer ataqueStat; // Ataque o Ataque Especial del Atacante
    private Integer defensaStat; // Defensa o Defensa Especial del Defensor

    // --- Modificadores ---
    private Boolean esEspecial;
    private Boolean esMismoTipo;

    
}

