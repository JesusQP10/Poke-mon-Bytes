# Documentación del Backend

Documentación técnica del servidor Spring Boot (API REST).

## Documentación OpenAPI (Swagger)

Con el perfil **`dev`** activo, el servidor expone **Swagger UI** para probar endpoints sin Postman:

```bash
# Ejemplo (ajusta el puerto si usas SERVER_PORT)
set SPRING_PROFILES_ACTIVE=dev
.\mvnw.cmd spring-boot:run
```

- Interfaz: `http://localhost:8081/swagger-ui.html`.
- En **default** (`application.properties`) la UI está **desactivada** para no publicar el esquema de la API sin querer.

**Health (sin login):** `GET /actuator/health` — útil para comprobar que el servicio arrancó. (En código, Actuator va en una `SecurityFilterChain` propia con `@Order(1)` para que no quede detrás del JWT y devuelva **403** sin token.)

## Tests (`mvn test`)

- **Unitarios:** p. ej. `CalculoServiceTest`, `JuegoServiceTest` ( Mockito, sin red ni MySQL).
- **Smoke de contexto:** `PokemonBackendApplicationTests` con perfil **`test`** (H2 en memoria) y seeders de PokéAPI **mockeados** para no depender de red.

Desde la carpeta `pokemon-backend`: `.\mvnw.cmd test`

## Estructura

```
docs/backend/
├── fases/                           # Documentación por fases del proyecto
│   ├── Documentación FASE I.pdf    # Seguridad y Autenticación (JWT)
│   ├── Documentación FASE II.pdf   # Motor de Batalla
│   ├── Documentación FASE III.pdf  # Economía (Tienda e Inventario)
│   ├── Documentación FASE IV.pdf   # Mecánica de Captura
│   ├── Documentación FASE V.pdf    # Data Seeding (PokéAPI)
│   └── Diagramas/                   # Diagramas UML y de arquitectura
│       ├── Diagrama de Arquitectura Modular del Backend.png
│       ├── Diagrama de Casos de Uso del Sistema.png
│       ├── Diagrama de Clases UML del Modelo de Dominio.png
│       ├── Diagrama de Secuencia Flujo Transaccional (ACID).png
│       ├── Diagrama de Secuencia Lógica de Persistencia Dinámica.png
│       ├── ER Relación de Inventario.png
│       ├── Esquema de Entradas, Variables y Salidas del Algoritmo de Cálculo de Daño.png
│       └── Cronograma de Rendimiento (Gantt).png
└── README.md                        # Este archivo
```

## Fases del Proyecto

### Fase I: Seguridad y Autenticación
**Estado:** ✅ Completada

Implementación de:
- Arquitectura Stateless con JWT
- Cifrado BCrypt para contraseñas
- Filtro de autenticación `JwtAuthenticationFilter`
- Endpoints de registro y login

**Documentación:** `fases/Documentación FASE I.pdf`

---

### Fase II: Motor de Batalla
**Estado:** ✅ Completada

Implementación de:
- Fórmulas de daño reales (Gen II)
- Matriz de tipos (efectividad x4.0 a x0.0)
- Gestión de estados alterados
- Sistema de turnos

**Documentación:** `fases/Documentación FASE II.pdf`

**Diagramas:**
- Esquema del Algoritmo de Cálculo de Daño

---

### Fase III: Economía
**Estado:** ✅ Completada

Implementación de:
- Sistema transaccional atómico (`@Transactional`)
- Tienda de items
- Inventario del usuario
- Gestión de dinero

**Documentación:** `fases/Documentación FASE III.pdf`

**Diagramas:**
- Diagrama de Secuencia Flujo Transaccional (ACID)
- ER Relación de Inventario

---

### Fase IV: Mecánica de Captura
**Estado:** ✅ Completada

Implementación de:
- Algoritmos de probabilidad (fieles a Pokémon Oro)
- Gestión de stock de Pokéballs
- Persistencia dinámica de capturas
- Cálculo de tasa de captura

**Documentación:** `fases/Documentación FASE IV.pdf`

**Diagramas:**
- Diagrama de Secuencia Lógica de Persistencia Dinámica

---

### Fase V: Data Seeding
**Estado:** ✅ Completada

Implementación de:
- Consumo reactivo de PokéAPI con `WebClient`
- Población automática de base de datos
- Carga de tipos, Pokémon y movimientos
- Inicialización al arranque del servidor

**Documentación:** `fases/Documentación FASE V.pdf`

**Diagramas:**
- Cronograma de Rendimiento (Gantt)

---

## Diagramas de Arquitectura

### Diagrama de Arquitectura Modular
Muestra la estructura en capas del backend:
- Controller (API REST)
- Service (Lógica de negocio)
- Repository (Persistencia)
- Model (Entidades JPA)

**Archivo:** `fases/Diagramas/Diagrama de Arquitectura Modular del Backend.png`

### Diagrama de Casos de Uso
Muestra los roles y funcionalidades del sistema:
- Usuario (Jugador)
- Sistema (Backend)
- Interacciones principales

**Archivo:** `fases/Diagramas/Diagrama de Casos de Uso del Sistema.png`

### Diagrama de Clases UML
Modelo de dominio completo con entidades JPA:
- Usuario
- Pokemon
- Movimientos
- Inventario
- Tipos

**Archivo:** `fases/Diagramas/Diagrama de Clases UML del Modelo de Dominio.png`

---

## Stack Tecnológico

- **Lenguaje:** Java 21
- **Framework:** Spring Boot 3.5.x
- **Base de Datos:** MySQL 8.0
- **Seguridad:** Spring Security 6 + JJWT
- **ORM:** Spring Data JPA
- **Build:** Maven
- **Testing:** JUnit 5

---

## Endpoints Principales

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Login (devuelve JWT)

### Batalla
- `POST /api/v1/batalla/iniciar` - Iniciar batalla
- `POST /api/v1/batalla/turno` - Ejecutar turno
- `POST /api/v1/batalla/capturar` - Intentar captura

### Tienda
- `GET /api/v1/tienda/items` - Listar items
- `POST /api/v1/tienda/comprar` - Comprar item

### Juego
- `GET /api/v1/juego/estado` - Estado del jugador
- `POST /api/v1/juego/guardar` - Guardar partida

---

## Notas de Desarrollo

### Configuración
- Base de datos: `application.properties`
- JWT Secret: Variable de entorno `JWT_SECRET`
- Puerto: 8080 (por defecto)

### Testing
```bash
# Ejecutar tests
mvn test

# Ejecutar con cobertura
mvn test jacoco:report
```

### Build
```bash
# Compilar
mvn clean install

# Ejecutar
mvn spring-boot:run
```

---

## Estado Actual

### Completado ✅
- Sistema de autenticación JWT
- Motor de batalla completo
- Sistema de economía (tienda + inventario)
- Mecánica de captura
- Data seeding automático

### En Desarrollo 🚧
- Sistema de guardado persistente
- Multiplayer (batallas PvP)
- Sistema de intercambio

### Pendiente 📋
- Sistema de logros
- Ranking de jugadores
- Chat en tiempo real
- Eventos especiales

---

## Referencias

- [Spring Boot Docs](https://docs.spring.io/spring-boot/)
- [Spring Security](https://spring.io/projects/spring-security)
- [PokéAPI](https://pokeapi.co/)
- [Pokémon Damage Calculation](https://bulbapedia.bulbagarden.net/wiki/Damage)
