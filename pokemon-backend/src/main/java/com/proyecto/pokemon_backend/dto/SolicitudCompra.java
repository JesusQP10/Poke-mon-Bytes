package com.proyecto.pokemon_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO (Data Transfer Object) para la Operación de Compra.
 * * Actúa como contrato de entrada para el endpoint 'POST /api/v1/tienda/comprar'.
 * * Su función es mapear el cuerpo del JSON enviado por el cliente (Frontend)
 * a un objeto Java que el 'TiendaService' pueda procesar.
 */

@Data
@NoArgsConstructor // Requisito: La librería Jackson necesita un constructor vacío para deserializar el JSON.
public class SolicitudCompra {

    /**
     * Identificador único del ítem en el catálogo.
     * Referencia al campo 'id_item' de la tabla ITEMS.
     * El servidor usará este dato para buscar el precio y verificar que el objeto existe.
     */
    private Integer itemId; 

    /**
     * Cantidad de unidades que el usuario desea adquirir.
     * * Dato crítico para la lógica de negocio:
     * 1. Se usa para calcular el Coste Total (Precio x Cantidad).
     * 2. Se suma al stock actual en la tabla INVENTARIO_USUARIO.
     */

    private Integer cantidad; 
}

