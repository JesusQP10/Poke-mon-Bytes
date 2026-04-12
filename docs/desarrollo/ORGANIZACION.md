# Organización de archivos (`docs/`)

Este archivo describe cómo está ordenada la **documentación** del monorepo (no el código de `pokemon-backend` ni `pokemon-frontend`).

## Estructura

```
docs/
├── referencia/              # Manual: backend (API, Swagger) + diagramas Mermaid
│   ├── backend/README.md
│   └── diagramas/README.md
├── desarrollo/              # Notas vivas: NOTAS, mejoras, este ORGANIZACION
├── planning/
├── screenshots/
├── tiled/
├── api-tests.http
├── README.md
└── .gitignore
```

## Por categoría

### Desarrollo (`docs/desarrollo/`)

- **MEJORAS_ARQUITECTURA.md**: análisis y propuestas de refactorización.
- **NOTAS.md**: TODOs, bugs, registro por fecha.
- **ORGANIZACION.md**: este archivo.

### Referencia (`docs/referencia/`)

- **backend/README.md**: Swagger, tests, enlaces a fases.
- **diagramas/README.md**: diagramas Mermaid (arquitectura, API, ER, secuencias).

### Mapas (`docs/tiled/`)

Workflow: editar en Tiled → exportar JSON → `pokemon-frontend/public/assets/game/overworld/tiles/exports/` y registrar en `src/phaser/mapas/` + `EscenaPreload.js`.

### Planificación (`docs/planning/`)

- **PLAN_POKEMON_ORO.txt**

### Screenshots (`docs/screenshots/`)

Capturas para el README raíz y presentaciones.

### Tests API (`docs/api-tests.http`)

Colección HTTP para probar el backend (REST Client, Postman, etc.).

## Ignorados en `docs/`

Ver `docs/.gitignore`: temporales de Tiled, `.DS_Store`, etc.

