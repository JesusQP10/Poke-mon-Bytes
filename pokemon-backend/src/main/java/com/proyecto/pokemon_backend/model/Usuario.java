package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data; 
import lombok.NoArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.List;

/**
 * Entidad Transaccional que representa al Jugador.
 * * Implementa 'UserDetails':
 * Esta es la clave de la integración con Spring Security. Al implementar esta interfaz,
 * le decimos al Framework: "Oye, esta clase de mi base de datos es la que contiene
 * las credenciales para loguearse".
 * * Mapea la tabla 'USUARIOS' en MySQL.
 */

@Entity
@Table(name = "USUARIOS") // Mapea a la tabla USUARIOS en MySQL
@Data 
@NoArgsConstructor
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuario; 

    @Column(unique = true, nullable = false)
    private String username;

    /**
     * Contraseña encriptada.
     * NUNCA texto plano. Aquí se guarda el hash generado por BCrypt
     * (ej: $2a$10$EixZaYVK1...).
     */
    @Column(nullable = false)
    private String passwordHash; 

    // --- ESTADO DEL JUEGO (Persistencia) ---
    // Además de la seguridad, esta entidad guarda el progreso global del jugador.
    private int dinero = 300;
    
    
    private String mapaActual = "Pueblo Inicial";
    private int posX = 5;
    private int posY = 5;

    // --- MÉTODOS DE LA INTERFAZ UserDetails (Seguridad) ---

    /**
     * Método que usa Spring Security para obtener la contraseña real de la BD
     * y compararla con la que introduce el usuario en el formulario.
     */
    @Override
    // Devuelvo este dato para reutilizarlo en otras partes.
    public String getPassword() {
     return passwordHash; // Debe devolver el hash cifrado de la BD
    }
    @Override
    // Devuelvo este dato para reutilizarlo en otras partes.
    public String getUsername() {
        return username; 
    }
    
    // Los ususarios no tienen roles complejos por ahora
    @Override
    // Devuelvo este dato para reutilizarlo en otras partes.
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); //Lista vacía de roles por ahora
    }

    // --- Flags de Estado de Cuenta ---
    // Spring Security verifica estos booleanos antes de dejar entrar al usuario.
    // Los dejamos en 'true' para simplificar (la cuenta nunca caduca ni se bloquea).
    @Override
    // Este metodo se encarga de isAccountNonExpired.
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    // Este metodo se encarga de isAccountNonLocked.
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    // Este metodo se encarga de isCredentialsNonExpired.
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    // Este metodo se encarga de isEnabled.
    public boolean isEnabled() {
        return true;
    }

}

