package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.dto.SolicitudCompra;
import com.proyecto.pokemon_backend.exception.ErrorNegocio;
import com.proyecto.pokemon_backend.exception.RecursoNoEncontrado;
import com.proyecto.pokemon_backend.model.InventarioId;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.RepositorioInventarioUsuario;
import com.proyecto.pokemon_backend.repository.RepositorioObjeto;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lógica de negocio de la tienda Pokémon.
 *
 * Todas las operaciones de compra son transaccionales (ACID):
 * si falla el guardado del inventario, se revierte el descuento de dinero.
 */
@Service
public class TiendaService {

    private final RepositorioUsuario userRepository;
    private final RepositorioObjeto itemRepository;
    private final RepositorioInventarioUsuario inventarioRepository;

    public TiendaService(
        RepositorioUsuario userRepository,
        RepositorioObjeto itemRepository,
        RepositorioInventarioUsuario inventarioRepository
    ) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.inventarioRepository = inventarioRepository;
    }

    @Transactional
    @SuppressWarnings("null")
    public String comprarItem(String username, SolicitudCompra request) {
        Usuario usuario = userRepository.findByUsername(username)
            .orElseThrow(() -> new RecursoNoEncontrado("Usuario no encontrado."));

        Item item = itemRepository.findById(request.getItemId())
            .orElseThrow(() -> new RecursoNoEncontrado("Ítem no existe en el catálogo."));

        int costoTotal = item.getPrecio().intValue() * request.getCantidad().intValue();
        if (usuario.getDinero() < costoTotal) {
            throw new ErrorNegocio(String.format(
                "Saldo insuficiente. Tienes %d₽, necesitas %d₽.", usuario.getDinero(), costoTotal
            ));
        }

        usuario.setDinero(usuario.getDinero() - costoTotal);
        userRepository.save(usuario);

        InventarioId inventarioId = new InventarioId(usuario.getIdUsuario(), item.getIdItem());
        InventarioUsuario entrada = inventarioRepository.findById(inventarioId)
            .orElse(new InventarioUsuario(usuario, item, 0));

        entrada.setCantidad(entrada.getCantidad() + request.getCantidad());
        inventarioRepository.save(entrada);

        return String.format("Compraste %d x %s. Dinero restante: %d₽.",
            request.getCantidad(), item.getNombre(), usuario.getDinero());
    }
}
