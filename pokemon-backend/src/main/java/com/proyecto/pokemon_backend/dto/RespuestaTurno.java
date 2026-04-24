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
    /** Estado del atacante tras el turno */
    private String estadoAtacante;
    /** Estado del defensor tras el turno. */
    private String estadoDefensor;

    /** XP ganada por el atacante este turno (0 si defensor no derrotado). */
    private Integer experienciaGanada;
    /** Nivel del atacante antes de aplicar la XP (null si no ganó XP). */
    private Integer nivelAnterior;
    /** Nivel del atacante después de aplicar la XP; igual a nivelAnterior si no subió (null si no ganó XP). */
    private Integer nuevoNivel;
    /** HP máximo del atacante después del turno (puede cambiar al subir de nivel). */
    private Integer hpMaxAtacante;
    /** XP acumulada del atacante después de aplicar la ganancia (para la barra de experiencia). */
    private Integer xpActual;
}
