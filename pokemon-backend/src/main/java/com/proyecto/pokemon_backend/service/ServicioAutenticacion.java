package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.exception.ErrorNegocio;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class ServicioAutenticacion {

    private final RepositorioUsuario userRepository;
    private final PasswordEncoder passwordEncoder;

    public ServicioAutenticacion(RepositorioUsuario userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario registrarUsuarioNuevo(Usuario user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new ErrorNegocio("El nombre de usuario ya está en uso.");
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return userRepository.save(user);
    }

    public UserDetails cargarUsuarioPorNombreUsuario(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ErrorNegocio("Usuario no encontrado: " + username));
    }
}
