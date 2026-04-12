# Documentación del Backend

Documentación técnica del servidor Spring Boot (API REST).

## Documentación OpenAPI (Swagger)

Con el perfil **`dev`** activo, el servidor expone **Swagger UI** para probar endpoints sin Postman:

```bash
# Ejemplo
set SPRING_PROFILES_ACTIVE=dev
.\mvnw.cmd spring-boot:run
```

- Interfaz: `http://localhost:8081/swagger-ui.html`.
- En **default** (`application.properties`) la UI está **desactivada** para no publicar el esquema de la API sin querer.

**Health (sin login):** `GET /actuator/health` — Comprobar que el servicio arrancó. (En código, Actuator va en una `SecurityFilterChain` propia con `@Order(1)` para que no quede detrás del JWT y devuelva **403** sin token.)

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
│   └── Diagramas/                   # Opcional: PNG viejos; ver README
│       └── README.md
└── README.md                        # Este archivo
```

**Diagramas mantenidos (Mermaid):** [docs/diagramas/README.md](../diagramas/README.md) — incluye casos de uso, clases, ACID, captura, arranque y daño (**secciones 13–18**).

## Fases del Proyecto

### Fase I: Seguridad y Autenticación
**Estado:** ✅ Completada

Implementación de:
- Arquitectura Stateless con JWT
- Cifrado BCrypt para contraseñas
- Filtro de autenticación `FiltroAutenticacionJwt`
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

**Diagrama:** [Algoritmo de daño Gen II (Mermaid)](../diagramas/README.md#18-algoritmo-de-daño-gen-ii)

---

### Fase III: Economía
**Estado:** ✅ Completada

Implementación de:
- Sistema transaccional atómico (`@Transactional`)
- Tienda de items
- Inventario del usuario
- Gestión de dinero

**Documentación:** `fases/Documentación FASE III.pdf`

**Diagramas:** [Compra ACID](../diagramas/README.md#15-compra-en-tienda-transaccional-acid) · [ER / modelo datos](../diagramas/README.md#12-modelo-de-datos-núcleo)

---

### Fase IV: Mecánica de Captura
**Estado:** ✅ Completada

Implementación de:
- Algoritmos de probabilidad (fieles a Pokémon Oro)
- Gestión de stock de Pokéballs
- Persistencia dinámica de capturas
- Cálculo de tasa de captura

**Documentación:** `fases/Documentación FASE IV.pdf`

**Diagrama:** [Captura y persistencia](../diagramas/README.md#16-captura-y-persistencia-del-pokémon-salvaje)

---

### Fase V: Data Seeding
**Estado:** ✅ Completada

Implementación de:
- Consumo reactivo de PokéAPI con `WebClient`
- Población automática de base de datos
- Carga de tipos, Pokémon y movimientos
- Inicialización al arranque del servidor

**Documentación:** `fases/Documentación FASE V.pdf`

**Diagrama:** [Arranque y carga de datos](../diagramas/README.md#17-arranque-del-servidor-y-carga-de-datos)

---

## Diagramas de arquitectura y dominio

Todo en un solo sitio (Mermaid, versionable con el código):

- **Capas Controller → Service → Repository:** [diagramas §5](../diagramas/README.md#5-capas-del-backend)
- **Casos de uso (resumen):** [diagramas §13](../diagramas/README.md#13-casos-de-uso)
- **Clases del dominio principal:** [diagramas §14](../diagramas/README.md#14-modelo-de-dominio-clases)

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
- `GET /api/v1/juego/estado` — Estado del jugador (equipo, dinero, mapa, posición, `estadoCliente`)
- `POST /api/v1/juego/starter` — Elegir Pokémon inicial (Johto)
- `GET /api/v1/juego/equipo` — Equipo actual
- `POST /api/v1/juego/guardar` — Guardar partida

Los objetos de **equipo** en las respuestas incluyen, `tipo1`, `tipo2` (si la especie tiene segundo tipo), HP, nivel, sprite y **stats de combate** (`ataque`, `defensa`, `ataqueEspecial`, `defensaEspecial`, `velocidad`) para alimentar la UI del cliente.

---

## Notas de Desarrollo

### Configuración
- Base de datos: `application.properties`
- JWT Secret: Variable de entorno `JWT_SECRET`
- Puerto: **8081** por defecto (`server.port` en `application.properties`, sobreescribible con `SERVER_PORT`)

### Testing
Desde la carpeta `pokemon-backend` (Windows):

```bash
.\mvnw.cmd test
```

### Build y arranque

```bash
.\mvnw.cmd clean verify
.\mvnw.cmd spring-boot:run
```

---

## Estado Actual

### Completado ✅
- Sistema de autenticación JWT
- Motor de batalla completo
- Sistema de economía (tienda + inventario)
- Mecánica de captura
- Data seeding automático
- **Persistencia de partida** vía `/api/v1/juego` (`estado`, `starter`, `equipo`, `guardar`) y DTO de equipo con tipos y stats para el front

### En Desarrollo 🚧
- Guardado tras batalla / tienda y sincronización completa con el estado del cliente
- Batallas PvP
- Sistema de intercambio

---

## Referencias

- [Spring Boot Docs](https://docs.spring.io/spring-boot/)
- [Spring Security](https://spring.io/projects/spring-security)
- [PokéAPI](https://pokeapi.co/)
- [Pokémon Damage Calculation](https://bulbapedia.bulbagarden.net/wiki/Damage)
