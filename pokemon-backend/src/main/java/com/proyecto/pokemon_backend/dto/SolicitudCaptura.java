package com.proyecto.pokemon_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO (Data Transfer Object) para la solicitud de Captura.
 * * Actúa como un contrato de entrada para el endpoint 'POST /api/v1/batalla/captura'.
 * * Su función es deserializar el JSON enviado por el cliente 
 * que contiene la intención del jugador de gastar una Pokéball contra un objetivo.
 */

@Data
@NoArgsConstructor

public class SolicitudCaptura {

    /**
     * Identificador único (PK) de la instancia del Pokémon Salvaje en la base de datos.
     * NO CONFUNDIR con  ID de la Pokedex (Especie). 
     * Referencia a la tabla 'POKEMON_USUARIO' (donde id_usuario es null o sistema).
     */

    private Long defensorId; // Pokémon salvaje que queremos capturar

    /**
     * Nombre exacto del ítem a utilizar (ej: "Poke Ball", "Ultra Ball").
     * * El backend usará este String para:
     * 1. Verificar si el usuario tiene stock en su inventario (Tabla INVENTARIO_USUARIO).
     * 2. Determinar el multiplicador de captura (bonoBall) en la fórmula matemática.
     */
    
    private String nombreBall; // Pokeball que se usará (pokeball, superball, ultraball...)
}

