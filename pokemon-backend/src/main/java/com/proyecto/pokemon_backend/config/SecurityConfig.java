package com.proyecto.pokemon_backend.config;

import com.proyecto.pokemon_backend.filter.JwtAuthenticationFilter;
import com.proyecto.pokemon_backend.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration 
@EnableWebSecurity 
public class SecurityConfig implements WebMvcConfigurer {

    // 1. DEPENDENCIA: Inyección de tu servicio que consulta la BD
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    // ----------------------------------------------------
    // BEANS: MÉTODOS DE AUTENTICACIÓN
    // ----------------------------------------------------

    // 2. Bean para el cifrado de contraseñas (BCrypt)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); 
    }

    // 3. Bean para exponer el AuthenticationManager (necesario para el Login en AuthController)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    // 4. Bean que le dice a Spring Security CÓMO autenticar (usa tu servicio de BD y el cifrador)
    // Dentro de SecurityConfig.java
    @Bean
public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService); // Carga tu servicio de BD
    provider.setPasswordEncoder(passwordEncoder());     // Usa el BCryptPasswordEncoder
    return provider;
    }

    // ----------------------------------------------------
    // FILTRO DE SEGURIDAD Y REGLAS DE ACCESO
    // ----------------------------------------------------

    // 5. Configuración del filtro de seguridad HTTP
    // Dentro de SecurityConfig.java
// Nota: Necesitas inyectar JwtService y CustomUserDetailsService EN EL CONSTRUCTOR
// para que el filtro pueda acceder a ellos.

@Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtAuthFilter // <--- ¡AQUÍ ESTÁ LA CLAVE! Spring lo inyecta como Bean
    ) throws Exception {
        http
        // ... (CSRF, CORS, SessionManagement se mantienen)
            .csrf(csrf -> csrf.disable()) 
            .cors(withDefaults())         
            .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS) 
        )
        // 1. Aquí usamos el filtro inyectado como parámetro
        .authenticationProvider(authenticationProvider())
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class) // <--- Se añade al filtro
        
        // 2. Reglas de Autorización
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/v1/auth/**").permitAll() 
            .requestMatchers("/api/v1/juego/**").authenticated() 
            .anyRequest().authenticated()
        );
            
    return http.build();
}
    // ----------------------------------------------------
    // CONFIGURACIÓN DE CORS (PARA INTEGRACIÓN CON REACT)
    // ----------------------------------------------------

    // 8. Configuración de CORS
    @Override
    public void addCorsMappings(CorsRegistry registry) { 
        registry.addMapping("/**") // Aplica a todos los endpoints
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000") // Origen de tu Frontend (React)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Métodos permitidos
                .allowedHeaders("*") // Cabeceras permitidas (incluyendo Authorization para JWT)
                .allowCredentials(true);
    }
}