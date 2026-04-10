/**
 * MapaManager - Gestiona la carga y creación de mapas
 * Separa la lógica de mapas de EscenaOverworld
 */

import { obtenerConfigMapa, obtenerTilesetMapa } from '../config/mapas.config';
import { TAM_TILE } from '../../config/constants';

export default class MapaManager {
  constructor(scene) {
    this.scene = scene;
    this.mapaActual = null;
    this.capas = {};
  }

  /**
   * Carga un mapa (tilemap o placeholder)
   * @param {string} mapaKey - Identificador del mapa
   * @returns {Object} { mapa, capas, config }
   */
  cargarMapa(mapaKey) {
    const config = obtenerConfigMapa(mapaKey);
    
    // Verificar si existe el tilemap en cache
    if (this._existeTilemap(mapaKey)) {
      return this._cargarTilemap(mapaKey, config);
    } else {
      console.warn(`[MapaManager] Tilemap "${mapaKey}" no encontrado, usando placeholder`);
      return this._crearPlaceholder(mapaKey, config);
    }
  }

  /**
   * Verifica si un tilemap existe en cache
   * @private
   */
  _existeTilemap(mapaKey) {
    if (this.scene.cache.tilemap.exists(mapaKey)) return true;
    
    // Intentar variaciones del nombre
    const variaciones = [
      mapaKey,
      mapaKey.replace('-', '_'),
      mapaKey.replace('_', '-')
    ];
    
    return variaciones.some(key => this.scene.cache.tilemap.exists(key));
  }

  /**
   * Carga un tilemap real desde Tiled
   * @private
   */
  _cargarTilemap(mapaKey, config) {
    try {
      const mapa = this.scene.make.tilemap({ key: mapaKey });
      const tilesetData = mapa.tilesets[0];
      
      if (!tilesetData) {
        throw new Error(`No tileset found in map ${mapaKey}`);
      }

      const tilesetName = tilesetData.name;
      const tilesetKey = obtenerTilesetMapa(mapaKey);
      const tileset = mapa.addTilesetImage(tilesetName, tilesetKey);
      
      if (!tileset) {
        throw new Error(`Failed to load tileset: ${tilesetName} -> ${tilesetKey}`);
      }

      // Crear capas según configuración
      const capas = this._crearCapas(mapa, tileset, config);
      
      this.mapaActual = mapa;
      this.capas = capas;
      
      return { mapa, capas, config, esPlaceholder: false };
      
    } catch (error) {
      console.error(`[MapaManager] Error cargando tilemap "${mapaKey}":`, error);
      return this._crearPlaceholder(mapaKey, config);
    }
  }

  /**
   * Crea las capas del tilemap
   * @private
   */
  _crearCapas(mapa, tileset, config) {
    const capas = {};
    
    // Crear solo las capas que existen en el mapa
    if (mapa.getLayer('suelo')) {
      capas.suelo = mapa.createLayer('suelo', tileset, 0, 0);
    }
    
    if (mapa.getLayer('decoracion_bajo')) {
      capas.decoracionBajo = mapa.createLayer('decoracion_bajo', tileset, 0, 0);
    }
    
    if (mapa.getLayer('hierba_alta')) {
      capas.hierba = mapa.createLayer('hierba_alta', tileset, 0, 0);
    }
    
    if (mapa.getLayer('colisiones')) {
      capas.colisiones = mapa.createLayer('colisiones', tileset, 0, 0);
      capas.colisiones.setCollisionByExclusion([-1]);
      
      // Ocultar colisiones en exteriores
      if (!config.esInterior) {
        capas.colisiones.setVisible(false);
      }
    }
    
    if (mapa.getLayer('decoracion_alto')) {
      capas.decoracionAlto = mapa.createLayer('decoracion_alto', tileset, 0, 0);
      capas.decoracionAlto.setDepth(10);
    }
    
    return capas;
  }

  /**
   * Crea un mapa placeholder cuando no hay assets
   * @private
   */
  _crearPlaceholder(mapaKey, config) {
    if (config.esInterior) {
      this._dibujarInteriorPlaceholder(mapaKey, config);
    } else {
      this._dibujarExteriorPlaceholder(mapaKey, config);
    }
    
    return { mapa: null, capas: {}, config, esPlaceholder: true };
  }

  /**
   * Dibuja un interior placeholder
   * @private
   */
  _dibujarInteriorPlaceholder(mapaKey, config) {
    // Suelo de madera
    this.scene.add.rectangle(80, 72, 160, 144, 0xc8a050).setOrigin(0.5);

    // Paredes
    this.scene.add.rectangle(80, 8, 160, 16, 0x806838).setOrigin(0.5);
    this.scene.add.rectangle(4, 72, 8, 144, 0x806838).setOrigin(0.5);
    this.scene.add.rectangle(156, 72, 8, 144, 0x806838).setOrigin(0.5);

    // Etiqueta
    this.scene.add.text(80, 72, config.nombre.toUpperCase(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      fill: '#80500a',
    }).setOrigin(0.5).setAlpha(0.4);
  }

  /**
   * Dibuja un exterior placeholder
   * @private
   */
  _dibujarExteriorPlaceholder(mapaKey, config) {
    this.scene.add.rectangle(80, 72, 160, 144, 0x78c850).setOrigin(0.5);

    const graficos = this.scene.add.graphics();
    graficos.lineStyle(0.5, 0x5aaa3a, 0.4);
    
    for (let x = 0; x <= 160; x += TAM_TILE) {
      graficos.lineBetween(x, 0, x, 144);
    }
    for (let y = 0; y <= 144; y += TAM_TILE) {
      graficos.lineBetween(0, y, 160, y);
    }

    this.scene.add.text(80, 40, config.nombre.toUpperCase(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#1a6010',
      align: 'center',
    }).setOrigin(0.5);
  }

  /**
   * Configura la cámara según el mapa
   */
  configurarCamara(jugador) {
    this.scene.cameras.main.setZoom(1);
    this.scene.cameras.main.startFollow(jugador, true, 1, 1);
    
    if (this.mapaActual) {
      const { widthInPixels, heightInPixels } = this.mapaActual;
      this.scene.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
      this.scene.physics.world.setBounds(0, 0, widthInPixels, heightInPixels);
    }
  }

  /**
   * Limpia el mapa actual
   */
  limpiar() {
    this.mapaActual = null;
    this.capas = {};
  }
}
