package com.proyecto.pokemon_backend.service.logica;

import org.springframework.stereotype.Service;

import com.proyecto.pokemon_backend.model.enums.Estado;

import java.util.concurrent.ThreadLocalRandom; // Para Aleatoriedad

/**
 * Servicio que contiene todas las fórmulas matemáticas necesarias
 * para simular el combate (Daño, Experiencia, Precisión).
 */
@Service
public class CalculoService {

    // ------------------------------------------------------------------
    // 1. FÓRMULA DE DAÑO (Generación II/III)
    // ------------------------------------------------------------------

    /**
    * Calcula el daño final infligido por el atacante.
    * Basado en la fórmula: Daño = B*E*V*(((0.2 * N +1) * A * P)/ ( D * 25) +2))
    * N = Nivel del Pokémon que ataca.
    * A = Cantidad de ataque o ataque especial del Pokémon. Si el ataque que utiliza el Pokémon es físico se toma la cantidad de ataque y si es especial se toma la cantidad de ataque especial.
    * P = Poder del ataque, el potencial del ataque.
    * D = Cantidad de defensa del Pokémon RIVAL. Si el ataque que hemos utilizado es físico cogeremos la cantidad de defensa del Pokémon rival, si el ataque que hemos utilizado es especial, se coge la cantidad de defensa especial del Pokémon rival.
    * B = Bonificación. Si el ataque es del mismo tipo que el Pokémon que lo lanza toma un valor de 1.5 (stab), si el ataque es de un tipo diferente al del Pokémon que lo lanza toma un valor de 1.
    * E = Efectividad. Puede tomar los valores de 0, 0.25, 0.5, 1, 2 y 4.
    * V = Variación. Es una variable que comprende todos los valores discretos entre 85 y 100 (ambos incluidos).
     */
    public int calcularDaño(int nivelAtacante, int ataqueStat, int defensaStat, 
                            int potenciaMovimiento, double multiplicadorTipo, 
                            boolean esMismoTipo, Estado estadoAtacante, boolean esFisico) {
        // Inmunidad de tipo: daño 0 exacto.
        if (multiplicadorTipo <= 0) {
            return 0;
        }

        // Validación de división por cero
        if (defensaStat <= 0) {
            return 1;
        }
        
        // Constante (0.2 * N + 1) = nivelFactor
        double nivelFactor = 0.2 * nivelAtacante + 1.0;

        // -- Quemadura II GEN --
        // Si está quemado y usa un ataque físico, el ataque efectivo se reduce a la mitad.
        double ataqueEfectivo = ataqueStat;
        if (estadoAtacante == Estado.QUEMADO && esFisico) {
            ataqueEfectivo = ataqueStat / 2.0;
        }
        
        // Base del daño
        // Numerador = nivelFactor * A * P
        double damageNumerator = nivelFactor * ataqueEfectivo * potenciaMovimiento;
        //Denominador = (D + 25)
        double damageDenominador = defensaStat * 25.0;

        // Daño Base
        double damageBase = (damageNumerator / damageDenominador) + 2.0;

        // Multipicadores B y E
        double bonificacionB = esMismoTipo ? 1.5 : 1.0; // STAB
        double efectividadE = multiplicadorTipo;       // Tipo
        
        // V: variación aleatoria entre 85 y 100
        double variacionV = ThreadLocalRandom.current().nextDouble(0.85, 1.0);

        // Factor final (Multiplicadores combinados + Constante 0.01))
        double modifierFinal =  bonificacionB * efectividadE * variacionV;
        
        // Daño final
        double damageFinal = damageBase * modifierFinal;

        // Retorno (Daño mímimo asegurado en 1)
        return Math.max(1, (int) Math.floor(damageFinal));
    }

    // Alias en ASCII para evitar identificadores con acento en llamadas nuevas.
    public int calcularDanio(int nivelAtacante, int ataqueStat, int defensaStat,
                             int potenciaMovimiento, double multiplicadorTipo,
                             boolean esMismoTipo, Estado estadoAtacante, boolean esFisico) {
        return calcularDaño(
            nivelAtacante,
            ataqueStat,
            defensaStat,
            potenciaMovimiento,
            multiplicadorTipo,
            esMismoTipo,
            estadoAtacante,
            esFisico
        );
    }

    // ------------------------------------------------------------------
    // 2. LÓGICA DE ESTADO Y PRECISIÓN
    // ------------------------------------------------------------------

    /**
     * Determina si un movimiento (de daño o estado) impacta al objetivo.
     * @param precisionBase Precisión base del movimiento (0-100).
     * @return true si el ataque impacta.
     */
    public boolean verificaImpacto(int precisionBase) {
        if (precisionBase >= 100) {
            return true;
        }
        // Genera un número aleatorio entre 1 y 100.
        int hitChance = ThreadLocalRandom.current().nextInt(1, 101);
        
        return hitChance <= precisionBase;
    }

    /**
     * Determina si el ataque es un Golpe Crítico (Probabilidad base 6.25%).
     * @return true si el golpe es crítico (multiplicador x2.0).
     */
    public boolean fueGolpeCritico() {
         double probabilidadCritico = 0.0625; 
         return ThreadLocalRandom.current().nextDouble() < probabilidadCritico;
    }
    
    // ------------------------------------------------------------------
    // 3. CÁLCULO DE EXPERIENCIA (XP)
    // ------------------------------------------------------------------

    /**
     * Calcula la cantidad de experiencia ganada.
     */
    public int calcularExperiencia(int nivelDerrotado, int xpBase) {
        // Fórmula de XP simplificada: XP base * Nivel / 7
        return (int) Math.floor(xpBase * nivelDerrotado / 7.0); 
    }

    // ------------------------------------------------------------------
    // 4. Lógica de Captura (II GEN)
    // ------------------------------------------------------------------

    /**
     * Calcula si una Pokeball captura al Pokémon
     * @param hpMax HP Máximo del objetivo
     * @param hpActual HP Actual del objetivo
     * @param captureRatio Ratio de captura de la especie (0-255)[255 -> fácil de capturar, valores más bajos aumenta la dificultad de captura]
     *  La captura de un Pokémon se realiza mediante una comparación de dos valores, ay b, donde:
     *      - a > b -> la bola se agita una vez ( 4 Veces -> CAPTURA)
     *      - a < b -> No se captura
     *  -Fórmula valor a= (((3* HP max -2* HP actual )* rate * ball) /(3 * HP max)) * estado
     *     - HP max = Número de puntos de salud totales del Pokémon.
           - HP actual = Número de puntos de salud que tiene en ese momento.
           - Rate = Ratio de captura del Pokémon (ver lista de Pokémon según ratio de captura).
           - ball = Ratio de la Poké Ball.
           - e = Bono extra que se agrega cuando el Pokémon posee un problema de estado: 
                - dormido: 2
                - congelado: 2
                - paralizado: 1.5
                - quemado: 1.5
                - envenenado: 1.5
                - sin problemas de estado: 1.
        - Fórmula valor b :
            - Si a es menor que 255, el juego necesita determinar si la Poké Ball se agita y si finalmente atrapa al Pokémon.
            - Para ello calcula b. El valor b es un número de 16-bits (0 a 65535) que actúa como un umbral para cuatro comprobaciones aleatorias. La fórmula se aproxima a la raíz cuarta de a.
            - Para simplificar el código, debido a la dificultad, se generará mediante Math.random un nº aleatorio entre [0,255]
           Fuente:https://www.wikidex.net/wiki/Captura_de_Pok%C3%A9mon
        
     * @param bonoBall Multiplicador de la pokeball:
           - Pokeball 1.0
           - Superball 1.5
           - Ultraball 2.0
     * @param estado Estado del objetivo (dormido, paralizado,...)
     * @return true si se captura, false si se escapa
     */

    public boolean calcularCaptura(int hpMax, int hpActual, int captureRate, double bonoBall, Estado estado){
        // I. Valor a
        double numerador = (3 * hpMax - 2.0 * hpActual) * captureRate * bonoBall;
        double denominador = 3.0 *hpMax;
        double a = numerador / denominador;

        // II. Bono de estado
        if(estado == Estado.DORMIDO || estado == Estado.CONGELADO){
            a *= 2.0 ; // x2
        }else if (estado == Estado.PARALIZADO || estado == Estado.QUEMADO || estado == Estado.ENVENENADO){
            a *= 1.5 ; // x1.5
        }

        // III. Comprobar 'a'>= 255, captura asegurada
        if(a >= 255){
            return true;
        }

        // IV. Probabilidad aleatoria 'b'
        int random = ThreadLocalRandom.current().nextInt(0, 256);
        return random < a;

    }

}

