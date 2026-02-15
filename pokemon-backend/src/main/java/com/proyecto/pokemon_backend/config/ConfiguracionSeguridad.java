package com.proyecto.pokemon_backend.config;

import com.proyecto.pokemon_backend.filter.FiltroAutenticacionJwt;
import com.proyecto.pokemon_backend.service.ServicioDetallesUsuario;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

@Configuration
@EnableWebSecurity
public class ConfiguracionSeguridad {

    // Filtro JWT + servicio de usuarios para iniciarSesion/autenticación.
    private final FiltroAutenticacionJwt jwtAuthFilter;
    private final ServicioDetallesUsuario userDetailsService;

    // Este metodo se encarga de ConfiguracionSeguridad.
    public ConfiguracionSeguridad(FiltroAutenticacionJwt jwtAuthFilter, ServicioDetallesUsuario userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    // Este metodo se encarga de cadenaFiltroSeguridad.
    public SecurityFilterChain cadenaFiltroSeguridad(HttpSecurity http) throws Exception {
        // Regla general de seguridad:
        // - Sin sesiones (API stateless)
        // - Auth con JWT
        // - Rutas publicas para auth
        // - Resto protegido
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(request -> {
                // Permitimos peticiones desde localhost y red local para desarrollo.
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(List.of(
                    "http://localhost:*",
                    "http://127.0.0.1:*",
                    "http://192.168.*:*",
                    "http://10.*:*",
                    "http://172.*:*"
                ));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setExposedHeaders(List.of("Authorization"));
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);
                return config;
            }))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(proveedorAutenticacion())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/v1/juego/**").authenticated()
                .requestMatchers("/api/v1/batalla/**").authenticated()
                .requestMatchers("/api/v1/tienda/**").authenticated()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    // Este metodo se encarga de codificadorContrasena.
    public PasswordEncoder codificadorContrasena() {
        // BCrypt para guardar contrasenas de forma segura.
        return new BCryptPasswordEncoder();
    }

    @Bean
    // Esta parte controla autenticación y seguridad.
    public AuthenticationManager gestorAutenticacion(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    // Esta parte controla autenticación y seguridad.
    public DaoAuthenticationProvider proveedorAutenticacion() {
        // Une "como buscar usuario" + "como comprobar password".
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(codificadorContrasena());
        return provider;
    }
}

