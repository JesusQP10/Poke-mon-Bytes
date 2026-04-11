import { dibujarExteriorPlaceholder } from './placeholders';

/** New Bark Town + ruta conectada (mismo flujo overworld / hierba / warps en JSON). */
export const MAPAS_JOHTO_OVERWORLD = ['new-bark-town', 'ruta-29'];

export const TILESET_POR_MAPA = {
  'new-bark-town': 'new_bark_town',
  'ruta-29': 'ruta_29_bg',
};

export const CONFIG_MAPAS = {
  'new-bark-town': { esInterior: false, posXInicio: 5, posYInicio: 5, bgm: 'bgm-new-bark-town' },
  // Mapa 30×9 tiles: filas válidas 0–8 (posY 9 queda fuera del tilemap)
  'ruta-29': { esInterior: false, posXInicio: 19, posYInicio: 8, bgm: 'bgm-overworld' },
};

export function esMapaJohtoOverworld(mapaKey) {
  return MAPAS_JOHTO_OVERWORLD.includes(mapaKey);
}

/**
 * @param {Phaser.Scene} scene
 * @param {string} mapaKey
 */
export function dibujarPlaceholderExterior(scene, mapaKey) {
  dibujarExteriorPlaceholder(scene, mapaKey);
}
