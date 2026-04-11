package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Entidad que representa al jugador en base de datos.
 *
 * Implementa UserDetails para integrarse con Spring Security sin necesidad
 * de un wrapper adicional, dado que el modelo de roles es simple (sin roles complejos).
 * Si el sistema de roles crece, extraer a UsuarioPrincipal.
 */
@Entity
@Table(name = "USUARIOS")
@Data
@NoArgsConstructor
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuario;

    @Column(unique = true, nullable = false)
    private String username;

    /** Hash BCrypt. Nunca se almacena la contraseña en texto plano. */
    @Column(nullable = false)
    private String passwordHash;

    // --- Estado del juego ---
    private int dinero = 300;
    private String mapaActual = "Pueblo Inicial";
    private int posX = 5;
    private int posY = 5;

    /**
     * JSON del front (inventario, flags, nombre jugador, reloj, equipo espejo…).
     * En MySQL usar LONGTEXT sin {@code @Lob}: {@code @Lob} en {@code String} suele mapear a tipos JDBC
     * que hacen que el valor se guarde o se lea como {@code null}.
     */
    @Column(name = "estado_cliente_json", columnDefinition = "LONGTEXT")
    private String estadoClienteJson;

    // --- UserDetails ---

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
