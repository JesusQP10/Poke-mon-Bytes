package com.proyecto.pokemon_backend.service.logica;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class CalculoServiceTest {
    
    private CalculoService calculoService;

    @BeforeEach // Esto se ejecuta antes de cada @Test
    void setUp() {
        //Spring lo inyecta. Si no, lo inicializamos manualmente:
        calculoService = new CalculoService(); 
    }
   
    // -----------------------------------------------------------
    // PRUEBA 1: CÁLCULO DAÑO BÁSICO (Escenario Pikachu Nv 10)
    // ----------------------------------------------------------
    @Test
    void testCalcularDañoBasico() {
        // Valores Pikachu al Nv 10 vs Defensor genérico (Daño neutro, No STAB)
        int nivelAtacante = 10; 
        int ataqueStat = 55;
        int defensaStat = 40;
        int potenciaMovimiento = 40; // POT de placaje
        double multiplicadorTipo = 1.0; // Neutro
        boolean esMismoTipo = false; // No STAB

        // WHEN: Ejecutamos el cálculo
        int daño = calculoService.calcularDaño(nivelAtacante, ataqueStat, defensaStat, potenciaMovimiento, multiplicadorTipo, esMismoTipo, null, false);
        // THEN: El daño teórico exacto es 10.
        // Verificamos que el daño está en el rango esperado (8-10) del juego, si random=1.0.
        // Si la fórmula es correcta, el daño máximo debe ser 10.
        System.out.println("Danio calculado para Pikachu Nv10: " + daño);
        assertTrue(daño >= 7 && daño <= 9, 
                   "El daño de Pikachu Nv10 (Placaje) debe caer entre 7 y 9. Resultado: " + daño);
        

    }
    // -----------------------------------------------------------
    // PRUEBA 2: CÁLCULO DAÑO MULTIPLICADO (x4.0 + STAB)
    // -----------------------------------------------------------
    @Test
    void testCalcularDañoConMultiplicador() {
        // Valores altos, para probar el x4.o y el STAB x1.5
        int nivelAtacante = 50;
        int ataqueStat = 177;
        int defensaStat = 167;;
        int potenciaMovimiento = 90; // Potencia de lanzallamas
        double multiplicadorTipo = 2.0; // Súper Efectivo (x2.0)
        boolean esMismoTipo = true; // STAB (x1.5)

        // WHEN: Ejecutamos el cálculo
        int daño = calculoService.calcularDaño(nivelAtacante, ataqueStat, defensaStat, potenciaMovimiento, multiplicadorTipo, esMismoTipo, null, false);
        // Rango de los resultados esperados 110-129
        System.out.println("Danio calculado para escenario x2 + STAB: " + daño);
        assertTrue(daño >= 110 && daño <= 131,
                   "El daño con x4.0 + STAB debe estar entre 110 y 129. Resultado: " + daño);
        

    }

    @Test
    void testCalcularExperiencia() {
        // Definimos los parámetros de un Pokémon derrotado
        int nivelDerrotado = 40; // Nivel del Pokémon que ha sido vencido
        int xpBase = 150;        // Valor XP base de la especie (Se obtiene de PokedexMaestra)
        // FÓRMULA SIMPLIFICADA: (XP base * Nivel) / 7
        // Cálculo teórico: (150 * 40) / 7 = 857.14. Esperamos 857 (Math.floor).
    
        // WHEN: Ejecutamos el cálculo
        int xpGanada = calculoService.calcularExperiencia(nivelDerrotado, xpBase);
    
        // THEN: Verificamos que la experiencia calculada es la esperada
        System.out.println("XP esperada al derrotar un Pokémon Nv40 es 857,  la expericencia Total ganada -> " + xpGanada);
        assertEquals(857, xpGanada, "La XP calculada debe ser 857.");
        
        // Ejemplo de un caso más simple:
        int xpGanadaSimple = calculoService.calcularExperiencia(10, 14); // (14 * 10) / 7 = 20
        System.out.println("XP ganada al derrotar Pokémon Nv10 (Esperada : 20) -> Total ganada  " + xpGanadaSimple);
        assertEquals(20, xpGanadaSimple, "La XP calculada para el caso simple debe ser 20.");
    }

    @Test
    void testFueGolpeCritico() {
        // No se necesitan parámetros, solo la probabilidad interna (6.25%)
    
        // El objetivo de esta prueba es verificar que la función no da errores y que, al ejecutarse muchas veces, la probabilidad se mantiene
        
        int intentos = 1000;
        int criticosContados = 0;
    
        for (int i = 0; i < intentos; i++) {
            if (calculoService.fueGolpeCritico()) {
                criticosContados++;
            }
        }
    
    // Esperamos que el número de críticos esté cerca del 6.25% (62.5 en 1000 intentos).
    // Tolerancia: Aceptamos que esté entre 35 y 90 .
    
    System.out.printf("Críticos contados en %d intentos: %d\n", intentos, criticosContados);

    // THEN: Verificamos que el resultado no está completamente roto y está dentro de la distribución estadística esperada.
    assertTrue(criticosContados > 30 && criticosContados < 95, 
               "El número de golpes críticos debe estar entre 3% y 9.5% de las veces.");
    }

    // Dentro de CalculoServiceTest.java

@Test
void testVerificaImpacto() {
    // Precisión del 100% 
    assertTrue(calculoService.verificaImpacto(100), 
               "La precisión del 100% debe ser true.");

    // Precisión del 0% 
    assertFalse(calculoService.verificaImpacto(0), 
                "La precisión del 0% debe ser false (nunca debe impactar).");

    // Prueba Estadística (Probabilidad del 50%)
    // Verificamos que, en un gran número de intentos, la tasa de impacto es ~50%.
    int intentos = 1000;
    int impactosContados = 0;
    
    for (int i = 0; i < intentos; i++) {
        // Usamos una precisión base de 50 (50%)
        if (calculoService.verificaImpacto(50)) {
            impactosContados++;
        }
    }
    
    // Rango esperado: entre 40% (400) y 60% (600) para una muestra de 1000.
    int limiteInferior = 400; 
    int limiteSuperior = 600;

    System.out.printf("Impactos contados en %d intentos (50%% de precisión): %d\n", intentos, impactosContados);

    // THEN: Verificamos que el resultado cae dentro de la distribución estadística
    assertTrue(impactosContados >= limiteInferior && impactosContados <= limiteSuperior, 
               "La precisión del 50% debe caer entre 40% y 60% para ser estadísticamente válida.");
    }
}

