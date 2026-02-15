package com.proyecto.pokemon_backend.filter;

import com.proyecto.pokemon_backend.security.ServicioJwt;
import com.proyecto.pokemon_backend.service.ServicioDetallesUsuario;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro de Seguridad que intercepta CADA petición HTTP entrante.
 * * Extiende OncePerRequestFilter: Garantiza una única ejecución por petición.
 * * Función Principal:
 * 1. Buscar el header "Authorization".
 * 2. Extraer y validar el JWT.
 * 3. Si es válido, cargar al usuario en el SecurityContextHolder.
 * * Esto convierte la API en Stateless: No hay sesiones de servidor, la identidad
 * viaja en el token en cada request.
 */

@Component
public class FiltroAutenticacionJwt extends OncePerRequestFilter {

    private final ServicioJwt jwtService;
    private final ServicioDetallesUsuario userDetailsService;

    // Inyección de dependencias por constructor
    public FiltroAutenticacionJwt(ServicioJwt jwtService, ServicioDetallesUsuario userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Lógica interna del filtro.
     * @param request La petición HTTP entrante.
     * @param response La respuesta que se enviará.
     * @param filterChain La cadena de filtros restantes.
     */

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization"); 
        final String jwt;
        final String username;

        // 1. Si no hay token o no empieza por "Bearer ", pasamos al siguiente filtro
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); 
            return;
        }

        // 2. Extraer el Token y el username
        jwt = authHeader.substring(7); // Saltamos "Bearer "
        
        // CRÍTICO: Asegúrate de que ServicioJwt.extraerNombreUsuario está implementado y funciona
        try {
             username = jwtService.extraerNombreUsuario(jwt);
        } catch (Exception e) {
            // Si el token es inválido (expirado, firma mala, etc.), Spring manejará el 401 más tarde
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Si el usuario existe y NO está autenticado actualmente
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            UserDetails userDetails = this.userDetailsService.cargarUsuarioPorNombreUsuario(username);

            // 4. Validar el Token
            if (jwtService.esTokenValido(jwt, userDetails)) {
                
                // 5. Autenticar al usuario en el contexto de Spring Security
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // La contraseña ya no es necesaria aquí
                        userDetails.getAuthorities()
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken); 
            }
        }
        
        // 6. Continúa la cadena de filtros para que la petición llegue al controlador
        // Es obligatorio llamar a esto, si no, la petición se quedaría atascada aquí y nunca llegaría al Controller.
        filterChain.doFilter(request, response); 
    }
}

