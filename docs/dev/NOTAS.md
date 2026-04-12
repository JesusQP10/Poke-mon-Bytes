# Notas de Desarrollo

## Registro

- Actualización de documentación **11-04-2026**:
  - **Menú in-game en React** (`components/game/MenuIngameReact.jsx` / `.css`): equipo, mochila, guardado; detalle de Pokémon con stats y tipos; **mini sprites** de iniciales y URLs de retrato en `src/assets/pokemon/starters/portraitUrls.js`; datos de especie vía **`src/services/pokemonDetallePokeapi.js`**; fallback de stats en `config/statsCombateMenuFallback.js`.
  - **Diálogo overworld retro** (`SistemaDialogo.js`, `marcoDialogoRetro.js`) con **etiqueta de hablante** y opciones de ritmo en `config/opcionesCliente.js`.
  - **Overworld:** lógica de mapas extraída a **`src/phaser/mapas/`** (`index.js`, `casaJugador.js`, `labElm.js`, `johtoOverworld.js`, `placeholders.js`, `constantes.js`, `dialogosPostStarter.js`); confirmación de starter en **`UIConfirmacionStarter.js`**.
  - **Backend:** en el mapeo de equipo (`JuegoService`), el DTO por Pokémon incluye **`tipo1` / `tipo2`** y campos de **stats** (`ataque`, `defensa`, `ataqueEspecial`, `defensaEspecial`, `velocidad`) además de HP, nivel y sprite.
- Próximas ideas de trabajo: sala de depuración (debugger room) / retocar mapas; **Ruta 29 pendiente**.

---

## Cosas por hacer

- [ ] **Batalla en cliente:** cerrar el ciclo completo (fin de combate, HP en store y en servidor, huida, estados, mensajes).
- [ ] **Encuentros:** afinar tablas por mapa y balance; más especies si aplica.
- [ ] **Progresión:** experiencia y subida de nivel persistida donde toque.
- [ ] **Más mundo:** **Ruta 29 (contenido)** cuando toque, luego Ruta 30, Ciudad Violeta, interiores (Pokécenter, tienda) — opcional a medio/largo plazo.
- [ ] **Tienda / Pokédex** enlazadas al flujo overworld según diseño de juego.

---

## Lo que ya está implementado

### Backend (Spring)

- Autenticación **JWT** y usuario en BD.
- Motor de batalla Gen II, economía, captura, seeding PokéAPI (ver `README` raíz).
- **Estado de partida y equipo del jugador:**
  - `GET /api/v1/juego/estado` — equipo, dinero, `mapaActual`, `posX`/`posY`, blob `estadoCliente` (JSON arbitrario del front).
  - `POST /api/v1/juego/starter` — starter Johto (IDs 152 / 155 / 158).
  - `GET /api/v1/juego/equipo`.
  - `POST /api/v1/juego/guardar` — persiste posición, mapa y blob `estadoCliente` (`JuegoService.guardarPartida`); **no modifica dinero** en BD (dinero vía tienda u otras rutas). Ver Javadoc en `JuegoController` / `JuegoService`.
  - Respuesta de **equipo**: tipos en inglés normalizados (`tipo1`, `tipo2` opcional) y **stats de combate** por Pokémon para el cliente (menú / UI).

### Frontend (Phaser + React + Zustand)

- Overworld con tilemaps Tiled exportados a JSON: habitación, casa, **Pueblo Origen** (`new-bark-town`), laboratorio Elm; placeholders si falla un asset.
- **`WarpSystem`:** warps desde capa `eventos` (propiedades `destino`, `posX`, `posY`, opcionales `spawnAt`, offsets).
- **`SistemaEncuentros`:** capa `hierba_alta` + JSON de encuentros en mapas exteriores configurados.
- **`EscenaBatalla`:** carga equipo y movimientos por API y ejecuta turnos vía **`ejecutarTurno`** (`PuenteApi.js`).
- **`usarJuegoStore`:** hidrata desde `/juego/estado`, construye payload de guardado, posición, inventario y flags en `estadoCliente`.
- **Menú in-game:** capa Phaser **`EscenaMenu`** + **overlay React** `components/game/MenuIngameReact.jsx` (equipo, mochila, guardado **local + servidor** si hay token).
- **`SistemaDialogo`:** caja de texto con marco reutilizable (`phaser/utils/marcoDialogoRetro.js`) y **nombre de hablante**.
- **Módulos de mapa** bajo `phaser/mapas/` para eventos y diálogos por ubicación (casa, laboratorio, Johto exterior, post-starter).
- Servicios `juego.servicios.js` y `PuenteApi.js` alineados con los endpoints anteriores.
- Diálogos: parte del contenido en `phaser/data/dialogos.json`.

---

## Cosas por hacer

- [ ] ~~Sistema de guardado en backend~~ → **Hecho** (API + front); falta qué se guarda tras batalla / tienda.
- [ ] ~~Implementar encuentros aleatorios~~ → **Base hecha** en mapas con hierba + JSON; falta ampliar y balancear.
- [ ] ~~Implementar movimientos de Pokémon~~ → **En batalla vía API**; falta UI completa y casos edge.

---

## Mejorar

- Separar la lógica de mapas en un MapaManager → **parcial / evolución:** configuración y carga siguen en `EscenaOverworld.js` + `WarpSystem`.
- Poner todos los diálogos en JSON → **en curso** (`dialogos.json` + módulos `phaser/mapas/*.js` + escenas).
- Dividir el store en slices (jugador, mundo, inventario, narrativa).
- Logger estructurado → **HECHO**.

---

## Assets pendientes

- Sprites de batalla de los starters
- Música de batalla (hay BGM cargado en preload)
- Efectos de sonido (pasos, menú, etc.) — opcional
- Sprites de NPCs (hay placeholders / sheets básicos en varios mapas)
- Tilesets de interiores adicionales (Pokécenter, Tienda)

---

## Bugs a arreglar

- A veces el jugador se queda atascado en las colisiones
- Placeholder PokeGear en secuencia de la madre

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

## Progreso actual

### Completado o avanzado 

- Auth JWT (front + back)
- Título, intro Oak, nombre, transición a overworld
- Mapas Tiled múltiples, warps, encuentros en hierba (donde hay datos)
- Diálogos, NPCs, secuencias (casa, Elm, etc.) con deuda técnica conocida
- Menú in-game (Phaser + **React**): equipo con stats/tipos, mini sprites de iniciales, mochila, guardar
- **Persistencia:** guardado en servidor (`/juego/guardar`) + localStorage; hidratación desde `/juego/estado`
- **Batalla:** escena conectada al backend por turnos (iteración en curso)

### En progreso

- Pulido de batalla end-to-end y sincronización con BD / store
- Colisiones y diálogos (bugs)
- Contenido de mapa y narrativa (incl. **Ruta 29** cuando la abordes; ahora mismo **no hay avance tuyo** en ese tramo)

### Pendiente (producto)

- Tienda usable desde overworld, inventario completo, Pokédex
- Más rutas y ciudades según plan
