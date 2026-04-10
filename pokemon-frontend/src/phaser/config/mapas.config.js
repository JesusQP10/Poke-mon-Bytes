/**
 * Configuración centralizada de mapas
 * Incluye tilesets, posiciones iniciales, música y propiedades
 */

export const TILESET_POR_MAPA = {
  'player-room': 'new_bark_town',
  'player-house': 'new_bark_town',
  'new-bark-town': 'new_bark_town',
  'elm-lab': 'new_bark_town',
  'ruta-29': 'ruta_29_bg',
};

export const CONFIG_MAPAS = {
  'player-room': {
    nombre: 'Habitación del Jugador',
    esInterior: true,
    posXInicio: 5,
    posYInicio: 7,
    bgm: 'bgm-new-bark-town',
    volumenBgm: 0.6,
    tieneEncuentros: false,
    capas: ['suelo', 'decoracion_bajo', 'colisiones', 'decoracion_alto'],
  },
  'player-house': {
    nombre: 'Casa del Jugador',
    esInterior: true,
    posXInicio: 5,
    posYInicio: 5,
    bgm: 'bgm-new-bark-town',
    volumenBgm: 0.6,
    tieneEncuentros: false,
    capas: ['suelo', 'decoracion_bajo', 'colisiones', 'decoracion_alto'],
  },
  'new-bark-town': {
    nombre: 'Pueblo Primavera',
    esInterior: false,
    posXInicio: 5,
    posYInicio: 5,
    bgm: 'bgm-new-bark-town',
    volumenBgm: 0.6,
    tieneEncuentros: false,
    capas: ['suelo', 'decoracion_bajo', 'colisiones', 'decoracion_alto'],
  },
  'elm-lab': {
    nombre: 'Laboratorio del Prof. Elm',
    esInterior: true,
    posXInicio: 5,
    posYInicio: 8,
    bgm: 'bgm-elm-lab',
    volumenBgm: 0.5,
    tieneEncuentros: false,
    capas: ['suelo', 'decoracion_bajo', 'colisiones', 'decoracion_alto'],
  },
  'elm_lab': {
    nombre: 'Laboratorio del Prof. Elm',
    esInterior: true,
    posXInicio: 5,
    posYInicio: 8,
    bgm: 'bgm-elm-lab',
    volumenBgm: 0.5,
    tieneEncuentros: false,
    capas: ['suelo', 'decoracion_bajo', 'colisiones', 'decoracion_alto'],
  },
  'ruta-29': {
    nombre: 'Ruta 29',
    esInterior: false,
    posXInicio: 19,
    posYInicio: 9,
    bgm: 'bgm-overworld',
    volumenBgm: 0.6,
    tieneEncuentros: true,
    tablaEncuentros: 'encuentros-ruta-29',
    capas: ['suelo', 'decoracion_bajo', 'hierba_alta', 'colisiones', 'decoracion_alto'],
  },
};

/**
 * Obtiene la configuración de un mapa con valores por defecto
 * @param {string} mapaKey - Identificador del mapa
 * @returns {Object} Configuración del mapa
 */
export function obtenerConfigMapa(mapaKey) {
  const config = CONFIG_MAPAS[mapaKey];
  
  if (!config) {
    console.warn(`[mapas.config] Mapa "${mapaKey}" no encontrado, usando valores por defecto`);
    return {
      nombre: mapaKey,
      esInterior: false,
      posXInicio: 5,
      posYInicio: 5,
      bgm: null,
      volumenBgm: 0.6,
      tieneEncuentros: false,
      capas: ['suelo', 'decoracion_bajo', 'colisiones', 'decoracion_alto'],
    };
  }
  
  return config;
}

/**
 * Obtiene el tileset asociado a un mapa
 * @param {string} mapaKey - Identificador del mapa
 * @returns {string} Key del tileset
 */
export function obtenerTilesetMapa(mapaKey) {
  return TILESET_POR_MAPA[mapaKey] || 'new_bark_town';
}
