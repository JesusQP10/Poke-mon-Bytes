package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Tipo;
import com.proyecto.pokemon_backend.repository.TipoRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Componente de Inicialización de la Matriz de Tipos (Type Chart Seeder).
 * * Responsabilidad:
 * Cargar en la base de datos las reglas de efectividad de la Generación II al arrancar el servidor.
 * Esto convierte la lógica de "Debilidades y Resistencias" en datos consultables por SQL.
 * * Implementa 'CommandLineRunner' para ejecutarse automáticamente tras el inicio del contexto Spring.
 */

@Component
public class TipoInitializer implements CommandLineRunner {

   
    private TipoRepository tipoRepository;

    public TipoInitializer(TipoRepository tipoRepository) {
    this.tipoRepository = tipoRepository;
    }

    // 1. LISTA TIPOS (17 tipos de Gen II)
    // Usamos un array estático para mapear índices numéricos a nombres de tipos.
    private static final String[] TIPO_NAMES = {
        "Normal", "Fuego", "Agua", "Planta", "Eléctrico", "Hielo", 
        "Lucha", "Veneno", "Tierra", "Volador", "Psíquico", 
        "Bicho", "Roca", "Fantasma", "Dragón", "Siniestro", 
        "Acero"
    };

    /**
     * Método principal de ejecución.
     * Verifica si la tabla TIPOS está vacía para evitar duplicados en reinicios.
     */

    @Override
    public void run(String... args) throws Exception {
        // Ejecutar la carga solo si la tabla está vacía
        if (tipoRepository != null && tipoRepository.count() == 0) { 
            System.out.println("--- INICIANDO CARGA DE MATRIZ DE TIPOS (FINAL) ---");
            loadTipoMatrix();
        }
    }

    /**
     * Define y persiste todas las relaciones de efectividad.
     * Sigue la tabla oficial de Pokémon Oro/Plata/Cristal.
     */
    private void loadTipoMatrix() {
        List<Tipo> tipos = new ArrayList<>();

        // 2. Definición de índices constantes para mejorar la legibilidad del código
        final int NORMAL = 0;
        final int FUEGO = 1;
        final int AGUA = 2;
        final int PLANTA = 3;
        final int ELECTRICO = 4;
        final int HIELO = 5;
        final int LUCHA = 6;
        final int VENENO = 7;
        final int TIERRA = 8;
        final int VOLADOR = 9;
        final int PSIQUICO = 10;
        final int BICHO = 11;
        final int ROCA = 12;
        final int FANTASMA = 13;
        final int DRAGON = 14;
        final int SINIESTRO = 15;
        final int ACERO = 16;
        
        // ------------------------------------------------------------------
        // Regla --- ATACANTE -> DEFENSOR : MULTIPLICADOR---
        // 1. INMUNIDADES (Daño x0.0)
        // Ejemplo: Los ataques Eléctricos no afectan a los Tierra.
        // ------------------------------------------------------------------
        addImmunity(tipos, ELECTRICO, TIERRA); 
        addImmunity(tipos, NORMAL, FANTASMA); 
        addImmunity(tipos, FANTASMA, NORMAL);  
        addImmunity(tipos, LUCHA, FANTASMA);    
        addImmunity(tipos, TIERRA, VOLADOR);    
        addImmunity(tipos, VENENO, ACERO);      
        addImmunity(tipos, PSIQUICO, SINIESTRO); 
        
        // ------------------------------------------------------------------
        // 2. DEBILIDADES (x2.0)
        // ------------------------------------------------------------------
        addDebility(tipos, FUEGO, PLANTA);
        addDebility(tipos, FUEGO, HIELO);
        addDebility(tipos, FUEGO, BICHO);
        addDebility(tipos, FUEGO, ACERO);
        addDebility(tipos, ACERO, HIELO);
        addDebility(tipos, ACERO, ROCA);
        addDebility(tipos, VOLADOR, PLANTA);
        addDebility(tipos, VOLADOR, LUCHA);
        addDebility(tipos, VOLADOR, BICHO);
        addDebility(tipos, AGUA, FUEGO);
        addDebility(tipos, AGUA, TIERRA);
        addDebility(tipos, AGUA, ROCA);
        addDebility(tipos, HIELO, PLANTA);
        addDebility(tipos, HIELO, TIERRA);
        addDebility(tipos, HIELO, VOLADOR);
        addDebility(tipos, HIELO, DRAGON);
        addDebility(tipos, PLANTA, AGUA);
        addDebility(tipos, PLANTA, TIERRA);
        addDebility(tipos, PLANTA, ROCA);
        addDebility(tipos, BICHO, PSIQUICO);
        addDebility(tipos, BICHO, PLANTA);
        addDebility(tipos, BICHO, SINIESTRO);
        addDebility(tipos, ELECTRICO, AGUA);
        addDebility(tipos, ELECTRICO, VOLADOR);
        addDebility(tipos, ROCA, FUEGO);
        addDebility(tipos, ROCA, HIELO);
        addDebility(tipos, ROCA, VOLADOR);
        addDebility(tipos, ROCA, BICHO);
        addDebility(tipos, TIERRA, FUEGO);
        addDebility(tipos, TIERRA, ELECTRICO);
        addDebility(tipos, TIERRA, VENENO);
        addDebility(tipos, TIERRA, ROCA);
        addDebility(tipos, TIERRA, ACERO);
        addDebility(tipos, LUCHA, NORMAL);
        addDebility(tipos, LUCHA, HIELO);
        addDebility(tipos, LUCHA, ROCA);
        addDebility(tipos, LUCHA, SINIESTRO);
        addDebility(tipos, LUCHA, ACERO);
        addDebility(tipos, PSIQUICO, LUCHA);
        addDebility(tipos, PSIQUICO, VENENO);
        addDebility(tipos, VENENO, PLANTA);
        addDebility(tipos, DRAGON, DRAGON);
        addDebility(tipos, FANTASMA, PSIQUICO);
        addDebility(tipos, FANTASMA, FANTASMA);
        addDebility(tipos, SINIESTRO, PSIQUICO);
        addDebility(tipos, SINIESTRO, FANTASMA);


        
        // ------------------------------------------------------------------
        // 3. RESISTENCIAS (x0.5)
        // ------------------------------------------------------------------
        addResistance(tipos, VOLADOR, ACERO);
        addResistance(tipos, VOLADOR, ELECTRICO);
        addResistance(tipos, VOLADOR, ROCA);
        addResistance(tipos, ACERO, FUEGO);
        addResistance(tipos, ACERO, AGUA);
        addResistance(tipos, ACERO, ELECTRICO);
        addResistance(tipos, ACERO, ACERO);
        addResistance(tipos, AGUA, AGUA);
        addResistance(tipos, AGUA, PLANTA);
        addResistance(tipos, AGUA, DRAGON);
        addResistance(tipos, HIELO, HIELO);
        addResistance(tipos, HIELO, ACERO);
        addResistance(tipos, HIELO, FUEGO);
        addResistance(tipos, HIELO, AGUA);
        addResistance(tipos, PLANTA, FUEGO);
        addResistance(tipos, PLANTA, PLANTA);
        addResistance(tipos, PLANTA, VENENO);
        addResistance(tipos, PLANTA, VOLADOR);
        addResistance(tipos, PLANTA, BICHO);
        addResistance(tipos, PLANTA, DRAGON);
        addResistance(tipos, PLANTA, ACERO);
        addResistance(tipos, BICHO, FUEGO);
        addResistance(tipos, BICHO, LUCHA);
        addResistance(tipos, BICHO, VENENO);
        addResistance(tipos, BICHO, VOLADOR);
        addResistance(tipos, BICHO, ACERO);
        addResistance(tipos, BICHO, DRAGON);
        addResistance(tipos, ELECTRICO, ELECTRICO);
        addResistance(tipos, ELECTRICO, PLANTA);
        addResistance(tipos, ELECTRICO, DRAGON);
        addResistance(tipos, NORMAL, ROCA);
        addResistance(tipos, NORMAL, ACERO);
        addResistance(tipos, ROCA, ACERO);
        addResistance(tipos, ROCA, TIERRA);
        addResistance(tipos, ROCA, LUCHA);
        addResistance(tipos, TIERRA, PLANTA);
        addResistance(tipos, TIERRA, BICHO);
        addResistance(tipos, FUEGO, FUEGO);
        //addResistance(tipos, ACERO, FUEGO);
        addResistance(tipos, FUEGO, ROCA);
        addResistance(tipos, FUEGO, DRAGON);
        addResistance(tipos, LUCHA, VENENO);
        addResistance(tipos, LUCHA, PSIQUICO);
        addResistance(tipos, LUCHA, BICHO);
        addResistance(tipos, LUCHA, VOLADOR);
        addResistance(tipos, PSIQUICO, PSIQUICO);
        addResistance(tipos, PSIQUICO, ACERO);
        addResistance(tipos, VENENO, VENENO);
        addResistance(tipos, VENENO, TIERRA);
        addResistance(tipos, VENENO, ROCA);
        addResistance(tipos, VENENO, DRAGON);
        addResistance(tipos, DRAGON, ACERO);
        addResistance(tipos, FANTASMA, SINIESTRO);
        addResistance(tipos, SINIESTRO, SINIESTRO);
        addResistance(tipos, SINIESTRO, LUCHA);


        // ------------------------------------------------------------------
        // 4. NEUTRO (x1.0 - Para asegurar el mapeo)
        // ------------------------------------------------------------------
        tipos.add(createTipo(NORMAL, NORMAL, 1.0)); 

        tipoRepository.saveAll(tipos);
        System.out.println("--- Matriz de Tipos cargada: " + tipos.size() + " entradas creadas. ---");
    }
    
    // --- MÉTODOS AUXILIARES (DSL: Domain Specific Language) ---
    // Estos métodos hacen que el código de arriba sea legible como "reglas" y no como código.
    
    // x2.0 (Súper Efectivo)
    private void addDebility(List<Tipo> tipos, int atacanteIdx, int defensorIdx) {
        tipos.add(createTipo(atacanteIdx, defensorIdx, 2.0));
    }

    // x0.5 (Resistencia, poco eficaz)
    private void addResistance(List<Tipo> tipos, int atacanteIdx, int defensorIdx) {
        tipos.add(createTipo(atacanteIdx, defensorIdx, 0.5));
    }

    // x0.0 (Inmunidad)
    private void addImmunity(List<Tipo> tipos, int atacanteIdx, int defensorIdx) {
        tipos.add(createTipo(atacanteIdx, defensorIdx, 0.0));
    }

    // Constructor de la Entidad Tipo
    private Tipo createTipo(int atacante, int defensor, double multiplicador) {
        Tipo tipo = new Tipo();
        // Usa el array de nombres TIPO_NAMES para obtener el String
        tipo.setAtacante(TIPO_NAMES[atacante]);
        tipo.setDefensor(TIPO_NAMES[defensor]);
        tipo.setMultiplicador(multiplicador);
        return tipo;
    }
}
