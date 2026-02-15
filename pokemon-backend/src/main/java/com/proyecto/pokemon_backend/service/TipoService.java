package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.model.Tipo;
import com.proyecto.pokemon_backend.repository.RepositorioTipo;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class TipoService {

    private static final Map<String, String> TYPE_TO_DB = Map.ofEntries(
        Map.entry("normal", "Normal"),
        Map.entry("fuego", "Fuego"),
        Map.entry("fire", "Fuego"),
        Map.entry("agua", "Agua"),
        Map.entry("water", "Agua"),
        Map.entry("planta", "Planta"),
        Map.entry("grass", "Planta"),
        Map.entry("electrico", "Eléctrico"),
        Map.entry("eléctrico", "Eléctrico"),
        Map.entry("electric", "Eléctrico"),
        Map.entry("hielo", "Hielo"),
        Map.entry("ice", "Hielo"),
        Map.entry("lucha", "Lucha"),
        Map.entry("fighting", "Lucha"),
        Map.entry("veneno", "Veneno"),
        Map.entry("poison", "Veneno"),
        Map.entry("tierra", "Tierra"),
        Map.entry("ground", "Tierra"),
        Map.entry("volador", "Volador"),
        Map.entry("flying", "Volador"),
        Map.entry("psiquico", "Psíquico"),
        Map.entry("psíquico", "Psíquico"),
        Map.entry("psychic", "Psíquico"),
        Map.entry("bicho", "Bicho"),
        Map.entry("bug", "Bicho"),
        Map.entry("roca", "Roca"),
        Map.entry("rock", "Roca"),
        Map.entry("fantasma", "Fantasma"),
        Map.entry("ghost", "Fantasma"),
        Map.entry("dragon", "Dragón"),
        Map.entry("dragón", "Dragón"),
        Map.entry("siniestro", "Siniestro"),
        Map.entry("dark", "Siniestro"),
        Map.entry("acero", "Acero"),
        Map.entry("steel", "Acero")
    );

    private final RepositorioTipo tipoRepository;

    
    public TipoService(RepositorioTipo tipoRepository) {
        this.tipoRepository = tipoRepository;
    }

    // calcularEfectividad.
    public double calcularEfectividad(String tipoAtaque, String defensorTipo1, String defensorTipo2) {
        String atacanteDb = normalizarTipoParaBd(tipoAtaque);
        String defensor1Db = normalizarTipoParaBd(defensorTipo1);
        String defensor2Db = normalizarTipoParaBd(defensorTipo2);

        if (atacanteDb.isEmpty() || defensor1Db.isEmpty()) {
            return 1.0;
        }

        double mult1 = tipoRepository.findByAtacanteAndDefensor(atacanteDb, defensor1Db)
            .map(Tipo::getMultiplicador)
            .orElse(1.0);

        double mult2 = 1.0;
        if (!defensor2Db.isEmpty()) {
            mult2 = tipoRepository.findByAtacanteAndDefensor(atacanteDb, defensor2Db)
                .map(Tipo::getMultiplicador)
                .orElse(1.0);
        }

        return mult1 * mult2;
    }

    // Aquí busco los datos que necesita esta parte.
    public String obtenerMensajeEfectividad(double multiplicador) {
        if (multiplicador == 0.0) {
            return "No tiene efecto.";
        }
        if (multiplicador >= 4.0) {
            return "Es super efectivo x4.";
        }
        if (multiplicador >= 2.0) {
            return "Es super efectivo.";
        }
        if (multiplicador <= 0.25) {
            return "No es muy efectivo.";
        }
        if (multiplicador < 1.0) {
            return "No es muy efectivo.";
        }
        return "";
    }

    // Este metodo se encarga de normalizarTipoParaBd.
    private String normalizarTipoParaBd(String rawType) {
        if (rawType == null) {
            return "";
        }
        String key = rawType.trim().toLowerCase(Locale.ROOT);
        return TYPE_TO_DB.getOrDefault(key, "");
    }
}

