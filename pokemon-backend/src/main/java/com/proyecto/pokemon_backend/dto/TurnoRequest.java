package com.proyecto.pokemon_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la peticion POST /api/V1/batalla/turno
 * Contiene los parámetros necesarios para realizar un turno en la batalla.
 */

@Data
@NoArgsConstructor
public class TurnoRequest {

    // --- Identificadores de Persistencia (Instancias de POKEMON_USUARIO)---
    // Seran usador por BatallaService para cargar el estado dinamico( Nivel, HP,...) de la Base de Datos
    private Long atacanteId;
    private Long defensorId;
    private Long movimientoId;

    // --- Parámetros de la Formula de Daño ---

    // Nivel del Pokemon Atacante
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
