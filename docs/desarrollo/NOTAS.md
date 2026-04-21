# Notas de Desarrollo

## Registro

- **2026-04-21:** Sesión final de implementación.
  - `EscenaBatalla`: cambio de Pokémon voluntario (coste de turno) y forzado por KO; `_derrota()` detecta sustitutos vivos.
  - `batallaDebugDemostracion`: pool de 10 Johto aleatorios para `npc_captura` (nivel 2-5).
  - `JuegoService.equipoOrdenado`: filtrado a `posicionEquipo < 6` — límite de 6 Pokémon en equipo activo.
  - `EscenaOverworld`: selector de cantidad en tienda (↑↓ · Z comprar · X cancelar).
  - `MenuIngameReact`: slots de equipo compactados para caber en el panel; scroll virtual corregido.
  - `PuenteApi.comprarItem(id, cantidad)` ya aceptaba cantidad — solo faltaba la UI.
  - README raíz actualizado con estado final.

- **2026-04-20 / 21:** Escena de batalla cerrada.
  - Estados alterados en HUD (PAR/VEN/DOR…), sprites enemigo por pokedexId, PP reset al inicio.
  - Sync post-batalla (`sincronizarEstadoDesdeServidor`), HP > 0 al entrar en combate.
  - `BatallaController`: `DELETE /pp/{pokemonId}` para reset de PP.
  - `JuegoService`: limpia PP al curar en el Centro Pokémon.

- **2026-04-13 / 19:** Inventario, tienda y Centro Pokémon completos.
  - `POST /inventario/tirar`, `POST /inventario/usar` (HEAL_N, HEAL_MAX, CURE_*).
  - `EscenaOverworld`: `_flujoCurarCentroAsync()` y `_flujoTiendaDebuggerAsync()` conectados a NPCs.
  - `MenuIngameReact`: USAR / TIRAR con picker de Pokémon y selector de cantidad.
  - `BattleBag` + `BattleParty` para mochila y equipo en combate.
  - `.env.example` en raíz y `pokemon-frontend/`.

- **2026-04-12:** Reorganización `docs/` (`dev/` → `desarrollo/`, etc.). Menú in-game React completo (equipo, mochila, opciones, guardado). Diálogo overworld con hablante. Módulos de mapa en `phaser/mapas/`.

---

## Estado actual (2026-04-21) — PROYECTO COMPLETO

### Implementado y funcionando

| Módulo | Notas |
|--------|-------|
| Auth JWT | BCrypt + JWT 24 h, Spring Security stateless |
| Motor batalla Gen II | Daño, STAB, crítico, estados, PP, captura, huida, cambio Pokémon, KO forzado |
| Gestión partida | Guardar, cargar, reiniciar, starter, sync HP |
| Tienda | Catálogo + compra con selector de cantidad — backend + NPC overworld |
| Inventario | Añadir, tirar, usar (dentro y fuera de combate) |
| Centro Pokémon | Curar equipo activo (0-5) — endpoint + NPC enfermera |
| Equipo (límite 6) | `posicionEquipo ≥ 6` va a caja, no se muestra en equipo activo |
| Overworld | Mapas Tiled, NPCs, warps, encuentros, diálogos, sala debugger |
| Escena batalla | HUD React, picker movimientos/mochila/equipo, sync al salir |
| Menú in-game | Ficha entrenador, equipo, mochila (USAR/TIRAR), opciones, guardado |
| Pantalla título | Ho-Oh animado, música, Continuar / Nueva partida |
| Tests backend | 32 tests, 0 fallos |

### Descartado por tiempo

- Ruta 29 (código base presente, no es parte del alcance entregado)
- XP / nivelación visual
- Evolución
- Pokédex expandida

---

## Bugs conocidos

- A veces el jugador se queda atascado en colisiones (minor, no bloqueante)
- Placeholder PokeGear en secuencia de la madre

---

## Referencias

- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [Pokémon Gen 2 Mechanics](https://bulbapedia.bulbagarden.net/wiki/Damage)
- [Tiled Map Editor](https://www.mapeditor.org/)
