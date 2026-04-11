// GeneradorTilemap.js
// Módulo puro — sin imports de Phaser

const GeneradorTilemap = {

  // ── Helpers internos ──────────────────────────────────────────────────

  _crearCabecera(ancho, alto, tilesets, numCapas, numObjetos) {
    return {
      version: '1.10',
      tiledversion: '1.10.0',
      type: 'map',
      orientation: 'orthogonal',
      renderorder: 'right-down',
      width: ancho,
      height: alto,
      tilewidth: 16,
      tileheight: 16,
      infinite: false,
      nextlayerid: numCapas + 1,
      nextobjectid: numObjetos + 1,
      tilesets,
      layers: [],
    };
  },

  _crearCapaTiles(id, nombre, ancho, alto, datos) {
    return {
      id,
      name: nombre,
      type: 'tilelayer',
      width: ancho,
      height: alto,
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      data: datos,
    };
  },

  _crearCapaObjetos(id, nombre, objetos) {
    return {
      id,
      name: nombre,
      type: 'objectgroup',
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      objects: objetos,
    };
  },

  _crearWarp(id, nombre, tileX, tileY, destino, posX, posY) {
    return {
      id,
      name: nombre,
      type: 'warp',
      x: tileX * 16,
      y: tileY * 16,
      width: 16,
      height: 16,
      rotation: 0,
      visible: true,
      properties: [
        { name: 'destino', type: 'string', value: destino },
        { name: 'posX',    type: 'int',    value: posX },
        { name: 'posY',    type: 'int',    value: posY },
      ],
    };
  },

  /** Rectángulo de warp en píxeles (como en Tiled), p. ej. 192×80 32×32. */
  _crearWarpPixels(id, nombre, xPx, yPx, wPx, hPx, destino, posX, posY, spawnAt = null, spawnOffsetX = 0, spawnOffsetY = 0) {
    const properties = [
      { name: 'destino', type: 'string', value: destino },
      { name: 'posX', type: 'int', value: posX },
      { name: 'posY', type: 'int', value: posY },
    ];
    if (spawnAt) properties.push({ name: 'spawnAt', type: 'string', value: spawnAt });
    if (spawnOffsetX) properties.push({ name: 'spawnOffsetX', type: 'int', value: spawnOffsetX });
    if (spawnOffsetY) properties.push({ name: 'spawnOffsetY', type: 'int', value: spawnOffsetY });
    return {
      id,
      name: nombre,
      type: 'warp',
      x: xPx,
      y: yPx,
      width: wPx,
      height: hPx,
      rotation: 0,
      visible: true,
      properties,
    };
  },

  _crearNpc(id, nombre, tileX, tileY, dialogo) {
    return {
      id,
      name: nombre,
      type: 'npc',
      x: tileX * 16,
      y: tileY * 16,
      width: 16,
      height: 16,
      rotation: 0,
      visible: true,
      properties: [
        { name: 'dialogo', type: 'string', value: dialogo },
      ],
    };
  },

  // Genera un array de ancho*alto ceros
  _datosVacios(ancho, alto) {
    return new Array(ancho * alto).fill(0);
  },

  // Rellena el borde completo de un array de tiles con el valor dado
  _rellenarBorde(datos, ancho, alto, valor) {
    for (let x = 0; x < ancho; x++) {
      datos[0 * ancho + x] = valor;           // fila 0 (norte)
      datos[(alto - 1) * ancho + x] = valor;  // fila alto-1 (sur)
    }
    for (let y = 0; y < alto; y++) {
      datos[y * ancho + 0] = valor;           // columna 0 (oeste)
      datos[y * ancho + (ancho - 1)] = valor; // columna ancho-1 (este)
    }
    return datos;
  },

  // ── Generadores públicos ──────────────────────────────────────────────

  // Descriptor de tileset con dimensiones reales (256×96 px, tiles 16×16 → 16 cols × 6 filas = 96 tiles)
  _tileset(firstgid, name) {
    return {
      firstgid,
      name,
      image: `${name}.png`,
      imagewidth: 256,
      imageheight: 96,
      tilewidth: 16,
      tileheight: 16,
      tilecount: 96,
      columns: 16,
      margin: 0,
      spacing: 0,
      tiles: [
        { id: 1, properties: [{ name: 'colision', type: 'bool', value: true }] },
      ],
    };
  },

  /**
   * player_room — 10×9 tiles, tileset: players_room
   * Habitación del jugador (planta alta)
   */
  generarPlayerRoom() {
    const ANCHO = 10, ALTO = 9;
    const TILE_SUELO = 1, TILE_COLISION = 2;

    const tilesets = [this._tileset(1, 'players_room')];

    const suelo = new Array(ANCHO * ALTO).fill(TILE_SUELO);
    const decBajo = this._datosVacios(ANCHO, ALTO);

    const colisiones = this._datosVacios(ANCHO, ALTO);
    this._rellenarBorde(colisiones, ANCHO, ALTO, TILE_COLISION);

    const decAlto = this._datosVacios(ANCHO, ALTO);

    const capas = [
      this._crearCapaTiles(1, 'suelo',           ANCHO, ALTO, suelo),
      this._crearCapaTiles(2, 'decoracion_bajo',  ANCHO, ALTO, decBajo),
      this._crearCapaTiles(3, 'colisiones',       ANCHO, ALTO, colisiones),
      this._crearCapaTiles(4, 'decoracion_alto',  ANCHO, ALTO, decAlto),
      this._crearCapaObjetos(5, 'npcs', []),
      this._crearCapaObjetos(6, 'eventos', [
        // Misma geometría que exports/player_room.json (Tiled)
        this._crearWarpPixels(5, 'warp_player_house', 144, 0, 16, 32, 'player-house', 9, 2),
      ]),
    ];

    const mapa = this._crearCabecera(ANCHO, ALTO, tilesets, 6, 5);
    mapa.layers = capas;
    return mapa;
  },

  /**
   * player_house — 10×9 tiles, tileset: house
   * Planta baja de la casa del jugador
   */
  generarPlayerHouse() {
    const ANCHO = 10, ALTO = 9;
    const TILE_SUELO = 1, TILE_COLISION = 2;

    const tilesets = [this._tileset(1, 'house')];

    const suelo = new Array(ANCHO * ALTO).fill(TILE_SUELO);
    const decBajo = this._datosVacios(ANCHO, ALTO);

    const colisiones = this._datosVacios(ANCHO, ALTO);
    for (let x = 0; x < ANCHO; x++) {
      colisiones[0 * ANCHO + x] = TILE_COLISION; // norte
    }
    for (let y = 0; y < ALTO; y++) {
      colisiones[y * ANCHO + 0]           = TILE_COLISION; // oeste
      colisiones[y * ANCHO + (ANCHO - 1)] = TILE_COLISION; // este
    }

    const decAlto = this._datosVacios(ANCHO, ALTO);

    const npcMama = this._crearNpc(
      1, 'mama', 5, 3,
      '¡[JUGADOR]!|Nuestro vecino, el PROF. ELM, te estaba buscando.|Dijo que quería pedirte un favor.|¡Ah! Casi lo olvido. Tu POKÉGEAR ha vuelto del taller.|¡Aquí tienes!'
    );

    const capas = [
      this._crearCapaTiles(1, 'suelo',           ANCHO, ALTO, suelo),
      this._crearCapaTiles(2, 'decoracion_bajo',  ANCHO, ALTO, decBajo),
      this._crearCapaTiles(3, 'colisiones',       ANCHO, ALTO, colisiones),
      this._crearCapaTiles(4, 'decoracion_alto',  ANCHO, ALTO, decAlto),
      this._crearCapaObjetos(5, 'npcs', [npcMama]),
      this._crearCapaObjetos(6, 'eventos', [
        this._crearWarpPixels(2, 'warp_habitacion', 144, 0, 16, 32, 'player-room', 9, 2),
        this._crearWarpPixels(3, 'warp_exterior', 96, 128, 32, 16, 'new-bark-town', 12, 8, 'warp_player_house', 0, 1),
      ]),
    ];

    const mapa = this._crearCabecera(ANCHO, ALTO, tilesets, 6, 5);
    mapa.layers = capas;
    return mapa;
  },

  /**
   * new_bark_town — 20×18 tiles, tilesets: johto + johto_modern + house
   */
  generarNewBarkTown() {
    const ANCHO = 20, ALTO = 18;
    const TILE_SUELO = 1, TILE_COLISION = 2, TILE_HIERBA = 3;

    const tilesets = [
      this._tileset(1,   'johto'),
      this._tileset(97,  'johto_modern'),
      this._tileset(193, 'house'),
    ];

    const suelo = new Array(ANCHO * ALTO).fill(TILE_SUELO);
    const decBajo = this._datosVacios(ANCHO, ALTO);

    // Hierba alta: filas 8-12, columnas 2-8
    const hierba = this._datosVacios(ANCHO, ALTO);
    for (let y = 8; y <= 12; y++) {
      for (let x = 2; x <= 8; x++) {
        hierba[y * ANCHO + x] = TILE_HIERBA;
      }
    }

    // Colisiones: borde completo
    const colisiones = this._datosVacios(ANCHO, ALTO);
    this._rellenarBorde(colisiones, ANCHO, ALTO, TILE_COLISION);

    const decAlto = this._datosVacios(ANCHO, ALTO);

    const npcRival = this._crearNpc(1, 'rival', 16, 8, '¿Qué miras?');

    const capas = [
      this._crearCapaTiles(1, 'suelo',           ANCHO, ALTO, suelo),
      this._crearCapaTiles(2, 'decoracion_bajo',  ANCHO, ALTO, decBajo),
      this._crearCapaTiles(3, 'hierba_alta',      ANCHO, ALTO, hierba),
      this._crearCapaTiles(4, 'colisiones',       ANCHO, ALTO, colisiones),
      this._crearCapaTiles(5, 'decoracion_alto',  ANCHO, ALTO, decAlto),
      this._crearCapaObjetos(6, 'npcs', [npcRival]),
      this._crearCapaObjetos(7, 'eventos', [
        // Geometría alineada con exports/new_bark_town.json (Tiled)
        // Ruta 30×9: posY máximo 8 (9 queda fuera del mapa y desalinea al jugador)
        this._crearWarpPixels(5, 'warp_ruta_29', 0, 112, 16, 32, 'ruta-29', 19, 8),
        this._crearWarpPixels(11, 'warp_elm_lab', 96, 48, 32, 32, 'elm-lab', 6, 11, 'warp_salida', 0, -1),
        this._crearWarpPixels(12, 'warp_player_house', 192, 80, 32, 32, 'player-house', 6, 7),
      ]),
    ];

    const mapa = this._crearCabecera(ANCHO, ALTO, tilesets, 7, 13);
    mapa.layers = capas;
    return mapa;
  },

  /**
   * elm_lab — 10×10 tiles, tileset: lab
   */
  generarElmLab() {
    const ANCHO = 10, ALTO = 10;
    const TILE_SUELO = 1, TILE_COLISION = 2;

    const tilesets = [this._tileset(1, 'lab')];

    const suelo = new Array(ANCHO * ALTO).fill(TILE_SUELO);
    const decBajo = this._datosVacios(ANCHO, ALTO);

    // Colisiones: borde completo excepto fila 9 centro (tiles 4,9 y 5,9 = salida)
    const colisiones = this._datosVacios(ANCHO, ALTO);
    this._rellenarBorde(colisiones, ANCHO, ALTO, TILE_COLISION);
    // Abrir la salida sur (tiles 4 y 5 de la fila 9)
    colisiones[(ALTO - 1) * ANCHO + 4] = 0;
    colisiones[(ALTO - 1) * ANCHO + 5] = 0;

    const decAlto = this._datosVacios(ANCHO, ALTO);

    const npcElm = this._crearNpc(
      1, 'elm', 5, 3,
      '¡[JUGADOR]! Justo a tiempo.|Estoy investigando los Pokémon de la región Johto.|¿Me harías un favor? Necesito que lleves uno de mis Pokémon.|Elige el que más te guste.'
    );

    const capas = [
      this._crearCapaTiles(1, 'suelo',           ANCHO, ALTO, suelo),
      this._crearCapaTiles(2, 'decoracion_bajo',  ANCHO, ALTO, decBajo),
      this._crearCapaTiles(3, 'colisiones',       ANCHO, ALTO, colisiones),
      this._crearCapaTiles(4, 'decoracion_alto',  ANCHO, ALTO, decAlto),
      this._crearCapaObjetos(5, 'npcs', [npcElm]),
      this._crearCapaObjetos(6, 'eventos', [
        // Salida al pueblo: exports/elm_lab.json (regenerar no incluye starters/trigger; editar en Tiled si hace falta)
        this._crearWarpPixels(6, 'warp_salida', 80, 192, 32, 32, 'new-bark-town', 7, 5, 'warp_elm_lab', 0, 1),
      ]),
    ];

    const mapa = this._crearCabecera(ANCHO, ALTO, tilesets, 6, 13);
    mapa.layers = capas;
    return mapa;
  },

  /**
   * ruta_29 — 30×9 tiles, tilesets: johto + johto_modern
   */
  generarRuta29() {
    const ANCHO = 30, ALTO = 9;
    const TILE_SUELO = 1, TILE_COLISION = 2, TILE_HIERBA = 3;

    const tilesets = [
      this._tileset(1,  'johto'),
      this._tileset(97, 'johto_modern'),
    ];

    const suelo = new Array(ANCHO * ALTO).fill(TILE_SUELO);
    const decBajo = this._datosVacios(ANCHO, ALTO);

    // Hierba alta: filas 3-6, columnas 5-20
    const hierba = this._datosVacios(ANCHO, ALTO);
    for (let y = 3; y <= 6; y++) {
      for (let x = 5; x <= 20; x++) {
        hierba[y * ANCHO + x] = TILE_HIERBA;
      }
    }

    // Colisiones: borde completo excepto borde este (columna 29)
    const colisiones = this._datosVacios(ANCHO, ALTO);
    // Norte y sur
    for (let x = 0; x < ANCHO; x++) {
      colisiones[0 * ANCHO + x]           = TILE_COLISION;
      colisiones[(ALTO - 1) * ANCHO + x]  = TILE_COLISION;
    }
    // Oeste
    for (let y = 0; y < ALTO; y++) {
      colisiones[y * ANCHO + 0] = TILE_COLISION;
    }
    // Este (columna 29) sin colisión — es la salida hacia new_bark_town

    const decAlto = this._datosVacios(ANCHO, ALTO);

    const capas = [
      this._crearCapaTiles(1, 'suelo',           ANCHO, ALTO, suelo),
      this._crearCapaTiles(2, 'decoracion_bajo',  ANCHO, ALTO, decBajo),
      this._crearCapaTiles(3, 'hierba_alta',      ANCHO, ALTO, hierba),
      this._crearCapaTiles(4, 'colisiones',       ANCHO, ALTO, colisiones),
      this._crearCapaTiles(5, 'decoracion_alto',  ANCHO, ALTO, decAlto),
      this._crearCapaObjetos(6, 'npcs', []),
      this._crearCapaObjetos(7, 'eventos', [
        this._crearWarp(1, 'warp_new_bark_1', 29, 4, 'new-bark-town', 1, 8),
        this._crearWarp(2, 'warp_new_bark_2', 29, 5, 'new-bark-town', 1, 8),
      ]),
    ];

    const mapa = this._crearCabecera(ANCHO, ALTO, tilesets, 7, 2);
    mapa.layers = capas;
    return mapa;
  },
};

export default GeneradorTilemap;
