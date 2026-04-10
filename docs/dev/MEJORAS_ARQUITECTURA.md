# Mejoras de Arquitectura

## Resumen

Conforme avanza el desarrolo he encontrado problemas en el código actual y creado una estructura más modular para solucionarlos(TODO IRA EN CONTINUA ACTUALIZACIÓN):

- Modularización: separar responsabilidades
- Mantenibilidad: código más fácil de entender
- Escalabilidad: fácil añadir mapas, NPCs y eventos
- Performance: mejor gestión de estado
- Debugging: sistema de logging

## Problemas encontrados

### 1. Duplicación de constantes
- TAM_TILE definido en 3 lugares
- Config de mapas hardcodeada en EscenaOverworld.js

### 2. EscenaOverworld.js muy grande
- 600+ líneas
- Mezcla mapas, NPCs, eventos, batallas, intro
- Difícil mantener

### 3. Store monolítico
- usarJuegoStore.js maneja demasiadas cosas
- Re-renders innecesarios

### 4. Diálogos hardcodeados
- Texto mezclado con lógica
- Difícil traducir

### 5. Falta logging estructurado
- console.log por todos lados
- Difícil debuggear

### 6. Sistema de eventos poco escalable
- Lógica hardcodeada
- Difícil añadir nuevos eventos

## Soluciones implementadas

### 1. Configuración centralizada

Antes tenía esto disperso:
```javascript
// En EscenaOverworld.js
const TAM_TILE = 16;
const CONFIG_MAPAS = { /* ... */ };
```

Ahora todo en un sitio:
```javascript
// phaser/config/mapas.config.js
export const CONFIG_MAPAS = { /* ... */ };
export function obtenerConfigMapa(mapaKey) { /* ... */ }
```

Ventajas:
- Una única fuente de verdad
- Fácil añadir mapas
- Validación centralizada

### 2. MapaManager

Antes todo en EscenaOverworld.js (200 líneas):
```javascript
_crearEscenaTilemap(mapaKey, tileX, tileY, configMapa) {
  // mucho código...
}
```

Ahora separado:
```javascript
// phaser/managers/MapaManager.js
const mapaManager = new MapaManager(scene);
const { mapa, capas, config } = mapaManager.cargarMapa('player-room');
```

Ventajas:
- Lógica separada
- Reutilizable
- Más fácil testear

### 3. DialogoManager

Antes hardcodeado:
```javascript
const lineas = [
  `¡${nombre}! Justo a tiempo.`,
  'Estoy investigando los Pokémon...',
];
this._dialogo.mostrar(lineas);
```

Ahora en JSON:
```javascript
// phaser/data/dialogos.json
{
  "elm_lab": {
    "elm_bienvenida": [
      "¡[JUGADOR]! Justo a tiempo.",
      "Estoy investigando los Pokémon..."
    ]
  }
}

// En código
dialogoManager.setVariables({ JUGADOR: nombre });
dialogoManager.mostrar('elm_lab.elm_bienvenida');
```

Ventajas:
- Fácil traducir
- Puedo editar diálogos sin tocar código
- Sistema de variables

### 4. Store modular con slices

Antes todo junto (200+ líneas):
```javascript
export const usarJuegoStore = create((set) => ({
  playerState: null,
  starter: null,
  team: [],
  mapaActual: 'player-room',
  posX: 5,
  inventario: [],
  pokegearEntregado: false,
  // ... 50+ propiedades
}));
```

Ahora separado por responsabilidad:
```javascript
// store/slices/jugadorSlice.js
export const crearJugadorSlice = (set, get) => ({
  nombreJugador: '',
  starter: null,
  team: [],
});

// store/slices/mundoSlice.js
export const crearMundoSlice = (set, get) => ({
  mapaActual: 'player-room',
  posX: 5,
  posY: 7,
});

// Uso optimizado
const { nombreJugador, team } = useJugador();
const { mapaActual, posX, posY } = useMundo();
```

Ventajas:
- Mejor organización
- Menos re-renders
- Más fácil mantener

### 5. Sistema de logging

Antes:
```javascript
console.log('[EscenaOverworld] Cargando mapa:', mapaKey);
console.warn('Error cargando tilemap');
```

Ahora:
```javascript
import { logger } from '@/utils/logger';

logger.mapa('Cargando mapa', { mapaKey, posX, posY });
logger.error('MapaManager', 'Error cargando tilemap', error);
```

Ventajas:
- Niveles de log (DEBUG, INFO, WARN, ERROR)
- Formato consistente
- Fácil filtrar

## Nueva estructura

```
src/
├── phaser/
│   ├── config/
│   │   ├── mapas.config.js
│   │   ├── animaciones.config.js
│   │   └── audio.config.js
│   │
│   ├── managers/
│   │   ├── MapaManager.js
│   │   ├── DialogoManager.js
│   │   ├── NpcManager.js
│   │   ├── EventoManager.js
│   │   └── AudioManager.js
│   │
│   ├── data/
│   │   ├── dialogos.json
│   │   ├── eventos.json
│   │   └── npcs.json
│   │
│   └── escenas/
│       └── EscenaOverworld.js (reducida)
│
├── store/
│   ├── slices/
│   │   ├── jugadorSlice.js
│   │   ├── mundoSlice.js
│   │   ├── inventarioSlice.js
│   │   └── narrativaSlice.js
│   └── usarJuegoStoreRefactorizado.js
│
└── utils/
    └── logger.js
```

## Plan de migración

Fase 1: Config (1-2h)
- [x] mapas.config.js
- [x] dialogos.json
- [ ] migrar constantes

Fase 2: Managers (3-4h)
- [x] MapaManager
- [x] DialogoManager
- [ ] NpcManager
- [ ] EventoManager
- [ ] AudioManager

Fase 3: Store (2-3h)
- [x] crear slices
- [x] store refactorizado
- [ ] migrar componentes React
- [ ] migrar escenas Phaser

Fase 4: Utils (1h)
- [x] logger
- [ ] reemplazar console.log

Fase 5: Testing (2-3h)
- [ ] testear mapas
- [ ] testear diálogos
- [ ] testear store
- [ ] testear flujo completo

## Métricas

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas EscenaOverworld.js | 600+ | ~200 | -66% |
| Archivos config | 0 | 3 | nuevo |
| Slices store | 1 | 4 | +300% |
| Sistema logging | no | sí | nuevo |
| Diálogos en JSON | 0% | 100% | nuevo |

## Ejemplos de uso

Cargar mapa:
```javascript
// Antes
this._crearEscenaTilemap(mapaKey, tileX, tileY, configMapa);

// Ahora
const mapaManager = new MapaManager(this);
const { mapa, capas, config } = mapaManager.cargarMapa('elm-lab');
mapaManager.configurarCamara(jugador);
```

Mostrar diálogo:
```javascript
// Antes
const lineas = [`¡${nombre}! Justo a tiempo.`, 'Estoy investigando...'];
this._dialogo.mostrar(lineas);

// Ahora
dialogoManager.setVariables({ JUGADOR: nombre });
dialogoManager.mostrar('elm_lab.elm_bienvenida');
```

Usar store:
```javascript
// Antes
const store = usarJuegoStore();
const nombre = store.nombreJugador;
const mapa = store.mapaActual;

// Ahora (optimizado)
const { nombreJugador, team } = useJugador();
const { mapaActual, posX } = useMundo();
```

Logging:
```javascript
// Antes
console.log('[EscenaOverworld] Cargando mapa:', mapaKey);

// Ahora
logger.mapa('Cargando mapa', { mapaKey, posX, posY });
```

## Checklist

Archivos creados:
- [x] phaser/config/mapas.config.js
- [x] phaser/managers/MapaManager.js
- [x] phaser/managers/DialogoManager.js
- [x] phaser/data/dialogos.json
- [x] store/slices/jugadorSlice.js
- [x] store/slices/mundoSlice.js
- [x] store/slices/inventarioSlice.js
- [x] store/slices/narrativaSlice.js
- [x] store/usarJuegoStoreRefactorizado.js
- [x] utils/logger.js

Archivos pendientes:
- [ ] phaser/managers/NpcManager.js
- [ ] phaser/managers/EventoManager.js
- [ ] phaser/managers/AudioManager.js
- [ ] phaser/data/eventos.json
- [ ] phaser/data/npcs.json
- [ ] phaser/config/animaciones.config.js
- [ ] phaser/config/audio.config.js

Archivos a refactorizar:
- [ ] phaser/escenas/EscenaOverworld.js (usar managers)
- [ ] phaser/entidades/Jugador.js (usar constants)
- [ ] components/game/EscenaApertura.jsx (usar store refactorizado)
- [ ] Reemplazar console.log por logger

## Próximos pasos

1. Revisar archivos creados
2. Crear managers faltantes
3. Refactorizar EscenaOverworld.js
4. Migrar componentes React
5. Reemplazar console.log
6. Testing

## Beneficios

- Onboarding más rápido
- Menos bugs
- Mejor performance
- Escalabilidad
- Mantenibilidad
- Debugging más fácil
