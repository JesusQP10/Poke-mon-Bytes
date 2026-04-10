# Reorganización Completa de Documentación

## Resumen

TODA la documentación del proyecto (frontend + backend) la he organizado  bajo `docs/`.

## Cambios Realizados

### 1. Documentación del Backend

**Antes:**
```

pokemon-backend/
└── Documentación-fases/         
    ├── Documentación FASE I.pdf
    ├── Documentación FASE II.pdf
    ├── Documentación FASE III.pdf
    ├── Documentación FASE IV.pdf
    ├── Documentación FASE V.pdf
    └── Diagramas/
```

**Ahora:**
❌ Dentro del código del backend (Sirve de guía, no aconsejo tomarlo literal, debido a varias refactorizaciones).
Son fases primitivas del desarrollo, donde no tenia tanto conocimiento.
```
docs/
└── backend/                       ✅ Centralizado en docs/
    ├── fases/
    │   ├── Documentación FASE I.pdf
    │   ├── Documentación FASE II.pdf
    │   ├── Documentación FASE III.pdf
    │   ├── Documentación FASE IV.pdf
    │   ├── Documentación FASE V.pdf
    │   └── Diagramas/
    └── README.md                  ✅ Índice de backend
```

**Acción:** COPIADO (no movido, el original sigue en backend)

---

### 2. Estructura Final Completa

```
docs/
├── backend/                       ✅ Documentación del backend
│   ├── fases/                    # PDFs de las 5 fases
│   │   ├── Documentación FASE I.pdf
│   │   ├── Documentación FASE II.pdf
│   │   ├── Documentación FASE III.pdf
│   │   ├── Documentación FASE IV.pdf
│   │   ├── Documentación FASE V.pdf
│   │   └── Diagramas/            # 8 diagramas UML/arquitectura
│   └── README.md                 # Índice de backend
│
├── dev/                           ✅ Documentación de desarrollo
│   ├── MEJORAS_ARQUITECTURA.md   # Propuestas de refactorización personales
│   ├── NOTAS.md                  # TODOs y notas personales
│   ├── ORGANIZACION.md           # Explicación de estructura
│   └── REORGANIZACION_COMPLETA.md # Este archivo
│
├── planning/                      ✅ Planificación
│   └── PLAN_POKEMON_ORO.txt
│
├── screenshots/                   ✅ Capturas de pantalla
│   ├── landing.png
│   ├── titulo.png
│   ├── oak.png
│   └── nombre.png
│
├── tiled/                         ✅ Mapas fuente (Tiled Editor)
│   ├── elm_lab.tmx
│   └── player_house.tmx
│
├── api-tests.http                 ✅ Tests de la API
├── .gitignore                     ✅ Ignorar temporales
└── README.md                      ✅ Índice general
```

---

## Checklist

- [x] Copiar documentación del backend a docs/
- [x] Crear README.md en docs/backend/
- [x] Actualizar docs/README.md
- [x] Crear scripts de commit seguro
- [x] Documentar la reorganización
- [ ] Decidir si eliminar original del backend
