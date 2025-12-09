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

/**
 * Clase de Configuración de Seguridad.
 * * @EnableWebSecurity: Habilita el soporte de seguridad web de Spring.
 * * Implementa WebMvcConfigurer: Para poder configurar CORS globalmente.
 * * Define el comportamiento de la autenticación (Login) y la autorización (Permisos de ruta).
 */

@Configuration 
@EnableWebSecurity 
public class SecurityConfig implements WebMvcConfigurer {

    // 1. DEPENDENCIA: Inyección del servicio que consulta la BD
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

   // ----------------------------------------------------
    // BEANS DE AUTENTICACIÓN (El "CÓMO" nos identificamos)
    // ----------------------------------------------------

    /**
     * Define el algoritmo de cifrado para las contraseñas.
     * Usamos BCrypt, que es el estándar actual de la industria.
     * Incluye "Salting" automático, haciendo que dos contraseñas iguales
     * tengan hashes diferentes en la BD.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); 
    }

    /**
     * Expone el AuthenticationManager como un Bean.
     * Este componente es el "Director" del proceso de login.
     * Es utilizado en 'AuthController' para verificar usuario/pass.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    /**
     * Configura el proveedor de autenticación DAO.
     * Une:
     * 1. El servicio de búsqueda de usuarios (userDetailsService).
     * 2. El codificador de contraseñas (passwordEncoder).
     * Spring usa esto internamente para validar las credenciales.
     */
    @Bean
public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService); // Carga servicio de BD
    provider.setPasswordEncoder(passwordEncoder());     // Usa el BCryptPasswordEncoder
    return provider;
    }

    // ----------------------------------------------------
    // FILTRO DE SEGURIDAD (El "QUIÉN" entra y a DÓNDE)
    // ----------------------------------------------------

    /**
     * Define la Cadena de Filtros de Seguridad (Security Filter Chain).
     * Es el "Firewall" de la aplicación. Configura qué peticiones pasan y cuáles no.
     * @param jwtAuthFilter filtro  que valida el Token.
     */
@Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtAuthFilter // <--- Spring lo inyecta como Bean
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
    // CONFIGURACIÓN DE CORS (Integración Frontend)
    // ----------------------------------------------------

    /**
     * Configuración Global de CORS (Cross-Origin Resource Sharing).
     * Permite que el Frontend (React en puerto 3000) hable con el Backend (puerto 8081).
     * Sin esto, el navegador bloquearía las peticiones por seguridad.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) { 
        registry.addMapping("/**") // Aplica a todos los endpoints
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000") // Origen del Frontend (React)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Métodos permitidos
                .allowedHeaders("*") // Cabeceras permitidas (incluyendo Authorization para JWT)
                .allowCredentials(true);
    }
}