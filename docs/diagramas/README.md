# Diagramas — Pokémon Bytes

Documentación visual del monorepo: **cliente React + Phaser**, **API Spring Boot** y **MySQL**.

## Índice

1. [Contexto del sistema](#1-contexto-del-sistema)
2. [Rutas del cliente (React Router)](#2-rutas-del-cliente-react-router)
3. [Cliente: React y Phaser](#3-cliente-react-y-phaser)
4. [Escenas Phaser (orden de registro)](#4-escenas-phaser-orden-de-registro)
5. [Capas del backend](#5-capas-del-backend)
6. [Spring Security: dos cadenas de filtros](#6-spring-security-dos-cadenas-de-filtros)
7. [Secuencia: inicio de sesión y JWT](#7-secuencia-inicio-de-sesión-y-jwt)
8. [Secuencia: petición autenticada](#8-secuencia-petición-autenticada)
9. [Secuencia: guardar partida](#9-secuencia-guardar-partida)
10. [Secuencia: turno de batalla](#10-secuencia-turno-de-batalla)
11. [Mapa de endpoints REST](#11-mapa-de-endpoints-rest)
12. [Modelo de datos (núcleo)](#12-modelo-de-datos-núcleo)
13. [Casos de uso](#13-casos-de-uso)
14. [Modelo de dominio clases](#14-modelo-de-dominio-clases)
15. [Compra en tienda transaccional ACID](#15-compra-en-tienda-transaccional-acid)
16. [Captura y persistencia del Pokémon salvaje](#16-captura-y-persistencia-del-pokémon-salvaje)
17. [Arranque del servidor y carga de datos](#17-arranque-del-servidor-y-carga-de-datos)
18. [Algoritmo de daño Gen II](#18-algoritmo-de-daño-gen-ii)

---

## 1. Contexto del sistema

```mermaid
flowchart TB
  subgraph Usuario["Jugador"]
    U[("Navegador")]
  end

  subgraph Cliente["SPA — Vite + React + Phaser"]
    R[React Router y UI]
    P[Phaser 160×144]
    R <--> P
  end

  subgraph Servidor["pokemon-backend — Spring Boot"]
    API[API REST :8081]
  end

  DB[(MySQL 8)]
  EXT["PokéAPI — seeding de catálogo"]

  U --> Cliente
  R -->|"HTTP + Bearer JWT"| API
  P -->|"HTTP + Bearer JWT"| API
  API --> DB
  API -.->|"WebClient al arranque / seed"| EXT
```



---

## 2. Rutas del cliente (React Router)

Fuente: `pokemon-frontend/src/router/EnrutadorAplicacion.jsx`.

```mermaid
flowchart LR
  A["/"] --> PI["PaginaInicio"]
  B["/iniciarSesion"] --> PA["PaginaAcceso"]
  C["/registrar"] --> PR["PaginaRegistro"]
  D["/game"] --> RP{"¿Sesión JWT en store?"}
  RP -->|"sí"| PJ["PaginaJuego"]
  RP -->|"no"| RED["Navigate → /iniciarSesion"]
  W["*"] --> H["Navigate → /"]
```



---

## 3. Cliente: React y Phaser

Resumen de cómo conviven la shell React y el juego Phaser en `/game`.

```mermaid
flowchart TB
  PJ["PaginaJuego"]
  PJ --> AP["EscenaApertura / intro React"]
  PJ --> CF["PantallaJuego + CanvasPhaser"]
  PJ --> MI["MenuIngameReact — overlay"]
  CF --> G["Phaser.Game — crearJuegoPhaser"]
  G --> REG["registry: callbacks hacia React"]
  REG -->|"onCambioPantalla"| PJ
  REG -->|"onTextoEstatico"| PJ
  REG -->|"onAbrirMenuIngame"| MI
  MI --> AX["Axios + interceptores JWT"]
  G --> PU["PuenteApi / servicios"]
  PU --> AX
  AX --> API["Backend REST"]
```



---

## 4. Escenas Phaser (orden de registro)

Fuente: `pokemon-frontend/src/phaser/PhaserJuego.js`. El flujo real entre escenas lo gobierna cada escena (`scene.start`, `launch`, etc.); este diagrama solo refleja el **orden de registro** en el motor.

```mermaid
flowchart LR
  E1["EscenaPreload"]
  E2["EscenaOverworld"]
  E3["EscenaBatalla"]
  E4["EscenaMenu"]
  E5["EscenaTransicion"]
  E1 --> E2
  E2 <--> E3
  E2 <--> E4
  E2 <--> E5
  E3 <--> E5
```



---

## 5. Capas del backend

Patrón típico Spring: controladores delgados, servicios con reglas, repositorios JPA.

```mermaid
flowchart TB
  C["Controllers\nBatalla, Juego, Tienda,\nControladorAutenticacion"]
  S["Services\nmotor batalla, juego,\ntienda, JWT, usuarios…"]
  R["Repositories\nRepositorioUsuario,\nRepositorioPokemonUsuario,\nRepositorioInventarioUsuario, …"]
  DB[(MySQL)]

  C --> S
  S --> R
  R --> DB
```



---

## 6. Spring Security: dos cadenas de filtros

Fuente: `pokemon-backend/.../config/ConfiguracionSeguridad.java`. **Orden menor = mayor prioridad** (`@Order(1)` antes que `@Order(2)`).

```mermaid
flowchart TB
  REQ["HTTP Request"]

  subgraph O1["@Order 1 — cadenaActuator"]
    M1["Matcher /actuator/**"]
    A1["CSRF off, stateless"]
    P1["anyRequest permitAll"]
  end

  subgraph O2["@Order 2 — cadenaFiltroSeguridad"]
    M2["Resto de rutas"]
    CORS["CORS — localhost / LAN dev"]
    JWT["FiltroAutenticacionJwt\nantes de UsernamePasswordAuthenticationFilter"]
    AUTH["DaoAuthenticationProvider +\nServicioDetallesUsuario"]
    RULES["authorizeHttpRequests"]
  end

  REQ --> M1
  M1 -->|"no coincide"| M2
  M1 -->|"coincide"| A1 --> P1

  M2 --> CORS --> JWT --> AUTH --> RULES
  RULES --> PUB["/auth/**, /api/v1/auth/**,\nOPTIONS /**, Swagger → permitAll"]
  RULES --> REST["anyRequest → authenticated"]
```



---

## 7. Secuencia: inicio de sesión y JWT

```mermaid
sequenceDiagram
  participant C as Cliente React
  participant A as ControladorAutenticacion
  participant AM as AuthenticationManager
  participant U as ServicioDetallesUsuario
  participant J as ServicioJwt

  C->>A: POST /auth/iniciarSesion
  A->>AM: authenticate credenciales
  AM->>U: loadUserByUsername
  U-->>AM: Usuario UserDetails
  AM-->>A: Authentication OK
  A->>J: generar token
  J-->>A: JWT string
  A-->>C: 200 + JWT en cuerpo / cabecera según implementación
  Note over C: El store guarda el token;\nAxios adjunta Authorization Bearer
```



---

## 8. Secuencia: petición autenticada

```mermaid
sequenceDiagram
  participant C as Cliente
  participant F as FiltroAutenticacionJwt
  participant J as ServicioJwt
  participant U as ServicioDetallesUsuario
  participant CTL as Controller

  C->>F: GET /api/v1/... + Authorization Bearer
  F->>J: validar y extraer subject
  J-->>F: claims OK
  F->>U: loadUserByUsername
  U-->>F: UserDetails
  F->>F: SecurityContextHolder.setAuthentication
  F->>CTL: filterChain.doFilter
  CTL-->>C: 200 + JSON
```



---

## 9. Secuencia: guardar partida

Representación simplificada de `POST /api/v1/juego/guardar` (mapa, posición, dinero, JSON de estado del cliente).

```mermaid
sequenceDiagram
  participant C as Cliente Zustand / Phaser
  participant JC as JuegoController
  participant JS as JuegoService
  participant RU as RepositorioUsuario

  C->>JC: POST /api/v1/juego/guardar + JWT
  JC->>JS: JuegoService.guardarPartida
  JS->>RU: persistir Usuario mapa, pos, estadoClienteJson
  RU-->>JS: persistido
  JS-->>JC: resultado
  JC-->>C: 200 confirmación / DTO
```



---

## 10. Secuencia: turno de batalla

Flujo típico: movimientos del Pokémon activo y resolución de turno.

```mermaid
sequenceDiagram
  participant C as EscenaBatalla
  participant BC as BatallaController
  participant BS as BatallaService

  C->>BC: GET /api/v1/batalla/movimientos/{id}
  BC->>BS: movimientos del Pokémon
  BS-->>BC: lista
  BC-->>C: movimientos

  C->>BC: POST /api/v1/batalla/turno + payload
  BC->>BS: resolver turno Gen II
  BS-->>BC: estado nuevo HP efectividad etc
  BC-->>C: resultado turno
```



---

## 11. Mapa de endpoints REST

Resumen por controlador. El **mindmap** de Mermaid falla en muchos visores; aquí va un **flowchart** (mejor soporte) más una **tabla** con las rutas exactas.

### Tabla de rutas


| Área     | Método | Ruta                                             | Auth |
| -------- | ------ | ------------------------------------------------ | ---- |
| Actuator | GET    | `/actuator/health`                               | No   |
| Auth     | POST   | `/auth/registrar`                                | No   |
| Auth     | POST   | `/auth/iniciarSesion`                            | No   |
| Juego    | GET    | `/api/v1/juego/estado`                           | JWT  |
| Juego    | GET    | `/api/v1/juego/equipo`                           | JWT  |
| Juego    | POST   | `/api/v1/juego/starter`                          | JWT  |
| Juego    | POST   | `/api/v1/juego/guardar`                          | JWT  |
| Juego    | POST   | `/api/v1/juego/reiniciar`                        | JWT  |
| Juego    | POST   | `/api/v1/juego/inventario/anadir`                | JWT  |
| Batalla  | GET    | `/api/v1/batalla/movimientos/{pokemonUsuarioId}` | JWT  |
| Batalla  | POST   | `/api/v1/batalla/turno`                          | JWT  |
| Batalla  | POST   | `/api/v1/batalla/captura`                        | JWT  |
| Batalla  | POST   | `/api/v1/batalla/salvaje/preparar`               | JWT  |
| Batalla  | POST   | `/api/v1/batalla/salvaje/liberar`                | JWT  |
| Tienda   | POST   | `/api/v1/tienda/comprar`                         | JWT  |


```mermaid
flowchart TB
  subgraph ACT["Actuator"]
    H["GET /actuator/health"]
  end
  subgraph AUTH["Auth"]
    R["POST /auth/registrar"]
    L["POST /auth/iniciarSesion"]
  end
  subgraph JUE["Juego JWT"]
    J1["GET /api/v1/juego/estado"]
    J2["GET /api/v1/juego/equipo"]
    J3["POST /api/v1/juego/starter"]
    J4["POST /api/v1/juego/guardar"]
    J5["POST /api/v1/juego/reiniciar"]
    J6["POST /api/v1/juego/inventario/anadir"]
  end
  subgraph BAT["Batalla JWT"]
    B1["GET /api/v1/batalla/movimientos/id"]
    B2["POST /api/v1/batalla/turno"]
    B3["POST /api/v1/batalla/captura"]
    B4["POST /api/v1/batalla/salvaje/preparar"]
    B5["POST /api/v1/batalla/salvaje/liberar"]
  end
  subgraph TIE["Tienda JWT"]
    T1["POST /api/v1/tienda/comprar"]
  end
```



> **Seguridad:** `ConfiguracionSeguridad` también marca como público el patrón `/api/v1/auth/`** ; hoy el controlador expuesto es `/auth/...`.

---

## 12. Modelo de datos (núcleo)

**ER** (entidades JPA + tabla auxiliar de PP). El mapeo real está en las clases bajo `pokemon-backend/.../model/` y en `RepositorioEstadoMovimientoPokemon` (JDBC).

### Diagrama entidad-relación

```mermaid
erDiagram
  USUARIOS ||--o{ POKEMON_USUARIO : "id_usuario"
  POKEDEX_MAESTRA ||--o{ POKEMON_USUARIO : "id_pokedex"
  USUARIOS ||--o{ INVENTARIO_USUARIO : "id_usuario"
  ITEMS ||--o{ INVENTARIO_USUARIO : "id_item"
  POKEMON_USUARIO ||--o{ POKEMON_MOVIMIENTOS_USUARIO : "id_pokemon_usuario"
  ATAQUES ||--o{ POKEMON_MOVIMIENTOS_USUARIO : "id_ataque"

  USUARIOS {
    int idUsuario PK
    string username
    string passwordHash
    int dinero
    string mapaActual
    int posX
    int posY
    string estadoClienteJson
  }

  POKEMON_USUARIO {
    int id PK
    int id_usuario FK
    int id_pokedex FK
    int nivel
    int hp_actual
    int hp_max
    int posicion_equipo
    int ataque_stat
    int defensa_stat
    int ataque_especial_stat
    int defensa_especial_stat
    int velocidad_stat
    string estado
    int turnos_confusion
    int contador_toxico
    int turnos_sueno
    int tiene_drenadoras
  }

  POKEDEX_MAESTRA {
    int id_pokedex PK
    string nombre
    string tipo_1
    string tipo_2
    int stat_base_hp
    int ratio_captura
  }

  ITEMS {
    int id_item PK
    string nombre
    int precio
    string efecto
  }

  INVENTARIO_USUARIO {
    int id_usuario PK
    int id_item PK
    int cantidad
  }

  ATAQUES {
    int id_ataque PK
    string nombre
    string tipo
    string categoria
    int potencia
    int precision_base
    int pp_base
  }

  POKEMON_MOVIMIENTOS_USUARIO {
    int id_pokemon_usuario PK
    int id_ataque PK
    int slot_index
    int pp_actual
  }

  TIPOS {
    int idTipo PK
    string atacante
    string defensor
    float multiplicador
  }
```



### Tabla auxiliar (JDBC, no JPA)


| Tabla                         | Uso                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `POKEMON_MOVIMIENTOS_USUARIO` | PP por movimiento y Pokémon; PK `(id_pokemon_usuario, id_ataque)`. Creada por `RepositorioEstadoMovimientoPokemon` si no existe. |


### Catálogo `TIPOS`

Filas de matriz atacante/defensor → multiplicador de daño. **Sin FK** hacia otras tablas: el motor consulta por nombres de tipo en runtime.

### Vista compacta (solo cardinalidad)

```mermaid
flowchart LR
  U[USUARIOS]
  P[POKEMON_USUARIO]
  D[POKEDEX_MAESTRA]
  I[INVENTARIO_USUARIO]
  T[ITEMS]
  M[POKEMON_MOVIMIENTOS_USUARIO]
  A[ATAQUES]
  U -->|1 N| P
  D -->|1 N| P
  U -->|1 N| I
  T -->|1 N| I
  P -->|1 N| M
  A -->|1 N| M
```



---

## 13. Casos de uso

Vista resumida del jugador frente a bloques de funcionalidad expuestos por la API (sin entrar en cada endpoint; el detalle está en la [sección 11](#11-mapa-de-endpoints-rest)).

```mermaid
flowchart TB
  J[Jugador / cliente SPA]
  subgraph API[Servidor Spring Boot]
    A[Auth registro y login]
    U[Juego estado equipo guardar]
    B[Batalla turnos captura]
    T[Tienda compra]
  end
  J --> A
  J --> U
  J --> B
  J --> T
```



---

## 14. Modelo de dominio clases

Relaciones lógicas alineadas con las entidades JPA principales (`com.proyecto.pokemon_backend.model`).

```mermaid
classDiagram
  direction TB
  class Usuario {
    Long idUsuario
    String username
    String passwordHash
    int dinero
    String mapaActual
    int posX
    int posY
    String estadoClienteJson
  }
  class PokemonUsuario {
    Long id
    Long usuarioId
    Integer pokedexId
    int nivel
    int hpActual
    int hpMax
    int posicionEquipo
  }
  class PokedexMaestra {
    Integer id_pokedex
    String nombre
    String tipo_1
    String tipo_2
  }
  class Item {
    Integer idItem
    String nombre
    int precio
    String efecto
  }
  class InventarioUsuario {
    long usuarioId
    int itemId
    int cantidad
  }
  Usuario "1" --> "*" PokemonUsuario : id_usuario
  PokedexMaestra "1" --> "*" PokemonUsuario : id_pokedex
  Usuario "1" --> "*" InventarioUsuario
  Item "1" --> "*" InventarioUsuario
```



---

## 15. Compra en tienda transaccional ACID

`TiendaService.comprarItem` está anotado con `@Transactional`: el descuento de dinero y el incremento de inventario comparten commit o rollback. Código: `pokemon-backend/.../service/TiendaService.java`.

```mermaid
sequenceDiagram
  participant C as Cliente
  participant TC as TiendaController
  participant TS as TiendaService
  participant RU as RepositorioUsuario
  participant RI as RepositorioInventarioUsuario
  participant JS as JuegoService

  C->>TC: POST /api/v1/tienda/comprar + JWT
  TC->>TS: comprarItem
  Note over TS: Una sola transacción
  TS->>RU: findByUsername
  TS->>RU: save dinero descontado
  TS->>RI: findById o nueva fila
  TS->>RI: save cantidad actualizada
  TS->>JS: listarInventarioDtos
  JS-->>TS: inventario DTO
  TS-->>TC: mensaje money inventario
  TC-->>C: 200 JSON
```



---

## 16. Captura y persistencia del Pokémon salvaje

`BatallaService.intentarCaptura`: descuenta la Ball, calcula RNG; si hay captura, reasigna `usuarioId` y `posicionEquipo` al jugador y persiste. Todo en `@Transactional`.

```mermaid
sequenceDiagram
  participant C as Cliente
  participant BC as BatallaController
  participant BS as BatallaService
  participant CS as CalculoService
  participant IR as RepositorioInventarioUsuario
  participant PR as RepositorioPokemonUsuario

  C->>BC: POST /api/v1/batalla/captura + JWT
  BC->>BS: intentarCaptura
  BS->>IR: save cantidad Ball -1
  BS->>CS: calcularCaptura
  CS-->>BS: boolean
  alt capturado
    BS->>PR: save salvaje con nuevo usuarioId y slot
  end
  BS-->>BC: mensaje texto
  BC-->>C: 200
```



---

## 17. Arranque del servidor y carga de datos

Orden de fases al levantar Spring Boot.

```mermaid
flowchart TB
  A[JVM] --> B[SpringApplication.run]
  B --> C[Contexto: Security JPA Web]
  C --> D[DataSource y esquema JPA]
  D --> E[Cargadores seed PokéAPI WebClient]
  E --> F[Tomcat / puerto configurado]
  F --> G[Listo para peticiones]
```



---

## 18. Algoritmo de daño Gen II

Entradas y salida según `CalculoService.calcularDanio` (comentario Javadoc en el código).

```mermaid
flowchart LR
  subgraph Entradas
    N[nivel atacante]
    A[ataqueStat]
    D[defensaStat]
    P[potencia movimiento]
    E[efectividad tipo]
    S[STAB boolean]
    Q[estado atacante]
    F[esFisico]
  end
  subgraph Salida
    R["int daño ≥ 1"]
  end
  Entradas --> L["CalculoService.calcularDanio"]
  L --> Salida
```



Fórmula resumida en código: `((0.2*N+1)*A*P/(D*25)+2) * STAB * E * V` con `V ∈ [0.85, 1.0)` y quemadura dividiendo ataque físico efectivo entre 2.

---

Referencias útiles:

- Seguridad y Swagger: [docs/backend/README.md](../backend/README.md)
- Tareas y bugs: [docs/dev/NOTAS.md](../dev/NOTAS.md)

