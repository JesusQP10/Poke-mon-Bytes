package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Adaptador entre Spring Security y nuestro repositorio de usuarios.
 *
 * Spring Security no sabe que usamos MySQL ni una entidad llamada 'Usuario'.
 * Esta clase le enseña cómo buscar un usuario en nuestra base de datos.
 */
@Service
public class ServicioDetallesUsuario implements UserDetailsService {

    private final RepositorioUsuario userRepository;

    /** @param userRepository fuente de {@link Usuario} para Spring Security */
    public ServicioDetallesUsuario(RepositorioUsuario userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * {@inheritDoc}
     *
     * @throws UsernameNotFoundException si no existe fila en {@code USUARIOS} con ese {@code username}
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }
}
