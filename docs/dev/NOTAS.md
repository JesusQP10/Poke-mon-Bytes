# Notas de Desarrollo

## Registro de sesión (2026-04-11)

- Actualización **solo de documentación**: Objetivo alinear este archivo y el `README.md` raíz con lo que **ya existe en código** (la doc llevaba meses desfasada).
- Próximas ideas de trabajo: sala de depuración (debugger room) / retocar mapas; **Ruta 29 pendiente** .

---

## Cosas por hacer (prioridad)

- [ ] **Batalla en cliente:** cerrar el ciclo completo (fin de combate, HP en store y en servidor, huida, estados, mensajes).
- [ ] **Encuentros:** afinar tablas por mapa y balance; más especies si aplica.
- [ ] **Progresión:** experiencia y subida de nivel persistida donde toque.
- [ ] **Más mundo:** **Ruta 29 (contenido)** cuando toque, luego Ruta 30, Ciudad Violeta, interiores (Pokécenter, tienda) — opcional a medio/largo plazo.
- [ ] **Tienda / Pokédex** enlazadas al flujo overworld según diseño de juego.

---

## Lo que ya está implementado (código real)

### Backend (Spring)

- Autenticación **JWT** y usuario en BD.
- Motor de batalla Gen II, economía, captura, seeding PokéAPI (ver `README` raíz).
- **Estado de partida y equipo del jugador:**
  - `GET /api/v1/juego/estado` — equipo, dinero, `mapaActual`, `posX`/`posY`, blob `estadoCliente` (JSON arbitrario del front).
  - `POST /api/v1/juego/starter` — starter Johto (IDs 152 / 155 / 158).
  - `GET /api/v1/juego/equipo`.
  - `POST /api/v1/juego/guardar` — persiste posición, mapa, dinero y `estadoCliente` (`JuegoService` / entidad `Usuario`).

### Frontend (Phaser + React + Zustand)

- Overworld con tilemaps Tiled exportados a JSON: habitación, casa, **Pueblo Origen** (`new-bark-town`), laboratorio Elm; placeholders si falla un asset.
- **Ruta 29:** en el repo existen `ruta-29` en preload/config y JSON de mapa/encuentros; **eso es cableado o borrador, no “tramo hecho”** hasta que trabajes diseño y jugabilidad ahí.
- **`WarpSystem`:** warps desde capa `eventos` (propiedades `destino`, `posX`, `posY`, opcionales `spawnAt`, offsets).
- **`SistemaEncuentros`:** capa `hierba_alta` + JSON de encuentros en mapas exteriores configurados.
- **`EscenaBatalla`:** carga equipo y movimientos por API y ejecuta turnos vía **`ejecutarTurno`** (Puente API).
- **`usarJuegoStore`:** hidrata desde `/juego/estado`, construye payload de guardado, posición, inventario y flags en `estadoCliente`.
- **Menú in-game (`EscenaMenu`):** guardado **local + servidor** si hay token.
- Servicios `juego.servicios.js` y `PuenteApi.js` alineados con los endpoints anteriores.
- Diálogos: parte del contenido en `phaser/data/dialogos.json` (convivencia con texto en código según mapa).

---

## Cosas por hacer

- [ ] ~~Sistema de guardado en backend~~ → **Hecho** (API + front); falta pulir qué se guarda tras batalla / tienda.
- [ ] ~~Implementar encuentros aleatorios~~ → **Base hecha** en mapas con hierba + JSON; falta ampliar y balancear.
- [ ] ~~Implementar movimientos de Pokémon~~ → **En batalla vía API**; falta UI completa y casos edge.

---

## Mejorar

- Separar la lógica de mapas en un MapaManager → **parcial / evolución:** configuración y carga siguen en `EscenaOverworld.js` + `WarpSystem`; ver `MEJORAS_ARQUITECTURA.md`.
- Poner todos los diálogos en JSON → **en curso** (`dialogos.json` + restos en escenas).
- Dividir el store en slices (jugador, mundo, inventario, narrativa).
- Logger estructurado → **HECHO** (según notas previas del proyecto).

---

## Assets pendientes

- Sprites de batalla de los starters
- Música de batalla (hay BGM cargado en preload; valorar sustitutos definitivos)
- Efectos de sonido (pasos, menú, etc.) — opcional
- Sprites de NPCs (hay placeholders / sheets básicos en varios mapas)
- Tilesets de interiores adicionales (Pokécenter, Tienda)

---

## Bugs a arreglar

- A veces el jugador se queda atascado en las colisiones
- El diálogo no se cierra correctamente en algunas ocasiones
- Elección de starter: opción cancelar inconsistente (ver README)
- Evento Elm: activación y posición en laboratorio según movimiento
- Placeholder PokeGear en secuencia de la madre (revisión de fidelidad al guion)

---

## Optimizaciones futuras

- Lazy loading de assets
- Comprimir sprites / sprite atlas
- Cachear mapas cargados

---

## Referencias

- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [Pokémon Gen 2 Mechanics](https://bulbapedia.bulbagarden.net/wiki/Damage)
- [Tiled Map Editor](https://www.mapeditor.org/)

---

## Progreso actual (resumen)

### Completado o muy avanzado ✓

- Auth JWT (front + back)
- Título, intro Oak, nombre, transición a overworld
- Mapas Tiled múltiples, warps, encuentros en hierba (donde hay datos)
- Diálogos, NPCs, secuencias (casa, Elm, etc.) con deuda técnica conocida
- Menú in-game (equipo/mochila/guardar básico)
- **Persistencia:** guardado en servidor (`/juego/guardar`) + localStorage; hidratación desde `/juego/estado`
- **Batalla:** escena conectada al backend por turnos (iteración en curso)

### En progreso

- Pulido de batalla end-to-end y sincronización con BD / store
- Colisiones y diálogos (bugs)
- Contenido de mapa y narrativa (incl. **Ruta 29** cuando la abordes; ahora mismo **no hay avance tuyo** en ese tramo)

### Pendiente (producto)

- Tienda usable desde overworld, inventario completo, Pokédex
- Más rutas y ciudades según plan
