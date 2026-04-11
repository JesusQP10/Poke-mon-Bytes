# Documentación del Proyecto

Esta carpeta contiene toda la documentación, assets de diseño y archivos de desarrollo del proyecto Pokémon Bytes.

## Estructura

```
docs/
├── backend/                      # Documentación del backend (Spring Boot)
│   ├── fases/                   # Documentación por fases del proyecto
│   │   ├── Documentación FASE I.pdf    # Seguridad y JWT
│   │   ├── Documentación FASE II.pdf   # Motor de Batalla
│   │   ├── Documentación FASE III.pdf  # Economía
│   │   ├── Documentación FASE IV.pdf   # Captura
│   │   ├── Documentación FASE V.pdf    # Data Seeding
│   │   └── Diagramas/           # Diagramas UML y arquitectura
│   └── README.md                # Índice de documentación backend
│
├── dev/                          # Documentación de desarrollo
│   ├── MEJORAS_ARQUITECTURA.md  # Propuesta de refactorización del código
│   ├── NOTAS.md                 # Notas personales y TODOs
│   ├── ORGANIZACION.md          # Explicación de la estructura
│   ├── PRE_COMMIT_CHECK.md      # Verificación antes de commitear
│   ├── SAFE_COMMIT.ps1          # Script de commit seguro (Windows)
│   └── SAFE_COMMIT.sh           # Script de commit seguro (Linux/Mac)
│
├── planning/                     # Planificación del proyecto
│   └── PLAN_PARTE_1_POKEMON_ORO.txt  # Plan inicial del juego
│
├── screenshots/                  # Capturas para README / presentaciones (renovar cuando cambie la UI)
│   ├── player_room.png           # Interior habitación (Tiled)
│   ├── ejemplo_combate.png       # Escena de batalla (API)
│   ├── captura-dialogo-mama.png
│   ├── captura-dialogo-profesor-elm.png
│   ├── captura-menu-principal.png
│   ├── captura-equipo-pokemon.png
│   ├── captura-ficha-totodile.png
│   ├── captura-mochila.png
│   ├── captura-opciones.png
│   └── captura-guardado.png
│
├── tiled/                        # Archivos fuente de Tiled Map Editor
│   ├── elm_lab.tmx              # Laboratorio del Prof. Elm
│   └── player_house.tmx         # Casa del jugador
│
├── api-tests.http               # Tests de la API REST (usar con REST Client)
├── .gitignore                   # Ignorar archivos temporales
└── README.md                    # Este archivo

```

## Archivos por Categoría

### 🏗️ Backend
- **fases/**: Documentación técnica de las 5 fases del proyecto (PDFs)
- **Diagramas/**: Diagramas UML, arquitectura, secuencia, ER, etc.

Ver detalles en: `backend/README.md`

### 📝 Desarrollo
- **MEJORAS_ARQUITECTURA.md**: Análisis de problemas del código actual y soluciones propuestas (managers, slices, logging)
- **NOTAS.md**: Estado del código frente a la doc (incluye registro por fecha), prioridades, bugs y referencias. Convive con el resumen del [`README.md`](../README.md) en la raíz del repo.

### 🗺️ Mapas (Tiled)
Los archivos `.tmx` son mapas editables con [Tiled Map Editor](https://www.mapeditor.org/):
- **elm_lab.tmx**: Laboratorio donde se elige el starter
- **player_house.tmx**: Casa del jugador (planta baja)

Para editar: Abrir con Tiled → Exportar como JSON → Colocar los `.json` en `pokemon-frontend/public/assets/game/overworld/tiles/exports/` (y registrar la clave en `src/phaser/mapas/` —p. ej. `index.js` y el módulo del mapa— y en `EscenaPreload.js` para assets nuevos).

**Código overworld reciente:** parte de la lógica por mapa vive en `pokemon-frontend/src/phaser/mapas/` (casa, laboratorio, exteriores) para no concentrar todo en `EscenaOverworld.js`.

### 📸 Screenshots
Capturas de pantalla para el README principal y presentaciones

### 🧪 API Tests
- **api-tests.http**: Colección de requests HTTP para testear el backend
  - Usar con extensión REST Client de VS Code
  - O importar en Postman

## Cómo Usar

### Editar Mapas
1. Instalar [Tiled](https://www.mapeditor.org/)
2. Abrir archivo `.tmx` desde `docs/tiled/`
3. Editar capas, objetos, propiedades
4. Exportar como JSON: File → Export As → JSON
5. Guardar en `pokemon-frontend/public/assets/game/overworld/tiles/exports/`

### Testear API
1. Instalar extensión "REST Client" en IDE
2. Abrir `docs/api-tests.http`
3. Click en "Send Request" sobre cada petición
4. Ver respuestas en el panel lateral

### Añadir Screenshots
1. Capturar pantalla del juego
2. Guardar en `docs/screenshots/`
3. Actualizar README.md con la nueva imagen

## Notas

- Los archivos TMX son la fuente de verdad para los mapas
- Los JSON exportados NO se deben editar manualmente NUNCA DE NUNCA DE LOS NUNCAS
- Las screenshots deben ser PNG para mejor calidad
- Los tests HTTP requieren que el backend esté corriendo en `localhost:8080`
