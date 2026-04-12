package com.proyecto.pokemon_backend.component;

import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.repository.RepositorioUsuario;
import com.proyecto.pokemon_backend.support.CuentaSalvajes;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea un usuario técnico cuyos {@code PokemonUsuario} son instancias de combate salvaje.
 * No se usa para login; solo FK en {@code POKEMON_USUARIO}.
 */
@Component
@Order(1)
public class SembradorUsuarioSalvajes implements CommandLineRunner {

    private final RepositorioUsuario userRepository;
    private final PasswordEncoder passwordEncoder;

    public SembradorUsuarioSalvajes(RepositorioUsuario userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername(CuentaSalvajes.USERNAME).isPresent()) {
            return;
        }
        Usuario u = new Usuario();
        u.setUsername(CuentaSalvajes.USERNAME);
        u.setPasswordHash(passwordEncoder.encode("NO_LOGIN"));
        u.setDinero(0);
        u.setMapaActual("__sistema__");
        u.setPosX(0);
        u.setPosY(0);
        userRepository.save(u);
    }
}
