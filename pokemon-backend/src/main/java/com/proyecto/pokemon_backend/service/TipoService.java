package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.model.Tipo;
import com.proyecto.pokemon_backend.repository.RepositorioTipo;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;

/**
 * Consulta la matriz de efectividad de tipos almacenada en BD.
 *
 * Los tipos de la PokéAPI vienen en inglés (fire, water...).
 * La BD los almacena en español (Fuego, Agua...) para coincidir con
 * los datos cargados por InicializadorTipos.
 * Este servicio normaliza ambas representaciones antes de consultar.
 */
@Service
public class TipoService {

    /** Mapa de normalización: cualquier variante → nombre canónico en BD. */
    private static final Map<String, String> NORMALIZAR = Map.ofEntries(
        Map.entry("normal",     "Normal"),
        Map.entry("fuego",      "Fuego"),   Map.entry("fire",      "Fuego"),
        Map.entry("agua",       "Agua"),    Map.entry("water",     "Agua"),
        Map.entry("planta",     "Planta"),  Map.entry("grass",     "Planta"),
        Map.entry("electrico",  "Eléctrico"), Map.entry("eléctrico", "Eléctrico"), Map.entry("electric", "Eléctrico"),
        Map.entry("hielo",      "Hielo"),   Map.entry("ice",       "Hielo"),
        Map.entry("lucha",      "Lucha"),   Map.entry("fighting",  "Lucha"),
        Map.entry("veneno",     "Veneno"),  Map.entry("poison",    "Veneno"),
        Map.entry("tierra",     "Tierra"),  Map.entry("ground",    "Tierra"),
        Map.entry("volador",    "Volador"), Map.entry("flying",    "Volador"),
        Map.entry("psiquico",   "Psíquico"), Map.entry("psíquico", "Psíquico"), Map.entry("psychic", "Psíquico"),
        Map.entry("bicho",      "Bicho"),   Map.entry("bug",       "Bicho"),
        Map.entry("roca",       "Roca"),    Map.entry("rock",      "Roca"),
        Map.entry("fantasma",   "Fantasma"), Map.entry("ghost",    "Fantasma"),
        Map.entry("dragon",     "Dragón"),  Map.entry("dragón",    "Dragón"), Map.entry("dragon_en", "Dragón"),
        Map.entry("siniestro",  "Siniestro"), Map.entry("dark",    "Siniestro"),
        Map.entry("acero",      "Acero"),   Map.entry("steel",     "Acero")
    );

    private final RepositorioTipo tipoRepository;

    /** @param tipoRepository matriz de efectividad persistida en {@code TIPOS} */
    public TipoService(RepositorioTipo tipoRepository) {
        this.tipoRepository = tipoRepository;
    }

    /**
     * Calcula el multiplicador total de efectividad para un ataque contra un defensor.
     * Si el defensor tiene dos tipos, los multiplicadores se multiplican entre sí.
     */
    public double calcularEfectividad(String tipoAtaque, String defensorTipo1, String defensorTipo2) {
        String atk = normalizar(tipoAtaque);
        String def1 = normalizar(defensorTipo1);
        String def2 = normalizar(defensorTipo2);

        if (atk.isEmpty() || def1.isEmpty()) return 1.0;

        double mult1 = tipoRepository.findByAtacanteAndDefensor(atk, def1)
            .map(Tipo::getMultiplicador)
            .orElse(1.0);

        double mult2 = def2.isEmpty() ? 1.0
            : tipoRepository.findByAtacanteAndDefensor(atk, def2)
                .map(Tipo::getMultiplicador)
                .orElse(1.0);

        return mult1 * mult2;
    }

    /** Mensaje de efectividad para mostrar al jugador, estilo Gen II. */
    public String mensajeEfectividad(double multiplicador) {
        if (multiplicador == 0.0)  return "¡No tiene efecto!";
        if (multiplicador >= 4.0)  return "¡Es muy efectivo! (x4)";
        if (multiplicador >= 2.0)  return "¡Es muy efectivo!";
        if (multiplicador <= 0.25) return "No es muy efectivo...";
        if (multiplicador < 1.0)   return "No es muy efectivo...";
        return "";
    }

    /**
     * Traduce variantes en español/inglés a la forma de la tabla {@code TIPOS}.
     * Si no hay entrada en el mapa, devuelve cadena vacía y la consulta de efectividad usa 1.0.
     */
    private String normalizar(String raw) {
        if (raw == null) return "";
        return NORMALIZAR.getOrDefault(raw.trim().toLowerCase(Locale.ROOT), "");
    }
}
