package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Tipo;
import com.proyecto.pokemon_backend.repository.RepositorioTipo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.lang.NonNull;

import java.util.ArrayList;
import java.util.List;

/**
 * Carga la matriz de efectividad de tipos Gen II en base de datos al arrancar.
 *
 * Solo se ejecuta si la tabla TIPOS está vacía, evitando duplicados en reinicios.
 *
 * NOTA: Esta clase NO tiene @Component. Se registra como @Bean en PokemonBackendApplication
 * para evitar el doble registro que causaría tener ambas anotaciones.
 */
public class InicializadorTipos implements CommandLineRunner {

    private static final String[] TIPOS = {
        "Normal", "Fuego", "Agua", "Planta", "Eléctrico", "Hielo",
        "Lucha", "Veneno", "Tierra", "Volador", "Psíquico",
        "Bicho", "Roca", "Fantasma", "Dragón", "Siniestro", "Acero"
    };

    // Índices para legibilidad
    private static final int NORMAL = 0, FUEGO = 1, AGUA = 2, PLANTA = 3, ELECTRICO = 4;
    private static final int HIELO = 5, LUCHA = 6, VENENO = 7, TIERRA = 8, VOLADOR = 9;
    private static final int PSIQUICO = 10, BICHO = 11, ROCA = 12, FANTASMA = 13;
    private static final int DRAGON = 14, SINIESTRO = 15, ACERO = 16;

    private final RepositorioTipo tipoRepository;

    /** @param tipoRepository destino de las filas de la matriz de efectividad */
    public InicializadorTipos(RepositorioTipo tipoRepository) {
        this.tipoRepository = tipoRepository;
    }

    /**
     * {@inheritDoc} — solo si {@code TIPOS} está vacío, inserta todas las relaciones no neutras Gen II.
     */
    @Override
    public void run(String... args) {
        if (tipoRepository.count() > 0) return;

        System.out.println("--- Cargando matriz de tipos Gen II ---");
        construirMatriz().forEach((@NonNull Tipo t) -> tipoRepository.save(t));
        System.out.println("--- Matriz de tipos cargada ---");
    }

    /** Genera la lista de filas (inmunidades, x2, x0.5) según tablas clásicas de Johto. */
    private List<Tipo> construirMatriz() {
        List<Tipo> tipos = new ArrayList<>();

        // Inmunidades (x0)
        inmune(tipos, ELECTRICO, TIERRA);
        inmune(tipos, NORMAL,    FANTASMA);
        inmune(tipos, FANTASMA,  NORMAL);
        inmune(tipos, LUCHA,     FANTASMA);
        inmune(tipos, TIERRA,    VOLADOR);
        inmune(tipos, VENENO,    ACERO);
        inmune(tipos, PSIQUICO,  SINIESTRO);

        // Debilidades (x2)
        debil(tipos, FUEGO,     PLANTA);  debil(tipos, FUEGO,     HIELO);
        debil(tipos, FUEGO,     BICHO);   debil(tipos, FUEGO,     ACERO);
        debil(tipos, AGUA,      FUEGO);   debil(tipos, AGUA,      TIERRA);
        debil(tipos, AGUA,      ROCA);
        debil(tipos, PLANTA,    AGUA);    debil(tipos, PLANTA,    TIERRA);
        debil(tipos, PLANTA,    ROCA);
        debil(tipos, ELECTRICO, AGUA);    debil(tipos, ELECTRICO, VOLADOR);
        debil(tipos, HIELO,     PLANTA);  debil(tipos, HIELO,     TIERRA);
        debil(tipos, HIELO,     VOLADOR); debil(tipos, HIELO,     DRAGON);
        debil(tipos, LUCHA,     NORMAL);  debil(tipos, LUCHA,     HIELO);
        debil(tipos, LUCHA,     ROCA);    debil(tipos, LUCHA,     SINIESTRO);
        debil(tipos, LUCHA,     ACERO);
        debil(tipos, VENENO,    PLANTA);
        debil(tipos, TIERRA,    FUEGO);   debil(tipos, TIERRA,    ELECTRICO);
        debil(tipos, TIERRA,    VENENO);  debil(tipos, TIERRA,    ROCA);
        debil(tipos, TIERRA,    ACERO);
        debil(tipos, VOLADOR,   PLANTA);  debil(tipos, VOLADOR,   LUCHA);
        debil(tipos, VOLADOR,   BICHO);
        debil(tipos, PSIQUICO,  LUCHA);   debil(tipos, PSIQUICO,  VENENO);
        debil(tipos, BICHO,     PLANTA);  debil(tipos, BICHO,     PSIQUICO);
        debil(tipos, BICHO,     SINIESTRO);
        debil(tipos, ROCA,      FUEGO);   debil(tipos, ROCA,      HIELO);
        debil(tipos, ROCA,      VOLADOR); debil(tipos, ROCA,      BICHO);
        debil(tipos, FANTASMA,  PSIQUICO); debil(tipos, FANTASMA, FANTASMA);
        debil(tipos, DRAGON,    DRAGON);
        debil(tipos, SINIESTRO, PSIQUICO); debil(tipos, SINIESTRO, FANTASMA);
        debil(tipos, ACERO,     HIELO);   debil(tipos, ACERO,     ROCA);

        // Resistencias (x0.5)
        resist(tipos, FUEGO,     FUEGO);  resist(tipos, FUEGO,     AGUA);
        resist(tipos, FUEGO,     ROCA);   resist(tipos, FUEGO,     DRAGON);
        resist(tipos, AGUA,      AGUA);   resist(tipos, AGUA,      PLANTA);
        resist(tipos, AGUA,      DRAGON);
        resist(tipos, PLANTA,    FUEGO);  resist(tipos, PLANTA,    PLANTA);
        resist(tipos, PLANTA,    VENENO); resist(tipos, PLANTA,    VOLADOR);
        resist(tipos, PLANTA,    BICHO);  resist(tipos, PLANTA,    DRAGON);
        resist(tipos, ELECTRICO, ELECTRICO); resist(tipos, ELECTRICO, PLANTA);
        resist(tipos, ELECTRICO, DRAGON);
        resist(tipos, HIELO,     AGUA);   resist(tipos, HIELO,     HIELO);
        resist(tipos, LUCHA,     BICHO);  resist(tipos, LUCHA,     ROCA);
        resist(tipos, VENENO,    PLANTA); resist(tipos, VENENO,    LUCHA);
        resist(tipos, VENENO,    VENENO); resist(tipos, VENENO,    BICHO);
        resist(tipos, TIERRA,    PLANTA);
        resist(tipos, VOLADOR,   LUCHA);  resist(tipos, VOLADOR,   BICHO);
        resist(tipos, VOLADOR,   PLANTA);
        resist(tipos, PSIQUICO,  LUCHA);  resist(tipos, PSIQUICO,  PSIQUICO);
        resist(tipos, BICHO,     PLANTA); resist(tipos, BICHO,     LUCHA);
        resist(tipos, BICHO,     TIERRA);
        resist(tipos, ROCA,      NORMAL); resist(tipos, ROCA,      FUEGO);
        resist(tipos, ROCA,      VENENO); resist(tipos, ROCA,      VOLADOR);
        resist(tipos, FANTASMA,  VENENO); resist(tipos, FANTASMA,  BICHO);
        resist(tipos, DRAGON,    FUEGO);  resist(tipos, DRAGON,    AGUA);
        resist(tipos, DRAGON,    PLANTA); resist(tipos, DRAGON,    ELECTRICO);
        resist(tipos, SINIESTRO, FANTASMA); resist(tipos, SINIESTRO, SINIESTRO);
        resist(tipos, ACERO,     NORMAL); resist(tipos, ACERO,     FUEGO);
        resist(tipos, ACERO,     PLANTA); resist(tipos, ACERO,     HIELO);
        resist(tipos, ACERO,     VENENO); resist(tipos, ACERO,     VOLADOR);
        resist(tipos, ACERO,     PSIQUICO); resist(tipos, ACERO,   BICHO);
        resist(tipos, ACERO,     ROCA);   resist(tipos, ACERO,     DRAGON);
        resist(tipos, ACERO,     ACERO);
        resist(tipos, NORMAL,    ROCA);   resist(tipos, NORMAL,    ACERO);
        resist(tipos, LUCHA,     VENENO); resist(tipos, LUCHA,     PSIQUICO);
        resist(tipos, LUCHA,     VOLADOR);

        return tipos;
    }

    /** Añade relación con multiplicador 0.0. */
    private void inmune(List<Tipo> lista, int atacante, int defensor) {
        lista.add(tipo(atacante, defensor, 0.0));
    }

    /** Añade relación con multiplicador 2.0. */
    private void debil(List<Tipo> lista, int atacante, int defensor) {
        lista.add(tipo(atacante, defensor, 2.0));
    }

    /** Añade relación con multiplicador 0.5. */
    private void resist(List<Tipo> lista, int atacante, int defensor) {
        lista.add(tipo(atacante, defensor, 0.5));
    }

    /** Construye una fila {@link Tipo} usando los nombres en español del arreglo {@link #TIPOS}. */
    private Tipo tipo(int atacante, int defensor, double multiplicador) {
        Tipo t = new Tipo();
        t.setAtacante(TIPOS[atacante]);
        t.setDefensor(TIPOS[defensor]);
        t.setMultiplicador(multiplicador);
        return t;
    }
}
