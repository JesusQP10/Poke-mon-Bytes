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

    /** Daño aplicado al defensor en este turno (0 si falló, bloqueó o no hubo daño directo). */
    private Integer danoInfligido;
    /** PS del atacante tras resolver el turno (residual, confusión, etc.). */
    private Integer hpRestanteAtacante;
    /** PS del defensor tras el golpe y efectos residuales del turno. */
    private Integer hpRestanteDefensor;
    /** Producto efectividad × crítico (si aplica); el cliente puede mostrar el multiplicador efectivo. */
    private double multiplicadorFinal;
    private boolean golpeCritico;
    private String mensajeEfectividad;
    /** Texto concatenado con el resumen del turno (movimiento, PP, residuales). */
    private String mensajeGeneral;
    private boolean defensorDerrotado;
    /** Estado del atacante tras el turno (nombre enum en minúsculas, p. ej. "quemado"). */
    private String estadoAtacante;
    /** Estado del defensor tras el turno. */
    private String estadoDefensor;
}
