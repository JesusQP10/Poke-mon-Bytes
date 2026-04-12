/**
 * Sala de pruebas / debugger (interior). Clave de mapa: `debugger-room`.
 * Ajusta posXInicio / posYInicio al tile donde debe aparecer el jugador sin warp.
 */
export const MAPAS_DEBUGGER_ROOM = ['debugger-room', 'debugger_room'];

/**
 * Mapa con dos tilesets: enlazar cada `name` del JSON a la textura Phaser (`EscenaPreload`).
 * Los nombres deben coincidir con los del export Tiled (p. ej. `debugger_room`, `New Bark Town`).
 */
export const TILESET_POR_MAPA = {
  'debugger-room': {
    tilesetTexturePorNombre: {
      debugger_room: 'debugger_room',
      'New Bark Town': 'new_bark_town',
    },
  },
  debugger_room: {
    tilesetTexturePorNombre: {
      debugger_room: 'debugger_room',
      'New Bark Town': 'new_bark_town',
    },
  },
};

export const CONFIG_MAPAS = {
  'debugger-room': {
    esInterior: true,
    posXInicio: 10,
    posYInicio: 17,
    bgm: 'bgm-elm-lab',
  },
  debugger_room: {
    esInterior: true,
    posXInicio: 10,
    posYInicio: 17,
    bgm: 'bgm-elm-lab',
  },
};

export function esMapaDebuggerRoom(mapaKey) {
  return MAPAS_DEBUGGER_ROOM.includes(mapaKey);
}
