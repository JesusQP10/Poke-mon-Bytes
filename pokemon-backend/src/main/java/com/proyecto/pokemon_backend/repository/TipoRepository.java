package com.proyecto.pokemon_backend.repository;

import com.proyecto.pokemon_backend.model.Tipo; // Asumimos que esta entidad ya está en el paquete 'model'
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repositorio de Acceso a Datos para la Matriz de Efectividad (Tabla de Tipos).
 * * Gestiona las consultas sobre la tabla 'TIPOS', que almacena las relaciones
 * de daño entre los distintos elementos (Fuego, Agua, Planta, etc.).
 * * Es fundamental para el 'BatallaService' y 'TipoService' al calcular el daño.
 */

public interface TipoRepository extends JpaRepository<Tipo, Integer> {
    
    /**
     * Consulta para el Motor de Batalla.
     * Busca el multiplicador de daño específico para una interacción entre dos tipos.
     * Spring Data JPA traduce esto automáticamente a SQL:
     * SELECT * FROM TIPOS WHERE ATACANTE = ? AND DEFENSOR = ?
     * @param atacante El tipo del movimiento que se está usando (ej: "Fuego").
     * @param defensor El tipo del Pokémon que recibe el golpe (ej: "Planta").
     * @return Optional con la entidad Tipo que contiene el multiplicador (ej: 2.0),
     * o vacío si la relación es neutra (1.0 por defecto en la lógica del servicio).
     */
    Optional<Tipo> findByAtacanteAndDefensor(String atacante, String defensor);
}
