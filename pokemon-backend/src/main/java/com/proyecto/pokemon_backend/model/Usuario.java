package com.proyecto.pokemon_backend.model;

import jakarta.persistence.*;
import lombok.Data; 
import lombok.NoArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.List;


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

    @Column(nullable = false)
    private String passwordHash; // Almacena la contraseña CIFRADA

    private int dinero = 300;
    
    // Campos de estado del juego (persistencia)
    private String mapaActual = "Pueblo Inicial";
    private int posX = 5;
    private int posY = 5;

    // --Métodos de la interfaz UserDetails--
    // Dentro de Usuario.java
    @Override
    public String getPassword() {
     return passwordHash; // Debe devolver el hash cifrado de la BD
    }
    @Override
    public String getUsername() {
        return username; 
    }
    
    // Los ususarios no tienen roles complejos por ahora
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); //Lista vacía de roles por ahora
    }

    // Metodos para indicar si la cuenta esta activa (por ahora, siempre true)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }



}
