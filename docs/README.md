# Documentación del Proyecto

Esta carpeta agrupa **documentación**, **assets de diseño** y **herramientas** (p. ej. colección HTTP).

## Cómo está organizado

| Carpeta | Contenido |
|---------|-----------|
| **`referencia/`** |  **backend** y **diagramas Mermaid** (arquitectura, API, ER). |
| **`desarrollo/`** | Notas del día a día . |
| **`planning/`**, **`screenshots/`**, **`tiled/`** | Plan en texto, capturas para README, mapas fuente Tiled. |
| Raíz `docs/` | `api-tests.http`, este índice. |

## Estructura

```
docs/
├── referencia/
│   ├── backend/                 # Índice API, Swagger, tests, enlaces a fases (PDF)
│   │   └── README.md
│   └── diagramas/             # Diagramas Mermaid (fuente única)
│       └── README.md
│
├── desarrollo/
│   ├── MEJORAS_ARQUITECTURA.md
│   ├── NOTAS.md
│   └── ORGANIZACION.md
│
├── planning/
│   └── PLAN_POKEMON_ORO.txt
│
├── screenshots/
│   └── …                      # PNG para README / presentaciones
│
├── tiled/
│   ├── elm_lab.tmx
│   └── player_house.tmx
│
├── api-tests.http
├── .gitignore
└── README.md                  # Este archivo
```

## Archivos por categoría

### Referencia — backend

- Índice técnico: [referencia/backend/README.md](referencia/backend/README.md) (OpenAPI, `mvnw`, puerto, fases).

### Referencia — diagramas

- **Mermaid** (única fuente mantenida de diagramas técnicos): [referencia/diagramas/README.md](referencia/diagramas/README.md).

### Desarrollo

- [MEJORAS_ARQUITECTURA.md](desarrollo/MEJORAS_ARQUITECTURA.md): análisis y propuestas de refactorización.
- [NOTAS.md](desarrollo/NOTAS.md): estado del código, prioridades, bugs, registro por fecha.
- [ORGANIZACION.md](desarrollo/ORGANIZACION.md): cómo está ordenado `docs/` y el monorepo.

### Mapas (Tiled)

Los `.tmx` se editan con [Tiled Map Editor](https://www.mapeditor.org/):

- **elm_lab.tmx**: laboratorio del Prof. Elm.
- **player_house.tmx**: casa del jugador.

Para editar: abrir desde `docs/tiled/` → exportar JSON → colocar en `pokemon-frontend/public/assets/game/overworld/tiles/exports/` y registrar en `src/phaser/mapas/` y `EscenaPreload.js`

### Screenshots

Capturas para el README raíz y presentaciones;`docs/screenshots/`.

### API tests

- **api-tests.http**: peticiones de ejemplo (REST Client, Postman, etc.)

## Cómo usar

### Editar mapas

1. Instalar Tiled.
2. Abrir `.tmx` desde `docs/tiled/`.
3. Exportar JSON al directorio de exports del frontend.

### Probar la API

1. Arrancar el backend.
2. Abrir `docs/api-tests.http` en el IDE con REST Client.

### Añadir capturas

1. Capturar pantalla.
2. Guardar en `docs/screenshots/`.

## Notas

- Los **TMX** son la fuente de verdad de los mapas; los **JSON exportados** no se editan a mano.
- Preferir **PNG** para screenshots.
