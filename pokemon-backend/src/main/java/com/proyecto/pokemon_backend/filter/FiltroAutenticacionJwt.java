package com.proyecto.pokemon_backend.filter;

import com.proyecto.pokemon_backend.security.ServicioJwt;
import com.proyecto.pokemon_backend.service.ServicioDetallesUsuario;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro JWT que intercepta cada petición HTTP.
 *
 * Flujo:
 *   1. Extrae el token del header "Authorization: Bearer <token>".
 *   2. Valida la firma y la expiración.
 *   3. Si es válido, carga el usuario y lo registra en el SecurityContext.
 *   4. Pasa la petición al siguiente filtro de la cadena.
 *
 * Si el token es inválido o no existe, la petición continúa sin autenticar
 * y Spring Security devolverá 401 si el endpoint lo requiere.
 */
@Component
public class FiltroAutenticacionJwt extends OncePerRequestFilter {

    private final ServicioJwt jwtService;
    private final ServicioDetallesUsuario userDetailsService;

    public FiltroAutenticacionJwt(ServicioJwt jwtService, ServicioDetallesUsuario userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String username;

        try {
            username = jwtService.extraerNombreUsuario(token);
        } catch (Exception e) {
            // Token malformado o expirado — Spring Security manejará el 401
            filterChain.doFilter(request, response);
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.esTokenValido(token, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
