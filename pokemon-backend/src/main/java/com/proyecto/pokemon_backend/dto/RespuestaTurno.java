package com.proyecto.pokemon_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Resultado de un turno de combate devuelto al cliente. */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RespuestaTurno {

    private Integer danoInfligido;
    /** PS del atacante tras resolver el turno (residual, confusión, etc.). */
    private Integer hpRestanteAtacante;
    private Integer hpRestanteDefensor;
    private double multiplicadorFinal;
    private boolean golpeCritico;
    private String mensajeEfectividad;
    private String mensajeGeneral;
    private boolean defensorDerrotado;
}
