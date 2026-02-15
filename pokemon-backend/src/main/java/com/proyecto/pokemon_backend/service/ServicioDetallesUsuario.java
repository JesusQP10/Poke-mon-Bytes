package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Adaptador de Seguridad.
 * Implementa la interfaz estándar 'UserDetailsService' de Spring Security.
 * Función puente:
 * Spring Security necesita validar credenciales, pero no sabe que usamos MySQL ni una entidad llamada 'Usuario'.
 * Esta clase le enseña a Spring como buscar a un usuario en nuestra base de datos específica.
 */

@Service
public class ServicioDetallesUsuario implements UserDetailsService {
    private final RepositorioUsuario userRepository;

    // Este metodo se encarga de ServicioDetallesUsuario.
    public ServicioDetallesUsuario(RepositorioUsuario userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Método: cargarUsuarioPorNombreUsuario
     * Este es el único método que Spring Security invoca automáticamente durante el proceso de Login.
     * Flujo de ejecución:
     * 1. El 'AuthenticationManager' recibe el username del iniciarSesion.
     * 2. Llama a este método pasándole ese username.
     * 3. Nosotros consultamos nuestro Repositorio (MySQL).
     * 4. Si existe, devolvemos el objeto Usuario (que implementa UserDetails).
     * 5. Si no, lanzamos la excepción específica que Spring espera para denegar el acceso.
     * @param username El nombre de usuario introducido en el formulario de iniciarSesion.
     * @return UserDetails El objeto usuario cargado desde la BD (con su password hash).
     * @throws UsernameNotFoundException Si el usuario no existe en la tabla USUARIOS.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return cargarUsuarioPorNombreUsuario(username);
    }

    public UserDetails cargarUsuarioPorNombreUsuario(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    
}

