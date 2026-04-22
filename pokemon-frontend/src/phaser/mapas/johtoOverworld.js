import { dibujarExteriorPlaceholder } from './placeholders';

/** New Bark Town + ruta conectada (mismo flujo overworld / hierba / warps en JSON). */
export const MAPAS_JOHTO_OVERWORLD = ['new-bark-town'];

export const TILESET_POR_MAPA = {
  'new-bark-town': 'new_bark_town',
};

export const CONFIG_MAPAS = {
  'new-bark-town': { esInterior: false, posXInicio: 5, posYInicio: 5, bgm: 'bgm-new-bark-town' },
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
