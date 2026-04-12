/**
 *
 * - `casaJugador`: habitación + casa (warps entre sí y con New Bark en Tiled).
 * - `johtoOverworld`: pueblo y ruta (encuentros, exterior).
 * - `labElm`: laboratorio (starters, ayudante, warps).
 *
 * EscenaOverworld es la orquestadora
 */
import * as casaJugador from './casaJugador';
import * as johtoOverworld from './johtoOverworld';
import * as labElm from './labElm';
import * as debuggerRoom from './debuggerRoom';
import { dibujarInteriorGenerico } from './placeholders';

export { TAM_TILE, resolverTexturaPorNombreTileset } from './constantes';
export * as casaJugador from './casaJugador';
export * as johtoOverworld from './johtoOverworld';
export * as labElm from './labElm';
export * as debuggerRoom from './debuggerRoom';

export const TILESET_POR_MAPA = {
  ...casaJugador.TILESET_POR_MAPA,
  ...johtoOverworld.TILESET_POR_MAPA,
  ...labElm.TILESET_POR_MAPA,
  ...debuggerRoom.TILESET_POR_MAPA,
};

export const CONFIG_MAPAS = {
  ...casaJugador.CONFIG_MAPAS,
  ...johtoOverworld.CONFIG_MAPAS,
  ...labElm.CONFIG_MAPAS,
  ...debuggerRoom.CONFIG_MAPAS,
};

/**
 * Fondo dibujado cuando no hay tilemap JSON.
 * @param {Phaser.Scene} scene
 * @param {string} mapaKey
 * @param {{ esInterior: boolean }} configMapa
 */
export function dibujarPlaceholderPorMapa(scene, mapaKey, configMapa) {
  if (configMapa.esInterior) {
    if (casaJugador.esMapaCasaJugador(mapaKey)) {
      casaJugador.dibujarPlaceholderCasa(scene, mapaKey);
    } else if (labElm.esMapaLaboratorioElm(mapaKey)) {
      labElm.dibujarPlaceholderLab(scene);
    } else {
      dibujarInteriorGenerico(scene);
    }
  } else {
    johtoOverworld.dibujarPlaceholderExterior(scene, mapaKey);
  }
}

/**
 * Llamar tras montar capas del tilemap (NPCs/eventos ya registrados donde aplique).
 * @param {Phaser.Scene} scene
 * @param {string} mapaKey
 */
export function comprobarNarrativaTrasTilemap(scene, mapaKey) {
  casaJugador.comprobarNarrativaInicio(scene, mapaKey);
}

export { crearZonaTriggerElm, intentarWarpConSecuenciaAyudante } from './labElm';
