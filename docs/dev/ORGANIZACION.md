# Organización de Archivos

Reorganización de la estructura de documentación del proyecto.

## Cambios Realizados

### Antes
```
root/
├── docs/
│   ├── elm_lab.tmx                    ❌ Suelto
│   ├── player_house.tmx               ❌ Suelto
│   ├── MEJORAS_ARQUITECTURA.md        ❌ Suelto
│   ├── NOTAS.md                       ❌ Suelto
│   ├── planning/
│   └── screenshots/
└── test-api.http                      ❌ En raíz
```

### Después
```
root/
├── docs/
│   ├── dev/                           ✅ Documentación de desarrollo
│   │   ├── MEJORAS_ARQUITECTURA.md
│   │   ├── NOTAS.md
│   │   └── ORGANIZACION.md
│   │
│   ├── tiled/                         ✅ Mapas fuente
│   │   ├── elm_lab.tmx
│   │   └── player_house.tmx
│   │
│   ├── planning/                      ✅ Planificación
│   │   └── PLAN_PARTE_1_POKEMON_ORO.txt
│   │
│   ├── screenshots/                   ✅ Capturas
│   │   ├── landing.png
│   │   ├── titulo.png
│   │   ├── oak.png
│   │   └── nombre.png
│   │
│   ├── api-tests.http                 ✅ Tests API
│   ├── README.md                      ✅ Índice de docs
│   └── .gitignore                     ✅ Ignorar temporales
```

## Estructura por Categoría

### 📝 Desarrollo (`docs/dev/`)
Documentación técnica y notas de desarrollo:
- **MEJORAS_ARQUITECTURA.md**: Análisis y propuestas de refactorización
- **NOTAS.md**: TODOs, bugs, ideas sueltas
- **ORGANIZACION.md**: Este archivo

### 🗺️ Mapas (`docs/tiled/`)
Archivos fuente de Tiled Map Editor (`.tmx`):
- **elm_lab.tmx**: Laboratorio del Prof. Elm
- **player_house.tmx**: Casa del jugador

Workflow:
1. Editar en Tiled
2. Exportar como JSON
3. `pokemon-frontend/public/assets/maps/`

### 📋 Planificación (`docs/planning/`)
Documentos de planificación del proyecto:
- **PLAN_POKEMON_ORO.txt**: Plan inicial

### 📸 Screenshots (`docs/screenshots/`)
Capturas de pantalla para README y presentaciones

### 🧪 Tests API (`docs/api-tests.http`)
Colección de requests HTTP para testear el backend (anteriormente sin registrar por "postman")


## Archivos Ignorados

El `.gitignore` en docs ignora:
- Archivos temporales de Tiled (`*.tmx~`, `*.tmx.bak`)
- Archivos de sistema (`.DS_Store`, `Thumbs.db`)
- Temporales de edición (`*.tmp`, `*~`)

## Próximos Pasos

- [ ] Añadir más mapas TMX cuando los cree
- [ ] Mantener **NOTAS.md** al día con el código (batalla, guardado, mapas)
- [ ] Crear diagramas de arquitectura
