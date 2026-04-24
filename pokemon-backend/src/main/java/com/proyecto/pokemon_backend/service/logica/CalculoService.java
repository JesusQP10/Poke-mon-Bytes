package com.proyecto.pokemon_backend.service.logica;

import com.proyecto.pokemon_backend.model.enums.Estado;
import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;

/**
 * Fórmulas matemáticas del motor de combate (Gen II).
 *
 * Todas las operaciones son puras (sin efectos secundarios) para facilitar
 * el testing unitario. La aleatoriedad se inyecta vía ThreadLocalRandom.
 */
@Service
public class CalculoService {

    /**
     * Fórmula de daño Gen II:
     *   Daño = ((0.2*N + 1) * A * P / (D * 25) + 2) * B * E * V
     *
     * N = Nivel del atacante
     * A = Stat de ataque (físico o especial, con penalización por quemadura)
     * P = Potencia del movimiento
     * D = Stat de defensa del defensor (física o especial)
     * B = STAB: 1.5 si el tipo del movimiento coincide con un tipo del atacante, 1.0 si no
     * E = Efectividad de tipo (0, 0.25, 0.5, 1, 2, 4)
     * V = Variación aleatoria [0.85, 1.0)
     */
    public int calcularDanio(
        int nivel,
        int ataqueStat,
        int defensaStat,
        int potencia,
        double efectividad,
        boolean stab,
        Estado estadoAtacante,
        boolean esFisico
    ) {
        if (efectividad <= 0) return 0;
        if (defensaStat <= 0) return 1;

        // Penalización por quemadura en ataques físicos (Gen II: ataque efectivo / 2)
        double ataqueEfectivo = (estadoAtacante == Estado.QUEMADO && esFisico)
            ? ataqueStat / 2.0
            : ataqueStat;

        double base = ((0.2 * nivel + 1.0) * ataqueEfectivo * potencia) / (defensaStat * 25.0) + 2.0;
        double bonusStab = stab ? 1.5 : 1.0;
        double variacion = ThreadLocalRandom.current().nextDouble(0.85, 1.0);

        return Math.max(1, (int) Math.floor(base * bonusStab * efectividad * variacion));
    }

    /**
     * Determina si un movimiento impacta según su precisión base.
     * Movimientos con precisión >= 100 nunca fallan por este cálculo.
     */
    public boolean verificaImpacto(int precisionBase) {
        if (precisionBase >= 100) return true;
        return ThreadLocalRandom.current().nextInt(1, 101) <= precisionBase;
    }

    /**
     * Golpe crítico con probabilidad base del 6.25% (Gen II).
     * Multiplica el daño por 2.0.
     */
    public boolean fueGolpeCritico() {
        return ThreadLocalRandom.current().nextDouble() < 0.0625;
    }

    /**
     * XP ganada al derrotar un Pokémon.
     * Fórmula simplificada: xpBase * nivelDerrotado / 7
     */
    public int calcularExperiencia(int nivelDerrotado, int xpBase) {
        return (int) Math.floor((double) xpBase * nivelDerrotado / 7.0);
    }

    /**
     * XP acumulada necesaria para subir DEL nivel actual AL siguiente.
     * Fórmula: nivel² × 5  (5→6: 125 XP, 10→11: 500 XP, 20→21: 2000 XP).
     */
    public int xpParaSiguienteNivel(int nivelActual) {
        return nivelActual * nivelActual * 5;
    }

    /**
     * Mecánica de captura Gen II.
     *
     * Valor a = ((3*HPmax - 2*HPactual) * rate * ball) / (3*HPmax) * bonusEstado
     * Si a >= 255 → captura garantizada.
     * Si no → se compara con un número aleatorio [0, 255).
     *
     * Bonus de estado: dormido/congelado x2, paralizado/quemado/envenenado x1.5.
     *
     * @param hpMax       HP máximo del Pokémon salvaje
     * @param hpActual    HP actual del Pokémon salvaje
     * @param captureRate Ratio de captura de la especie (0-255)
     * @param bonoBall    Multiplicador de la Poké Ball (1.0, 1.5, 2.0, 255.0)
     * @param estado      Estado alterado del Pokémon salvaje
     */
    public boolean calcularCaptura(int hpMax, int hpActual, int captureRate, double bonoBall, Estado estado) {
        double a = ((3.0 * hpMax - 2.0 * hpActual) * captureRate * bonoBall) / (3.0 * hpMax);

        if (estado == Estado.DORMIDO || estado == Estado.CONGELADO) {
            a *= 2.0;
        } else if (estado == Estado.PARALIZADO || estado == Estado.QUEMADO || estado == Estado.ENVENENADO) {
            a *= 1.5;
        }

        if (a >= 255) return true;

        return ThreadLocalRandom.current().nextInt(0, 256) < a;
    }
}
