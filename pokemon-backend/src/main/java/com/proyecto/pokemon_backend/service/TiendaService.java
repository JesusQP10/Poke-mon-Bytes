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

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lógica de negocio de la tienda Pokémon.
 *
 * Todas las operaciones de compra son transaccionales (ACID):
 * si falla el guardado del inventario, se revierte el descuento de dinero.
 */
@Service
public class TiendaService {

    /** Precio de cada ítem en la tienda (fijo; no se usa el valor persistido en BD para cobrar/mostrar). */
    private static final int PRECIO_UNITARIO = 1;

    private final RepositorioUsuario userRepository;
    private final RepositorioObjeto itemRepository;
    private final RepositorioInventarioUsuario inventarioRepository;
    private final JuegoService juegoService;

    /**
     * @param userRepository saldo del jugador
     * @param itemRepository catálogo de precios
     * @param inventarioRepository filas de mochila
     * @param juegoService reutiliza el mismo formato de inventario que el estado de partida
     */
    public TiendaService(
        RepositorioUsuario userRepository,
        RepositorioObjeto itemRepository,
        RepositorioInventarioUsuario inventarioRepository,
        JuegoService juegoService
    ) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.inventarioRepository = inventarioRepository;
        this.juegoService = juegoService;
    }

    /** Catálogo PokéMart: filas de la tabla {@code ITEMS} (sembradas al arranque desde PokéAPI). */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarCatalogo() {
        return itemRepository.findAll().stream()
            .sorted(Comparator.comparing(Item::getNombre, String.CASE_INSENSITIVE_ORDER))
            .map(item -> {
                Map<String, Object> m = new HashMap<>();
                m.put("itemId", item.getIdItem());
                m.put("nombre", item.getNombre());
                m.put("precio", PRECIO_UNITARIO);
                m.put("efecto", item.getEfecto());
                return m;
            })
            .toList();
    }

    /**
     * Descuenta dinero y suma cantidad al par (usuario, ítem). Todo en una transacción: si el {@code save}
     * del inventario fallara, el update de dinero hace rollback.
     */
    @Transactional
    @SuppressWarnings("null")
    public Map<String, Object> comprarItem(String username, SolicitudCompra request) {
        Usuario usuario = userRepository.findByUsername(username)
            .orElseThrow(() -> new RecursoNoEncontrado("Usuario no encontrado."));

        Item item = itemRepository.findById(request.getItemId())
            .orElseThrow(() -> new RecursoNoEncontrado("Ítem no existe en el catálogo."));

        int costoTotal = PRECIO_UNITARIO * request.getCantidad().intValue();
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

        String mensaje = String.format("Compraste %d x %s. Dinero restante: %d₽.",
            request.getCantidad(), item.getNombre(), usuario.getDinero());
        return Map.of(
            "mensaje", mensaje,
            "money", usuario.getDinero(),
            "inventario", juegoService.listarInventarioDtos(username)
        );
    }
}
