# Pokemon Backend - Copilot Instructions

## Architecture Overview

**Tech Stack**: Spring Boot 3.5.7, Java 21, MySQL, JWT Authentication

**Core Layers** (see `src/main/java/com/proyecto/pokemon_backend/`):
- **Controller** (`/controller`): REST endpoints with JWT protection
- **Service** (`/service`): Business logic (Auth, Game calculations, API integration)
- **Model** (`/model`): JPA entities mapped to MySQL tables (Usuario, PokemonUsuario, Tipo, Ataques, etc.)
- **Repository** (`/repository`): Spring Data JPA interfaces for DB access
- **Security** (`/security`, `/config`, `/filter`): JWT token generation and HTTP filter chain
- **Component** (`/component`): Data initialization tasks (TipoInitializer loads Pokemon types on startup)

## Key Design Patterns

### 1. JWT Authentication Flow
- **Entry point**: `AuthController.java` with `/register` (201 CREATED) and `/login` (200 OK with token)
- **Token generation**: `JwtService.generateToken()` creates 24-hour tokens with HMAC-SHA
- **Validation**: `JwtAuthenticationFilter` extracts "Bearer {token}" from Authorization header, validates via `SecurityConfig`
- **Critical**: Token secret injected from `application.properties` via `@Value("${jwt.secret.key}")`
- **User model**: `Usuario.java` implements `UserDetails` interface for Spring Security integration

### 2. Request/Response Pattern
- All DTOs in `/dto/` (currently `RegistroRequest.java` for auth)
- Endpoints return `ResponseEntity<?>` with appropriate HTTP status codes
- Constructor injection for all dependencies (no `@Autowired` field injection)

### 3. Game Logic Separation
- Pure calculation service: `CalculoService.java` contains Pokemon combat formulas
- **Damage formula** (Gen II/III): `calcularDaño()` uses base stats, type effectiveness, randomization (85-100 variation)
- **Accuracy**: `verificaImpacto()` - probabilistic hit calculation
- **Critical hits**: `fueGolpeCritico()` - 6.25% base probability
- Type effectiveness multipliers (0.25x, 0.5x, 1x, 2x, 4x) managed via type matrix in `TipoInitializer`

### 4. Data Initialization
- `TipoInitializer` runs once on startup via `CommandLineRunner` interface
- Loads 17 Pokemon types (Gen II) with effectiveness matrix
- **Pattern**: Bean registered in `PokemonBackendApplication.java` main class
- Avoids reloading if data already exists (`tipoRepository.count()`)

## Critical Configuration

**Database** (`application.properties`):
```
server.port=8081
spring.datasource.url=jdbc:mysql://localhost:3306/pokemon_web_db
spring.jpa.hibernate.ddl-auto=validate  # Production: validate only, no auto-creation
```

**JWT**:
```
jwt.secret.key=ESTA_ES_LA_CLAVE_SECRETA_LARGA_DEL_PROYECTO_DAW_POKEMON_Y_DEBE_SER_ALFANUMERICA
```
- Must be alphanumeric, stored in `application.properties`
- Token expiration: 24 hours (86,400,000ms)

**Security**:
- BCrypt password encoding via `BCryptPasswordEncoder` bean
- CORS enabled in `SecurityConfig` (implements `WebMvcConfigurer`)
- Session management: `SessionCreationPolicy.STATELESS` (no cookies, JWT only)
- All endpoints under `/api/v1/**` require JWT except `/auth/register` and `/auth/login`

## Build & Test

**Maven commands** (from workspace root):
```bash
./mvnw clean package              # Full build with tests
./mvnw test -Dtest=CalculoServiceTest  # Run specific test
./mvnw spring-boot:run            # Run dev server on :8081
```

**Test location**: `src/test/java/com/proyecto/pokemon_backend/`
- Example: `CalculoServiceTest.java` validates damage calculation formula

## Common Workflows

1. **Add new endpoint**: Create method in `/controller/{Feature}Controller.java`, return `ResponseEntity<?>`, add @PostMapping/@GetMapping
2. **Add business logic**: Create service class in `/service/{Domain}Service.java`, inject repositories via constructor
3. **Add new Pokemon type**: Modify type matrix in `TipoInitializer.loadTipoMatrix()` using `addDebility()`, `addResistance()`, `addImmunity()` helpers
4. **Modify game balance**: Adjust constants in `CalculoService` (e.g., `EXPIRATION_TIME`, damage formula multipliers)

## Package Naming Convention

- Controllers: `*.controller.{Feature}Controller`
- Services: `*.service.{Domain}Service` or `*.service.api.ExternalApiService` or `*.service.logica.CalculoService`
- Models: `*.model.{EntityName}` (JPA @Entity classes)
- Repositories: `*.repository.{EntityName}Repository`
- DTOs: `*.dto.{RequestResponseName}`
- Components: `*.component.{ComponentName}` (initialization tasks, listeners)

## Database Schema Insight

Tables mapped to entities in `/model`:
- `USUARIOS` ← Usuario.java (username unique, passwordHash encrypted)
- `POKEMON_USUARIO` ← PokemonUsuario.java (user's caught Pokemon)
- `TIPOS` ← Tipo.java (17 types with effectiveness matrix)
- `ATAQUES` ← Ataques.java (moves/attacks with power/precision)
- `POKEDEX_MAESTRA` ← PokedexMaestra.java (base Pokemon species data)

Foreign keys link user data to base data (user has many pokemon, each pokemon has many moves).

## External Integration

- **PokeApi**: `PokeApiService.java` in `/service/api/` handles external Pokemon data fetching
- Pattern: Stateless service, likely uses `RestTemplate` or `WebClient`
- Cache Pokemon species details to avoid redundant API calls

## Important Notes

- **No role-based access control yet**: `Usuario.getAuthorities()` returns empty list - implement roles when needed
- **Password reset not implemented**: Users cannot change passwords after registration
- **Game state ephemeral**: `Usuario.mapaActual`, `posX`, `posY`, `dinero` fields exist but no persistence endpoints yet
- **Type effectiveness computed at request time**: Type matrix stored in DB, used for real-time damage calculations
