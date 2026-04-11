# Pokémon Bytes — Frontend

Cliente **React 19 + Vite** con **Phaser 3** embebido (overworld, batalla, menús) y estado en **Zustand**.

## Documentación principal

- Estado del proyecto, stack y alcance: [README del monorepo](../README.md)
- Notas de desarrollo, bugs y prioridades: [`docs/dev/NOTAS.md`](../docs/dev/NOTAS.md)
- API backend (incl. OpenAPI con perfil `dev`): [`docs/backend/README.md`](../docs/backend/README.md)

## Arranque local

Desde esta carpeta:

```bash
npm install
npm run dev
```


## Piezas recientes

- **Menú in-game:** `src/components/game/MenuIngameReact.jsx` (overlay React) junto a `EscenaMenu` en Phaser.
- **Diálogo overworld:** `src/phaser/sistemas/SistemaDialogo.js` y `src/phaser/utils/marcoDialogoRetro.js` (incluye nombre de hablante).
- **Lógica por mapa:** `src/phaser/mapas/` (`casaJugador.js`, `labElm.js`, `johtoOverworld.js`, etc.).
- **Mapas Tiled exportados:** `public/assets/game/overworld/tiles/exports/` (no editar JSON a mano NUNCA DE LOS NUNCAS; fuente `.tmx` bajo `docs/tiled/`).

---

Plantilla Vite/React: [vitejs.dev](https://vitejs.dev/), [react.dev](https://react.dev/).
