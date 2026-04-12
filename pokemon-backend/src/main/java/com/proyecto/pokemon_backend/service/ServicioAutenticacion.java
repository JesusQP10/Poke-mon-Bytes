package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.exception.ErrorNegocio;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/** Alta de usuarios y comprobaciones de credenciales usadas desde el controlador de auth. */
@Service
public class ServicioAutenticacion {

    private final RepositorioUsuario userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * @param userRepository persistencia de jugadores
     * @param passwordEncoder BCrypt para el registro
     */
    public ServicioAutenticacion(RepositorioUsuario userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Persiste el usuario con contraseña ya en claro en {@code user.passwordHash} → se guarda como hash BCrypt. */
    public Usuario registrarUsuarioNuevo(Usuario user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new ErrorNegocio("El nombre de usuario ya está en uso.");
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return userRepository.save(user);
    }

    /** Usado tras login exitoso para emitir el JWT con los roles/flags que Spring asocie al {@link Usuario}. */
    public UserDetails cargarUsuarioPorNombreUsuario(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ErrorNegocio("Usuario no encontrado: " + username));
    }
}
