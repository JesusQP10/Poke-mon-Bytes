# Pokemon Backend — Copilot Instructions

## Architecture overview

**Stack:** Spring Boot **3.5.x** (parent BOM, p. ej. 3.5.13), **Java 21**, **MySQL**, **JWT** (JJWT), **Spring Data JPA**, **WebClient** (reactivo).

**Paquetes** (`src/main/java/com/proyecto/pokemon_backend/`):

- **`controller`**: REST (`ControladorAutenticacion`, `JuegoController`, `BatallaController`, `TiendaController`, …).
- **`service`**: reglas de negocio (`JuegoService`, `BatallaService`, `TiendaService`, `ServicioAutenticacion`, …) y **`service.logica.CalculoService`** (fórmulas puras).
- **`service.api`**: integración externa (**`ServicioPokeApi`** con **WebClient**).
- **`model`**: entidades JPA (`Usuario`, `PokemonUsuario`, `PokedexMaestra`, `Item`, `InventarioUsuario`, `Ataques`, `Tipo`, …).
- **`repository`**: prefijo español **`Repositorio*`** (Spring Data o JDBC, p. ej. `RepositorioEstadoMovimientoPokemon` para tabla auxiliar `POKEMON_MOVIMIENTOS_USUARIO`).
- **`config`**, **`filter`**, **`security`**: **`ConfiguracionSeguridad`**, **`FiltroAutenticacionJwt`**, **`ServicioJwt`**, codificador BCrypt, etc.
- **`component`**: varios **`CommandLineRunner`** al arranque (`CargadorDatos`, `InicializadorTipos`, `SembradorObjetos`, `SembradorUsuarioSalvajes`, …).

## JWT

- **Login / registro:** `ControladorAutenticacion` bajo **`/auth/registrar`** y **`/auth/iniciarSesion`** (públicos).
- **Token:** generado en **`ServicioJwt`** / flujo de **`ServicioAutenticacion`**; cabecera **`Authorization: Bearer …`**.
- **Validación HTTP:** **`FiltroAutenticacionJwt`** (OncePerRequestFilter) registrado en **`ConfiguracionSeguridad`** antes de `UsernamePasswordAuthenticationFilter`.
- **Usuario en contexto:** **`Usuario`** implementa **`UserDetails`**; **`ServicioDetallesUsuario`** carga por username.

## Seguridad y CORS

- **`ConfiguracionSeguridad`**: dos **`SecurityFilterChain`**: **`@Order(1)`** para **`/actuator/**`** sin JWT; **`@Order(2)`** para el resto (CORS en el propio `HttpSecurity`, sesión **STATELESS**, JWT en rutas autenticadas).
- Rutas públicas además de `/auth/**`: p. ej. **OPTIONS**, Swagger en perfil dev, etc. (ver código).

## Juego y persistencia

- **Estado de partida:** **`JuegoController`** bajo **`/api/v1/juego`** (`estado`, `equipo`, `starter`, `guardar`, `reiniciar`, `inventario/anadir`).
- **`guardarPartida`**: actualiza mapa/posición y JSON de cliente según implementación; **no sustituye dinero ni inventario desde el cuerpo del guardado** (dinero/inventario vía tienda y endpoints dedicados). Revisar Javadoc en **`JuegoService`**.

## Motor de batalla

- **`BatallaService`**: turnos, captura, salvajes, persistencia de HP/PP según diseño actual.
- **`CalculoService`**: **`calcularDanio`**, **`verificaImpacto`**, **`fueGolpeCritico`**, **`calcularCaptura`**, etc. (Gen II). Variación de daño: factor aleatorio **\[0.85, 1.0)** sobre la base, no “85–100” como porcentaje suelto.
- **Tipos:** matriz en tabla **`TIPOS`**; carga / coherencia con **`TipoService`** e **`InicializadorTipos`** (no existe clase `TipoInitializer`).

## Puerto y arranque

- Por defecto **`server.port=8081`** (configurable con **`SERVER_PORT`**).

Desde **`pokemon-backend/`** (Windows):

```bash
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

## DTOs y convenciones

- DTOs en **`dto`**: p. ej. **`SolicitudRegistro`**, **`SolicitudTurno`**, **`SolicitudCaptura`**, **`SolicitudCompra`**, **`RespuestaTurno`**, …
- Repositorios: nombre **`RepositorioXxx`**, no `UserRepository`.
- Inyección por **constructor** en servicios y controladores.

## Integración PokéAPI

- **`ServicioPokeApi`**: **WebClient** contra `https://pokeapi.co/api/v2/`.
- **`CargadorDatos`** (y otros runners): población de catálogos al arranque según el diseño actual.

## Notas

- **RBAC:** `Usuario.getAuthorities()` puede devolver lista vacía (autenticación binaria).
- **Reset de contraseña:** no implementado salvo que se añada explícitamente.
- **Estado de juego:** **sí** hay persistencia vía **`/api/v1/juego`** y tablas; ignorar cualquier nota antigua que diga que mapa/dinero “no persisten”.
