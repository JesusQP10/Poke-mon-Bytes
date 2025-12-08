package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.model.Tipo;
import com.proyecto.pokemon_backend.repository.TipoRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Servicio dedicado a la lógica de consulta y cálculo de efectividad de Tipos.
 * Actúa como la interfaz de la Matriz de Tipos (Tabla TIPOS).
 */
@Service
public class TipoService {

    private final TipoRepository tipoRepository;

    public TipoService(TipoRepository tipoRepository) {
        this.tipoRepository = tipoRepository;
    }

    /**
     * Calcula el multiplicador de efectividad total (x0.0 a x4.0) de un ataque.
     * Consulta la matriz de tipos para el Tipo 1 y el Tipo 2 del defensor.
     * @param tipoAtaque Tipo del movimiento.
     * @param defensorTipo1 Tipo principal del Pokémon defensor.
     * @param defensorTipo2 Tipo secundario del Pokémon defensor (puede ser null).
     * @return Multiplicador final (p. ej., 4.0, 0.5, 0.0).
     */
    public double calcularEfectividad(String tipoAtaque, String defensorTipo1, String defensorTipo2) {
        
        // 1. Obtener multiplicador contra Tipo 1
        // Si no se encuentra una entrada en la BD, se asume 1.0x (Neutro)
        double mult1 = tipoRepository.findByAtacanteAndDefensor(tipoAtaque, defensorTipo1)
                                     .map(Tipo::getMultiplicador)
                                     .orElse(1.0); 
        
        // 2. Obtener multiplicador contra Tipo 2
        double mult2 = 1.0; 
        if (defensorTipo2 != null && !defensorTipo2.isEmpty()) {
             mult2 = tipoRepository.findByAtacanteAndDefensor(tipoAtaque, defensorTipo2)
                                     .map(Tipo::getMultiplicador)
                                     .orElse(1.0);
        }
        
        // 3. Multiplicación final: Aquí se logra el x4.0, x2.0, x0.5, x0.25 o x0.0.
        return mult1 * mult2;
    }
    
    /**
     * Genera el mensaje de efectividad para el Frontend basado en el multiplicador total.
     * Incluye todos los 6 niveles de efectividad de Pokémon (0.0x, 0.25x, 0.5x, 1.0x, 2.0x, 4.0x).
     * @param multiplicador El multiplicador total calculado.
     * @return String con el mensaje (Ej: "¡Es cuádruplemente efectivo!").
     */
    public String obtenerMensajeEfectividad(double multiplicador) {
        
        if (multiplicador == 0.0) {
            return "No tiene efecto.";
        } 
        
        if (multiplicador > 1.0) {
            // Casos de Súper Efectivo (x2.0 y x4.0)
            if (multiplicador >= 4.0) {
                return "¡Es súper efectivo x4!"; // x4.0
            } else if (multiplicador >= 2.0) {
                return "¡Es súper efectivo!"; // x2.0
            }
        } else if (multiplicador < 1.0) {
            // Casos de Resistencia (x0.5 y x0.25)
            if (multiplicador <= 0.25) { 
                return "No es muy, muy efectivo."; // x0.25
            } else if (multiplicador < 1.0) { 
                return "No es muy efectivo."; // x0.5
            }
        }
        
        return ""; // Caso por defecto: Neutro (1.0x) - Sin mensaje en el juego
    }
}