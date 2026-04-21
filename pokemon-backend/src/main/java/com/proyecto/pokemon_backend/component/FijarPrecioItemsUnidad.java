package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.repository.RepositorioObjeto;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fuerza precio 1 en todo el catálogo (incluye BD ya sembrada con costes PokéAPI).
 */
@Component
@Order(101)
public class FijarPrecioItemsUnidad implements CommandLineRunner {

    private final RepositorioObjeto itemRepo;

    public FijarPrecioItemsUnidad(RepositorioObjeto itemRepo) {
        this.itemRepo = itemRepo;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (Item i : itemRepo.findAll()) {
            i.setPrecio(1);
            itemRepo.save(i);
        }
    }
}
