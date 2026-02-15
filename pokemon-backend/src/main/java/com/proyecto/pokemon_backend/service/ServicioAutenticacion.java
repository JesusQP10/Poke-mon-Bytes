package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio de Lógica de Negocio para la Autenticación.
 * @Service: Indica a Spring que esta clase contiene la lógica empresarial.
 * Se encarga de coordinar el registro de usuarios (cifrando claves) y la búsqueda de usuarios
 * para el proceso de iniciarSesion. Actúa como intermediario entre el Controlador y el Repositorio.
 */

@Service
public class ServicioAutenticacion {

    private final RepositorioUsuario userRepository;
    private final PasswordEncoder codificadorContrasena;

    /**
     * Constructor para la Inyección de Dependencias.
     * Spring inyecta automáticamente:
     * 1. RepositorioUsuario: Para poder guardar y buscar en la BD.
     * 2. PasswordEncoder: El bean BCrypt definido en ConfiguracionSeguridad para hashear contraseñas.
     */

    public ServicioAutenticacion(RepositorioUsuario userRepository, PasswordEncoder codificadorContrasena) {
        this.userRepository = userRepository;
        this.codificadorContrasena = codificadorContrasena;
    }

    // --- Módulo de Registro ---

    /**
     * Procesa el registro de un nuevo usuario aplicando reglas de seguridad.
     * @param user El objeto Usuario con los datos en texto plano que vienen del frontend.
     * @return El usuario guardado en base de datos con la contraseña ya cifrada.
     * @throws RuntimeException Si el nombre de usuario ya existe.
     */
    public Usuario registrarUsuarioNuevo(Usuario user) {
        // 1. Verificar unicidad
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("El nombre de usuario ya está en uso."); 
        }
        
        // 2. Seguridad: Cifrar la contraseña.
        // NUNCA guardamos la contraseña en texto plano. Usamos BCrypt para generar un hash.
        // Requisito no funcional de seguridad de datos.
        user.setPasswordHash(codificadorContrasena.encode(user.getPasswordHash()));

        // 3. Guardar en MySQL
        return userRepository.save(user);
    }
    
    // --- Módulo de Carga de Usuario (CRÍTICO para Login/JWT) ---

    /**
     * Busca un usuario en la base de datos por su nombre.
     * Este método es vital para el proceso de Login: Spring Security lo usa para
     * obtener la contraseña cifrada de la BD y compararla con la que el usuario acaba de escribir.
     * @param username El nombre de usuario a buscar.
     * @return UserDetails (La interfaz que Spring Security entiende como "Usuario").
     */
    public UserDetails cargarUsuarioPorNombreUsuario(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + username));
    }
}

