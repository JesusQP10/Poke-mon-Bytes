package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // --- Módulo de Registro ---
    public Usuario registerNewUser(Usuario user) {
        // 1. Verificar unicidad
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("El nombre de usuario ya está en uso."); 
        }
        
        // 2. Cifrar la contraseña
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

        // 3. Guardar en MySQL
        return userRepository.save(user);
    }
    
    // --- Módulo de Carga de Usuario (CRÍTICO para Login/JWT) ---
    // Este método carga la entidad Usuario con todos los detalles de la BD.
    public UserDetails loadUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + username));
    }
}