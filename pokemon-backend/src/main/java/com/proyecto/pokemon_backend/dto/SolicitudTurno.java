package com.proyecto.pokemon_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Parámetros de entrada para un turno de combate.
 *
 * El servidor carga todos los stats desde la BD usando los IDs — el cliente
 * no envía stats ni multiplicadores para evitar manipulación.
 */
@Data
@NoArgsConstructor
public class SolicitudTurno {

    @NotNull(message = "atacanteId es obligatorio.")
    private Long atacanteId;

    @NotNull(message = "defensorId es obligatorio.")
    private Long defensorId;

    /**
     * ID del movimiento a usar (de la tabla ATAQUES).
     * Si es null, se usa el primer movimiento con PP disponible.
     */
    private Long movimientoId;

    // --- Campos legacy (compatibilidad con clientes anteriores) ---
    // Ignorados si movimientoId está presente.
    private String tipoAtaque;
    private Integer potenciaMovimiento;
    private Boolean esEspecial;
    private Boolean esMismoTipo;
}
