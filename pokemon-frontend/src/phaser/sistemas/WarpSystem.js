import Phaser from 'phaser';

/**
 * Sistema genérico de warps (Tiled → capa `eventos`).
 *
 * Convención:
 * - Objetos con custom property `destino` (clave del tilemap en caché, p. ej. `new-bark-town`, `ruta-29`).
 * - `posX` / `posY` en **tiles** (0-based); equivalen a casilla × `tileheight`/`tilewidth` del mapa (16px por defecto).
 * - Opcional: `spawnAt` (string) = nombre de un objeto en la capa `eventos` del **mapa destino**; si existe, el spawn usa el centro de ese rectángulo y sustituye a posX/posY.
 * - Opcional: `spawnOffsetX` / `spawnOffsetY` (int, tiles) sumados al tile final; útil para no reaparecer *dentro* del rectángulo del warp de vuelta (p. ej. +1 en Y al salir de casa).
 * - Opcional: `type: "warp"` en Tiled; si no existe, basta con tener `destino`.
 * - Objetos con `tipo` === `trigger_elm` se excluyen (no son viaje de mapa).
 */
export default class WarpSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ tileSize?: number, fadeMs?: number }} [options]
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.tileSize = options.tileSize ?? 16;
    this.fadeMs = options.fadeMs ?? 250;
    /** @type {{ zona: Phaser.GameObjects.Zone, estado: { estabaEnZona: boolean, yaActivado: boolean } }[]} */
    this._zonas = [];
    this._onWorldStep = null;
    this._sincronizadoPrimerPaso = false;
  }

  /** Lee propiedad Tiled tolerando espacios accidentales en `name`. */
  static prop(props, nombre) {
    const clave = String(nombre);
    const p = props.find((x) => String(x.name ?? '').trim() === clave);
    return p?.value;
  }

  /**
   * ¿Este objeto de `eventos` define un viaje a otro mapa?
   */
  static esWarpViaje(obj) {
    const props = obj.properties ?? [];
    const tipo = String(WarpSystem.prop(props, 'tipo') ?? '').trim();
    if (tipo === 'trigger_elm') return false;
    const destino = String(WarpSystem.prop(props, 'destino') ?? '').trim();
    return destino.length > 0;
  }

  /**
   * Extrae destino y casillas de spawn desde las custom properties del objeto Tiled.
   * @returns {{ destino: string, tileX: number, tileY: number, spawnAt: string | null, spawnOffsetX: number, spawnOffsetY: number } | null}
   */
  static leerWarpDesdeObjeto(obj) {
    const props = obj.properties ?? [];
    const destino = String(WarpSystem.prop(props, 'destino') ?? '').trim();
    if (!destino) return null;
    const rawX = WarpSystem.prop(props, 'posX');
    const rawY = WarpSystem.prop(props, 'posY');
    const tileX = Number.isFinite(Number(rawX)) ? Number(rawX) : 0;
    const tileY = Number.isFinite(Number(rawY)) ? Number(rawY) : 0;
    const spawnAt = String(WarpSystem.prop(props, 'spawnAt') ?? '').trim() || null;
    const rawOx = WarpSystem.prop(props, 'spawnOffsetX');
    const rawOy = WarpSystem.prop(props, 'spawnOffsetY');
    const spawnOffsetX = Number.isFinite(Number(rawOx)) ? Number(rawOx) : 0;
    const spawnOffsetY = Number.isFinite(Number(rawOy)) ? Number(rawOy) : 0;
    return { destino, tileX, tileY, spawnAt, spawnOffsetX, spawnOffsetY };
  }

  /**
   * Centro del rectángulo de un objeto en la capa `eventos` del mapa en caché → tile (0-based).
   * Útil con la propiedad opcional `spawnAt` en el warp de origen.
   */
  static tilesCentroObjetoEventos(cache, mapKey, nombreObjeto, tileSize = 16) {
    const data = WarpSystem.datosTilemapEnCache(cache, mapKey);
    if (!data?.layers) return null;
    const eventos = data.layers.find((l) => l.name === 'eventos' && l.type === 'objectgroup');
    if (!eventos?.objects) return null;
    const o = eventos.objects.find((ob) => ob.name === nombreObjeto);
    if (!o) return null;
    const tw = data.tilewidth ?? tileSize;
    const th = data.tileheight ?? tileSize;
    const w = o.width ?? tw;
    const h = o.height ?? th;
    const cx = o.x + w / 2;
    const cy = o.y + h / 2;
    return {
      tx: Math.floor(cx / tw),
      ty: Math.floor(cy / th),
    };
  }

  /**
   * JSON del tilemap ya parseado en la caché de Phaser (tras preload).
   * @param {Phaser.Cache.CacheManager} cache
   * @param {string} mapKey
   */
  static datosTilemapEnCache(cache, mapKey) {
    const variaciones = [mapKey, mapKey.replace('-', '_'), mapKey.replace('_', '-')];
    for (const k of variaciones) {
      if (!cache.tilemap.exists(k)) continue;
      const entry = cache.tilemap.get(k);
      if (entry?.data) return entry.data;
      if (entry?.layers) return entry;
    }
    return null;
  }

  /**
   * Ajusta tile de spawn a los límites del mapa destino (evita pos fuera del JSON).
   */
  static clampTilesEnMapa(cache, mapKey, tileX, tileY) {
    const data = WarpSystem.datosTilemapEnCache(cache, mapKey);
    if (!data?.width || !data?.height) return { tileX, tileY };
    return {
      tileX: Phaser.Math.Clamp(tileX, 0, data.width - 1),
      tileY: Phaser.Math.Clamp(tileY, 0, data.height - 1),
    };
  }

  /**
   * Registra una zona de warp (overlap + estado para worldstep).
   * @param {Phaser.Types.Physics.Arcade.ArcadeColliderType} jugador
   * @param {object} obj Objeto Tiled de la capa eventos
   * @param {(obj: object) => boolean} estaBloqueado Si true, no se dispara el warp
   * @param {(payload: { destino: string, tileX: number, tileY: number, spawnAt: string | null, spawnOffsetX: number, spawnOffsetY: number }) => void | Promise<void>} alActivar
   */
  registrarZonaWarp(obj, jugador, estaBloqueado, alActivar) {
    const width = obj.width || this.tileSize;
    const height = obj.height || this.tileSize;
    const centroX = obj.x + width / 2;
    const centroY = obj.y + height / 2;

    const zona = this.scene.add.zone(centroX, centroY, width, height);
    this.scene.physics.add.existing(zona, true);

    const estado = {
      estabaEnZona: this.scene.physics.overlap(jugador, zona),
      yaActivado: false,
    };

    this.scene.physics.add.overlap(jugador, zona, () => {
      if (estado.estabaEnZona || estado.yaActivado || estaBloqueado()) return;

      const parsed = WarpSystem.leerWarpDesdeObjeto(obj);
      if (!parsed) return;

      estado.yaActivado = true;
      void alActivar(parsed);
    });

    this._zonas.push({ zona, estado });
  }

  /**
   * Tras crear el mapa, Arcade a veces no devuelve overlap en el mismo frame que las zonas.
   * Sin esto, aparecer encima de un warp (p. ej. saliendo de casa) dispara el viaje de vuelta.
   */
  sincronizarPresenciaJugadorEnZonas() {
    const jugador = this.scene._jugador;
    if (!jugador) return;
    for (const { zona, estado } of this._zonas) {
      estado.estabaEnZona = this.scene.physics.overlap(jugador, zona);
      estado.yaActivado = false;
    }
  }

  /** Zonas no-warp (p. ej. trigger_elm) que comparten el mismo worldstep. */
  agregarZonaParaWorldstep(zona, estado) {
    this._zonas.push({ zona, estado });
  }

  /** Un único listener `worldstep` para todas las zonas registradas. */
  inicializarWorldstep() {
    if (this._onWorldStep || !this._zonas.length) return;
    this._onWorldStep = () => {
      const jugador = this.scene._jugador;
      if (!jugador) return;
      if (!this._sincronizadoPrimerPaso) {
        this._sincronizadoPrimerPaso = true;
        this.sincronizarPresenciaJugadorEnZonas();
      }
      for (const { zona, estado } of this._zonas) {
        const ahora = this.scene.physics.overlap(jugador, zona);
        if (estado.estabaEnZona && !ahora) estado.estabaEnZona = false;
        if (!ahora) estado.yaActivado = false;
      }
    };
    this.scene.physics.world.on('worldstep', this._onWorldStep);
  }

  /**
   * Fade → (opcional) destruir tilemap Phaser → guardar tiles en store → reiniciar escena.
   * @param {{ getState: () => { setPosition: (x: number, y: number, mapa: string) => void } }} storeApi p. ej. `usarJuegoStore`
   */
  /**
   * @param {{ destino: string, tileX: number, tileY: number, spawnAt?: string | null, spawnOffsetX?: number, spawnOffsetY?: number }} payload
   * @param {{ getState: () => { setPosition: (x: number, y: number, mapa: string) => void } }} storeApi
   */
  async ejecutarTransicionMapa(payload, storeApi) {
    const {
      destino,
      tileX,
      tileY,
      spawnAt = null,
      spawnOffsetX = 0,
      spawnOffsetY = 0,
    } = payload;
    const cam = this.scene.cameras.main;
    this.scene._cambiandoMapa = true;
    this.scene._musica?.stop?.();
    this.scene.input.keyboard.removeAllListeners();

    let tx = tileX;
    let ty = tileY;
    if (spawnAt) {
      const centro = WarpSystem.tilesCentroObjetoEventos(
        this.scene.cache,
        destino,
        spawnAt,
        this.tileSize
      );
      if (centro) {
        tx = centro.tx;
        ty = centro.ty;
      }
    }

    tx += spawnOffsetX;
    ty += spawnOffsetY;

    const clamped = WarpSystem.clampTilesEnMapa(this.scene.cache, destino, tx, ty);
    const { tileX: cTx, tileY: cTy } = clamped;

    cam.fadeOut(this.fadeMs, 0, 0, 0);
    await new Promise((resolve) => {
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, resolve);
    });

    if (typeof this.scene._destruirTilemapActual === 'function') {
      this.scene._destruirTilemapActual();
    }

    storeApi.getState().setPosition(cTx, cTy, destino);
    this.scene.scene.restart();
  }

  shutdown() {
    if (this._onWorldStep) {
      this.scene.physics.world.off('worldstep', this._onWorldStep);
      this._onWorldStep = null;
    }
    for (const { zona } of this._zonas) {
      if (zona?.destroy) zona.destroy();
    }
    this._zonas = [];
  }
}
