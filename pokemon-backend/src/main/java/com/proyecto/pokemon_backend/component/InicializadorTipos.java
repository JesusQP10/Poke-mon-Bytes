package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Tipo;
import com.proyecto.pokemon_backend.repository.RepositorioTipo;

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
public class InicializadorTipos implements CommandLineRunner {

   
    private RepositorioTipo tipoRepository;

    // Aquí preparo datos necesarios al arrancar la app.
    public InicializadorTipos(RepositorioTipo tipoRepository) {
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
    // Este metodo se encarga de run.
    public void run(String... args) throws Exception {
        // Ejecutar la carga solo si la tabla está vacía
        if (tipoRepository != null && tipoRepository.count() == 0) { 
            System.out.println("--- INICIANDO CARGA DE MATRIZ DE TIPOS (FINAL) ---");
            cargarMatrizTipos();
        }
    }

    /**
     * Define y persiste todas las relaciones de efectividad.
     * Sigue la tabla oficial de Pokémon Oro/Plata/Cristal.
     */
    private void cargarMatrizTipos() {
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
        agregarInmunidad(tipos, ELECTRICO, TIERRA); 
        agregarInmunidad(tipos, NORMAL, FANTASMA); 
        agregarInmunidad(tipos, FANTASMA, NORMAL);  
        agregarInmunidad(tipos, LUCHA, FANTASMA);    
        agregarInmunidad(tipos, TIERRA, VOLADOR);    
        agregarInmunidad(tipos, VENENO, ACERO);      
        agregarInmunidad(tipos, PSIQUICO, SINIESTRO); 
        
        // ------------------------------------------------------------------
        // 2. DEBILIDADES (x2.0)
        // ------------------------------------------------------------------
        agregarDebilidad(tipos, FUEGO, PLANTA);
        agregarDebilidad(tipos, FUEGO, HIELO);
        agregarDebilidad(tipos, FUEGO, BICHO);
        agregarDebilidad(tipos, FUEGO, ACERO);
        agregarDebilidad(tipos, ACERO, HIELO);
        agregarDebilidad(tipos, ACERO, ROCA);
        agregarDebilidad(tipos, VOLADOR, PLANTA);
        agregarDebilidad(tipos, VOLADOR, LUCHA);
        agregarDebilidad(tipos, VOLADOR, BICHO);
        agregarDebilidad(tipos, AGUA, FUEGO);
        agregarDebilidad(tipos, AGUA, TIERRA);
        agregarDebilidad(tipos, AGUA, ROCA);
        agregarDebilidad(tipos, HIELO, PLANTA);
        agregarDebilidad(tipos, HIELO, TIERRA);
        agregarDebilidad(tipos, HIELO, VOLADOR);
        agregarDebilidad(tipos, HIELO, DRAGON);
        agregarDebilidad(tipos, PLANTA, AGUA);
        agregarDebilidad(tipos, PLANTA, TIERRA);
        agregarDebilidad(tipos, PLANTA, ROCA);
        agregarDebilidad(tipos, BICHO, PSIQUICO);
        agregarDebilidad(tipos, BICHO, PLANTA);
        agregarDebilidad(tipos, BICHO, SINIESTRO);
        agregarDebilidad(tipos, ELECTRICO, AGUA);
        agregarDebilidad(tipos, ELECTRICO, VOLADOR);
        agregarDebilidad(tipos, ROCA, FUEGO);
        agregarDebilidad(tipos, ROCA, HIELO);
        agregarDebilidad(tipos, ROCA, VOLADOR);
        agregarDebilidad(tipos, ROCA, BICHO);
        agregarDebilidad(tipos, TIERRA, FUEGO);
        agregarDebilidad(tipos, TIERRA, ELECTRICO);
        agregarDebilidad(tipos, TIERRA, VENENO);
        agregarDebilidad(tipos, TIERRA, ROCA);
        agregarDebilidad(tipos, TIERRA, ACERO);
        agregarDebilidad(tipos, LUCHA, NORMAL);
        agregarDebilidad(tipos, LUCHA, HIELO);
        agregarDebilidad(tipos, LUCHA, ROCA);
        agregarDebilidad(tipos, LUCHA, SINIESTRO);
        agregarDebilidad(tipos, LUCHA, ACERO);
        agregarDebilidad(tipos, PSIQUICO, LUCHA);
        agregarDebilidad(tipos, PSIQUICO, VENENO);
        agregarDebilidad(tipos, VENENO, PLANTA);
        agregarDebilidad(tipos, DRAGON, DRAGON);
        agregarDebilidad(tipos, FANTASMA, PSIQUICO);
        agregarDebilidad(tipos, FANTASMA, FANTASMA);
        agregarDebilidad(tipos, SINIESTRO, PSIQUICO);
        agregarDebilidad(tipos, SINIESTRO, FANTASMA);

        
        // ------------------------------------------------------------------
        // 3. RESISTENCIAS (x0.5)
        // ------------------------------------------------------------------
        agregarResistencia(tipos, VOLADOR, ACERO);
        agregarResistencia(tipos, VOLADOR, ELECTRICO);
        agregarResistencia(tipos, VOLADOR, ROCA);
        agregarResistencia(tipos, ACERO, FUEGO);
        agregarResistencia(tipos, ACERO, AGUA);
        agregarResistencia(tipos, ACERO, ELECTRICO);
        agregarResistencia(tipos, ACERO, ACERO);
        agregarResistencia(tipos, AGUA, AGUA);
        agregarResistencia(tipos, AGUA, PLANTA);
        agregarResistencia(tipos, AGUA, DRAGON);
        agregarResistencia(tipos, HIELO, HIELO);
        agregarResistencia(tipos, HIELO, ACERO);
        agregarResistencia(tipos, HIELO, FUEGO);
        agregarResistencia(tipos, HIELO, AGUA);
        agregarResistencia(tipos, PLANTA, FUEGO);
        agregarResistencia(tipos, PLANTA, PLANTA);
        agregarResistencia(tipos, PLANTA, VENENO);
        agregarResistencia(tipos, PLANTA, VOLADOR);
        agregarResistencia(tipos, PLANTA, BICHO);
        agregarResistencia(tipos, PLANTA, DRAGON);
        agregarResistencia(tipos, PLANTA, ACERO);
        agregarResistencia(tipos, BICHO, FUEGO);
        agregarResistencia(tipos, BICHO, LUCHA);
        agregarResistencia(tipos, BICHO, VENENO);
        agregarResistencia(tipos, BICHO, VOLADOR);
        agregarResistencia(tipos, BICHO, ACERO);
        agregarResistencia(tipos, BICHO, DRAGON);
        agregarResistencia(tipos, ELECTRICO, ELECTRICO);
        agregarResistencia(tipos, ELECTRICO, PLANTA);
        agregarResistencia(tipos, ELECTRICO, DRAGON);
        agregarResistencia(tipos, NORMAL, ROCA);
        agregarResistencia(tipos, NORMAL, ACERO);
        agregarResistencia(tipos, ROCA, ACERO);
        agregarResistencia(tipos, ROCA, TIERRA);
        agregarResistencia(tipos, ROCA, LUCHA);
        agregarResistencia(tipos, TIERRA, PLANTA);
        agregarResistencia(tipos, TIERRA, BICHO);
        agregarResistencia(tipos, FUEGO, FUEGO);
        //agregarResistencia(tipos, ACERO, FUEGO);
        agregarResistencia(tipos, FUEGO, ROCA);
        agregarResistencia(tipos, FUEGO, DRAGON);
        agregarResistencia(tipos, LUCHA, VENENO);
        agregarResistencia(tipos, LUCHA, PSIQUICO);
        agregarResistencia(tipos, LUCHA, BICHO);
        agregarResistencia(tipos, LUCHA, VOLADOR);
        agregarResistencia(tipos, PSIQUICO, PSIQUICO);
        agregarResistencia(tipos, PSIQUICO, ACERO);
        agregarResistencia(tipos, VENENO, VENENO);
        agregarResistencia(tipos, VENENO, TIERRA);
        agregarResistencia(tipos, VENENO, ROCA);
        agregarResistencia(tipos, VENENO, DRAGON);
        agregarResistencia(tipos, DRAGON, ACERO);
        agregarResistencia(tipos, FANTASMA, SINIESTRO);
        agregarResistencia(tipos, SINIESTRO, SINIESTRO);
        agregarResistencia(tipos, SINIESTRO, LUCHA);

        // ------------------------------------------------------------------
        // 4. NEUTRO (x1.0 - Para asegurar el mapeo)
        // ------------------------------------------------------------------
        tipos.add(crearTipo(NORMAL, NORMAL, 1.0)); 

        tipoRepository.saveAll(tipos);
        System.out.println("--- Matriz de Tipos cargada: " + tipos.size() + " entradas creadas. ---");
    }
    
    // --- MÉTODOS AUXILIARES (DSL: Domain Specific Language) ---
    // Estos métodos hacen que el código de arriba sea legible como "reglas" y no como código.
    
    // x2.0 (Súper Efectivo)
    private void agregarDebilidad(List<Tipo> tipos, int atacanteIdx, int defensorIdx) {
        tipos.add(crearTipo(atacanteIdx, defensorIdx, 2.0));
    }

    // x0.5 (Resistencia, poco eficaz)
    private void agregarResistencia(List<Tipo> tipos, int atacanteIdx, int defensorIdx) {
        tipos.add(crearTipo(atacanteIdx, defensorIdx, 0.5));
    }

    // x0.0 (Inmunidad)
    private void agregarInmunidad(List<Tipo> tipos, int atacanteIdx, int defensorIdx) {
        tipos.add(crearTipo(atacanteIdx, defensorIdx, 0.0));
    }

    // Constructor de la Entidad Tipo
    private Tipo crearTipo(int atacante, int defensor, double multiplicador) {
        Tipo tipo = new Tipo();
        // Usa el array de nombres TIPO_NAMES para obtener el String
        tipo.setAtacante(TIPO_NAMES[atacante]);
        tipo.setDefensor(TIPO_NAMES[defensor]);
        tipo.setMultiplicador(multiplicador);
        return tipo;
    }
}

