package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.dto.CompraRequest;
import com.proyecto.pokemon_backend.model.InventarioId;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.InventarioUsuarioRepository;
import com.proyecto.pokemon_backend.repository.ItemRepository;
import com.proyecto.pokemon_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TiendaService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final InventarioUsuarioRepository inventarioRepository;

    public TiendaService(UserRepository userRepository, 
                         ItemRepository itemRepository, 
                         InventarioUsuarioRepository inventarioRepository) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.inventarioRepository = inventarioRepository;
    }

    /**
     * Realiza una compra segura.
     * Resta dinero al usuario y añade el ítem al inventario.
     */
    @Transactional // CRÍTICO: Si algo falla, se revierten todos los cambios (dinero e inventario)
    public String comprarItem(String username, CompraRequest request) {
        
        // 1. Validar Usuario
        Usuario usuario = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        // 2. Validar Ítem
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new RuntimeException("Ítem no existe en el catálogo."));

        // 3. Calcular Costo Total
        if (request.getCantidad() <= 0) throw new RuntimeException("Cantidad inválida.");
        int costoTotal = item.getPrecio() * request.getCantidad();

        // 4. Verificar Fondos
        if (usuario.getDinero() < costoTotal) {
            throw new RuntimeException("Saldo insuficiente. Tienes: " + usuario.getDinero() + ", Necesitas: " + costoTotal);
        }

        // 5. Transacción Económica (Restar dinero)
        usuario.setDinero(usuario.getDinero() - costoTotal);
        userRepository.save(usuario);

        // 6. Actualizar Inventario
        // Buscamos si ya tiene este ítem en la mochila
        InventarioId inventarioId = new InventarioId(usuario.getIdUsuario(), item.getIdItem());
        
        InventarioUsuario entradaInventario = inventarioRepository.findById(inventarioId)
                .orElse(new InventarioUsuario(usuario, item, 0)); // Si no tiene, creamos uno nuevo con 0

        // Sumamos la cantidad comprada
        entradaInventario.setCantidad(entradaInventario.getCantidad() + request.getCantidad());
        inventarioRepository.save(entradaInventario);

        return String.format("Compra realizada con éxito. Has comprado %d x %s. Dinero restante: %d", 
                             request.getCantidad(), item.getNombre(), usuario.getDinero());
    }
}