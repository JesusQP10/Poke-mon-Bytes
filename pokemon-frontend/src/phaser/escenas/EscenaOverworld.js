import Phaser from 'phaser';
import Jugador, { crearTecladoJugador, normalizarTeclado } from '../entidades/Jugador';
import SistemaEncuentros from '../sistemas/SistemaEncuentros';
import SistemaDialogo from '../sistemas/SistemaDialogo';
import { usarJuegoStore } from '../../store/usarJuegoStore';
import SistemaSecuencias from '../sistemas/SistemaSecuencias';
import { STARTERS } from '../ui/UISeleccionStarter';
import UIOpcionSiNo from '../ui/UIOpcionSiNo';
import UIConfirmacionStarter from '../ui/UIConfirmacionStarter';
import UIMenuLista from '../ui/UIMenuLista';
import { crearMarcoDialogoRetro, estiloTextoDialogoRetro } from '../utils/marcoDialogoRetro';
import WarpSystem from '../sistemas/WarpSystem';
import {
  TAM_TILE,
  TILESET_POR_MAPA,
  CONFIG_MAPAS,
  dibujarPlaceholderPorMapa,
  comprobarNarrativaTrasTilemap,
  crearZonaTriggerElm,
  intentarWarpConSecuenciaAyudante,
  resolverTexturaPorNombreTileset,
} from '../mapas';
import { lineasProfElmTrasStarter, lineasMadreTrasStarter } from '../mapas/dialogosPostStarter';
import { STATS_MENU_FALLBACK_POR_POKEDEX } from '../../config/statsCombateMenuFallback';
import { volumenBgmParaPhaser, sfxPermitido } from '../../config/opcionesCliente';
import { CONFIG_NPC_BATALLA_DEBUG, generarPokemonAleatorioCaptura, nombreAtaqueDemostracionPorEstadoDebug } from '../../config/batallaDebugDemostracion';
import PuenteApi from '../puentes/PuenteApi';
import { usarAutenticacionStore } from '../../store/usarAutenticacionStore';

/** Etiqueta superior en la caja de diálogo (nombre Tiled del NPC → texto). */
const ETIQUETA_HABLANTE_NPC = {
  elm: 'PROF. ELM',
  madre: 'MAMÁ',
  ayudante: 'AYUDANTE',
  rival: '???',
  aldeano: 'ALDEANO',
};

function etiquetaHablanteNpc(name) {
  if (!name) return null;
  const key = String(name).toLowerCase();
  if (ETIQUETA_HABLANTE_NPC[key]) return ETIQUETA_HABLANTE_NPC[key];
  return String(name).replace(/[-_]/g, ' ').toUpperCase();
}

export default class EscenaOverworld extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaOverworld' });
  }

  init(data) {
    this._datosEntrada = data ?? {};
  }

  create() {
    this._introActiva = false;
    this._cambiandoMapa = false; // Evita que el overlap dispare mil transiciones a la vez
    this._reactTextoEstaticoActivo = false;
    this._uiMenuLista = null;
    this._uiConfirmStarter = null;
    this._flujoEleccionStarter = false;
    this._interactuables = []; // Registro centralizado para que el input no se duplique
    /** @type {{ tx: number, ty: number, radio: number, disparado: boolean, lineas: string[], optsReactTexto: object }[]} */
    this._bienvenidasPorTile = [];
    this._tilemapPhaser = null;
    this._warpSystem = new WarpSystem(this, { tileSize: TAM_TILE, fadeMs: 250 });

    const store = usarJuegoStore.getState();
    const mapa = store.mapaActual;
    const esNuevaPartida = store.esNuevaPartida;

    // Debe coincidir con la clave en caché de Phaser (p. ej. `new-bark-town`). Antes se marcaba
    // `tieneAssets` con una variante `_` pero se llamaba a `make.tilemap` con la clave errónea → pantalla negra.
    let mapaTilemap = mapa;
    let tieneAssets = this.cache.tilemap.exists(mapaTilemap);
    if (!tieneAssets) {
      const variaciones = [mapa, mapa.replace('-', '_'), mapa.replace('_', '-')];
      for (const key of variaciones) {
        if (this.cache.tilemap.exists(key)) {
          tieneAssets = true;
          mapaTilemap = key;
          break;
        }
      }
    }

    const configMapa =
      CONFIG_MAPAS[mapaTilemap] ?? CONFIG_MAPAS[mapa] ?? CONFIG_MAPAS['player-room'];

    const tileX = esNuevaPartida ? configMapa.posXInicio : (store.posX ?? configMapa.posXInicio);
    const tileY = esNuevaPartida ? configMapa.posYInicio : (store.posY ?? configMapa.posYInicio);

    if (tieneAssets) {
      try {
        this._crearEscenaTilemap(mapaTilemap, tileX, tileY, configMapa);
      } catch (e) {
        console.error(`[create] ❌ Error cargando tilemap ${mapaTilemap}:`, e);
        this._crearEscenaPlaceholder(mapaTilemap, tileX, tileY, configMapa);
      }
    } else {
      this._crearEscenaPlaceholder(mapa, tileX, tileY, configMapa);
    }

    if (esNuevaPartida) {
      this._reproducirIntroNuevaPartida(tileX, tileY, configMapa);
    } else {
      this._iniciarJuego(configMapa.bgm);
    }

    // Listener global para interactuar con NPCs y Pokéballs
    this.input.keyboard.on('keydown-Z', this._manejarInteraccion, this);

    this._warpSystem.inicializarWorldstep();
    // Tras registrar todas las zonas, alinear presencia antes del primer paso de Arcade (evita salida inmediata
    // si el spawn cae dentro del warp de salida, sin bloquear otros warps con un flag global).
    this._warpSystem.sincronizarPresenciaJugadorEnZonas();

    this._aplicarVolumenBgmDesdeOpciones = () => {
      const v = volumenBgmParaPhaser();
      if (this._musica) {
        this._musica.setVolume(v);
        if (!this._musica.isPlaying) {
          this._musica.play();
        }
      }
    };
    this._onOpcionesAudio = () => this._aplicarVolumenBgmDesdeOpciones();
    window.addEventListener('bytes-opciones-audio', this._onOpcionesAudio);
    // Con el menú React la escena está en pausa; el volumen debe reaplicarse al volver.
    this.events.on('resume', this._aplicarVolumenBgmDesdeOpciones);
  }

  _warpEstaBloqueado() {
    return Boolean(
      this._introActiva ||
      this._secuencias?.activo ||
      this._cambiandoMapa ||
      this._reactTextoEstaticoActivo ||
      this._uiMenuLista?.activo
    );
  }

  _destruirTilemapActual() {
    if (!this._tilemapPhaser) return;
    try {
      this._tilemapPhaser.destroy(true);
    } catch {
      /* evita fallos si el tilemap ya fue retirado del mundo */
    }
    this._tilemapPhaser = null;
  }

  /**
   * Warps: solo custom properties `destino`, `posX`, `posY` (tiles); ver WarpSystem.
   */
  _activarWarpDesdeObjeto({
    destino,
    tileX,
    tileY,
    spawnAt = null,
    spawnOffsetX = 0,
    spawnOffsetY = 0,
  }) {
    const payload = { destino, tileX, tileY, spawnAt, spawnOffsetX, spawnOffsetY };
    const store = usarJuegoStore.getState();
    if (
      intentarWarpConSecuenciaAyudante(store, this, () => {
        void this._warpSystem.ejecutarTransicionMapa(payload, usarJuegoStore);
      })
    ) {
      return;
    }
    void this._warpSystem.ejecutarTransicionMapa(payload, usarJuegoStore);
  }

  // Sistema de radar. Busca el interactuable más cercano y ejecuta su lógica.
  _manejarInteraccion() {
    if (
      this._dialogo?.activo ||
      this._introActiva ||
      this._secuencias?.activo ||
      this._reactTextoEstaticoActivo ||
      this._uiMenuLista?.activo ||
      this._uiConfirmStarter?.esActiva() ||
      !this._jugador
    ) {
      return;
    }

    if (this._flujoEleccionStarter) return;

    /** Si dos NPC están a la misma distancia (empate numérico), antes ganaba el primero en el array del mapa; eso hacía que Courtney (veneno) «comiera» a Jack (congelado) en la sala debug. */
    const candidatos = [];
    this._interactuables.forEach((obj) => {
      if (obj.sprite && !obj.sprite.visible && obj.tipo === 'pokeball') return;

      const ix = obj.xRadar ?? obj.sprite.x;
      const iy = obj.yRadar ?? obj.sprite.y;
      const dist = Phaser.Math.Distance.Between(this._jugador.x, this._jugador.y, ix, iy);
      const alcanceMax =
        obj.tipo === 'react_texto' || obj.tipo === 'pc' || obj.tipo === 'battle_debug'
          ? TAM_TILE * 3.25
          : obj.tipo === 'npc'
            ? TAM_TILE * 2.35
            : TAM_TILE * 1.8;
      if (dist <= alcanceMax) {
        candidatos.push({ obj, dist, nombreMapa: String(obj.nombreMapa ?? '') });
      }
    });

    if (!candidatos.length) return;

    candidatos.sort((a, b) => {
      const d = a.dist - b.dist;
      if (Math.abs(d) > 1e-4) return d;
      return a.nombreMapa.localeCompare(b.nombreMapa, 'es');
    });

    candidatos[0].obj.accion();
  }

  // ── Animación de intro nueva partida ──────

  _reproducirIntroNuevaPartida(tileX, tileY, configMapa) {
    this._introActiva = true;

    const timeoutSeguridad = this.time.delayedCall(5000, () => {
      this._introActiva = false;
      if (this._jugador) this._jugador.setAlpha(1);
      this.cameras.main.setAlpha(1);
      usarJuegoStore.getState().clearNuevaPartida();
      this._iniciarJuego(null);
    });

    if (!this._jugador) {
      timeoutSeguridad.remove();
      this._introActiva = false;
      usarJuegoStore.getState().clearNuevaPartida();
      this.cameras.main.setAlpha(1);
      this._iniciarJuego(null);
      return;
    }

    const cx = 80;
    const cy = 72;
    const escalaInicial = 5;

    let spriteIntro;
    if (this.textures.exists('jugador')) {
      spriteIntro = this.add.sprite(cx, cy, 'jugador', 1).setScale(escalaInicial).setDepth(50);
    } else {
      spriteIntro = this.add.rectangle(cx, cy, 10, 12, 0xff8000).setScale(escalaInicial).setDepth(50);
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);

    const destX = this._jugador.x;
    const destY = this._jugador.y;
    this._jugador.setAlpha(0);

    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: spriteIntro,
        scaleX: 1, scaleY: 1, x: destX, y: destY,
        duration: 1200, ease: 'Quad.easeIn',
        onComplete: () => {
          timeoutSeguridad.remove();
          spriteIntro.destroy();
          this._jugador.setAlpha(1);
          this._introActiva = false;

          usarJuegoStore.getState().clearNuevaPartida();

          if (!this._dialogo) {
            this._iniciarJuego(null);
            return;
          }

          this.time.delayedCall(200, () => {
            this._dialogo.mostrar(
              [
                '¡' + (usarJuegoStore.getState().nombreJugador || 'Tú') + '!',
                '¡El Prof. Elm quiere\nverte! ¡Date prisa!',
              ],
              () => {
                this._iniciarJuego(configMapa.bgm);
              },
              { hablante: 'MAMÁ' },
            );
          });
        },
      });
    });
  }

  // ── Placeholder de mapa ────────────────

  _crearEscenaPlaceholder(mapaKey, tileX, tileY, configMapa) {
    dibujarPlaceholderPorMapa(this, mapaKey, configMapa);

    this._jugador = new Jugador(this, tileX, tileY);
    this._teclado = crearTecladoJugador(this);
    this._dialogo = new SistemaDialogo(this);
    this._encuentros = null;

    this._configurarCamara(null);
    this._configurarMenu();
    this._secuencias = new SistemaSecuencias(this);
  }

  // ── Modo completo con tilemap ─────────────────────────────────────────

  _crearEscenaTilemap(mapaKey, tileX, tileY, configMapa) {
    try {
      const mapa = this.make.tilemap({ key: mapaKey });
      this._tilemapPhaser = mapa;
      if (!mapa.tilesets?.length) throw new Error(`No tileset found in map ${mapaKey}`);

      const tilesetCfg = TILESET_POR_MAPA[mapaKey];
      const texturaPorNombre =
        tilesetCfg && typeof tilesetCfg === 'object' && tilesetCfg.tilesetTexturePorNombre
          ? tilesetCfg.tilesetTexturePorNombre
          : null;
      const tilesetKeyUnico =
        typeof tilesetCfg === 'string' && tilesetCfg ? tilesetCfg : 'new_bark_town';

      // Enlazar cada tileset del JSON a la textura Phaser (un mapa puede usar varios PNG).
      // Tiled puede exportar tilesets duplicados o referencias externas (.tsx) que
      // Phaser no resuelve; se omiten sin romper la carga del mapa.
      const tilesetsEnlazados = [];
      const nombresYaEnlazados = new Set();
      for (const ts of mapa.tilesets) {
        if (!ts.name || nombresYaEnlazados.has(ts.name)) continue;
        const textureKey = texturaPorNombre
          ? resolverTexturaPorNombreTileset(texturaPorNombre, ts.name, tilesetKeyUnico)
          : tilesetKeyUnico;
        const enlazado = mapa.addTilesetImage(ts.name, textureKey);
        if (!enlazado) {
          console.warn(`[tilemap] ⚠ Tileset "${ts.name}" no enlazado (${textureKey}); omitido.`);
          continue;
        }
        nombresYaEnlazados.add(ts.name);
        tilesetsEnlazados.push(enlazado);
      }
      if (!tilesetsEnlazados.length) throw new Error(`No tileset could be linked for map ${mapaKey}`);
      const tilesetCapas = tilesetsEnlazados.length === 1 ? tilesetsEnlazados[0] : tilesetsEnlazados;

      // Evita posX/posY fuera del mapa (p. ej. fila 9 en mapa de 9 filas → desalineación)
      tileX = Phaser.Math.Clamp(tileX, 0, mapa.width - 1);
      tileY = Phaser.Math.Clamp(tileY, 0, mapa.height - 1);

      if (mapa.getLayer('suelo')) mapa.createLayer('suelo', tilesetCapas, 0, 0);
      if (mapa.getLayer('decoracion_bajo')) mapa.createLayer('decoracion_bajo', tilesetCapas, 0, 0);
      
      const capaHierba = mapa.getLayer('hierba_alta') ? mapa.createLayer('hierba_alta', tilesetCapas, 0, 0) : null;
      const capaColisiones = mapa.getLayer('colisiones') ? mapa.createLayer('colisiones', tilesetCapas, 0, 0) : null;
      const capaAlto = mapa.getLayer('decoracion_alto') ? mapa.createLayer('decoracion_alto', tilesetCapas, 0, 0) : null;
      
      if (capaColisiones) {
        capaColisiones.setCollisionByExclusion([-1]);
        if (!configMapa.esInterior) capaColisiones.setVisible(false);
      }
      if (capaAlto) capaAlto.setDepth(10);

      this._jugador = new Jugador(this, tileX, tileY);
      if (capaColisiones) {
        this._jugador.capas = { colisiones: capaColisiones };
        this.physics.add.collider(this._jugador, capaColisiones);
      }

      if (!configMapa.esInterior && capaHierba) {
        const tablaKey = `encuentros-${mapaKey}`;
        const tabla = this.cache.json.get(tablaKey);
        if (tabla) {
          this._encuentros = new SistemaEncuentros(this, capaHierba, tabla);
          this._jugador.on('paso', (tx, ty) => this._encuentros.comprobarPaso(tx, ty));
          this.events.once('encuentro', (pokemon) => this._iniciarBatalla(pokemon));
        }
      }

      this._npcs = [];
      this._pokeballs = []; 
      mapa.getObjectLayer('npcs')?.objects?.forEach((obj) => this._crearNpc(obj));
      mapa.getObjectLayer('eventos')?.objects?.forEach((obj) => {
        if (obj.name === 'chikorita' || obj.name === 'cyndaquil' || obj.name === 'totodile') {
          this._crearPokeball(obj);
        } else {
          this._crearZonaEvento(obj);
        }
      });

      this._npcs.forEach((npc) => {
        this.physics.add.collider(this._jugador, npc);
      });

      const tilesNpc = new Set();
      for (const npc of this._npcs) {
        const b = npc.getBounds();
        const t0x = Math.floor(b.left / TAM_TILE);
        const t1x = Math.floor((b.right - 1) / TAM_TILE);
        const t0y = Math.floor(b.top / TAM_TILE);
        const t1y = Math.floor((b.bottom - 1) / TAM_TILE);
        for (let ty = t0y; ty <= t1y; ty++) {
          for (let tx = t0x; tx <= t1x; tx++) {
            tilesNpc.add(`${tx},${ty}`);
          }
        }
      }
      this._jugador.setTilesBloqueadosNpc(tilesNpc);

      this._teclado = crearTecladoJugador(this);
      this._dialogo = new SistemaDialogo(this);

      if (this._bienvenidasPorTile.length) {
        this._jugador.on('paso', this._comprobarBienvenidasTrasPaso, this);
        this.time.delayedCall(0, () => this._comprobarBienvenidasTrasPaso());
      }
      this._configurarCamara(mapa);
      this._configurarMenu();
      this._secuencias = new SistemaSecuencias(this);
      comprobarNarrativaTrasTilemap(this, mapaKey);
    } catch (e) {
      console.error(`[_crearEscenaTilemap] Error cargando ${mapaKey}:`, e);
      this._tilemapPhaser = null;
      this._crearEscenaPlaceholder(mapaKey, tileX, tileY, configMapa);
    }
  }

  // ── Arrancar juego ────────────────────────────────

  _iniciarJuego(bgmKey) {
    this._introActiva = false;
    if (bgmKey && this.cache.audio.exists(bgmKey)) {
      this.sound.stopAll();
      this._musica = this.sound.add(bgmKey, {
        loop: true,
        volume: volumenBgmParaPhaser(),
      });
      this._musica.play();
    }
  }

  // ── Cámara ────────────────────────────────────────────────────────────

  _configurarCamara(mapa) {
    this.cameras.main.setZoom(1);
    this.cameras.main.startFollow(this._jugador, true, 1, 1);
    if (mapa) {
      this.cameras.main.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
      this.physics.world.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    }
  }

  // ── Menú in-game ──────────────────────────────────────────────────────

  _configurarMenu() {
    this.input.keyboard.on('keydown-X', () => {
      if (this._dialogo?.activo || this._introActiva || this._secuencias?.activo) return;
      if (this._uiMenuLista?.activo) return;
      if (this._reactTextoEstaticoActivo) return;
      const abrirReact = this.game.registry.get('callbacks')?.onAbrirMenuIngame;
      if (abrirReact) {
        this.scene.pause();
        abrirReact({
          resumePhaser: () => {
            this.scene.resume('EscenaOverworld');
          },
        });
        return;
      }
      this.scene.launch('EscenaMenu');
      this.scene.pause();
    });
  }

  _restaurarPokeballsTrasFalloStarter() {
    this._pokeballs?.forEach((pb) => {
      pb.setVisible(true);
      pb.setAlpha(1);
      pb.setScale(1);
    });
  }

  // ── Pokeballs de starter ──────────────────────────────────────────────

  _crearPokeball(obj) {
    if (usarJuegoStore.getState().starterElegido) return;

    // Por encima de `decoracion_alto` (depth 10); si no, la mesa tapa las Poké Balls.
    const depthPokeball = 15;
    const pokeball = this.add.sprite(obj.x + 8, obj.y + 8, 'pokeball').setDepth(depthPokeball);
    this._pokeballs.push(pokeball);

    const starterMap = { cyndaquil: 0, totodile: 1, chikorita: 2 };
    const starterIndex = starterMap[obj.name];
    const starter = STARTERS[starterIndex];
    const textureKey = obj.name;

    this._interactuables.push({
      sprite: pokeball,
      tipo: 'pokeball',
      nombreMapa: String(obj.name ?? ''),
      accion: () => {
        const st = usarJuegoStore.getState();
        if (st.starterElegido) return;

        const enLabElm = st.mapaActual === 'elm-lab' || st.mapaActual === 'elm_lab';
        if (enLabElm && !st.elmCharlaEleccionStarter) {
          this._dialogo.mostrar(
            [
              '¡Espera!',
              'Deberías hablar primero\ncon el PROF. ELM.',
              'Te explicará qué hacer\ncon los Pokémon de la mesa.',
            ],
            null,
            { hablante: 'PROF. ELM' },
          );
          return;
        }

        if (this.tweens.isTweening(pokeball) || this._uiConfirmStarter?.esActiva()) return;

        this._flujoEleccionStarter = true;
        this._jugador.setInputBloqueado(true);
        this.tweens.add({
          targets: pokeball,
          scale: 0.2,
          alpha: 0,
          duration: 160,
          ease: 'Quad.eIn',
          onComplete: () => {
            pokeball.setVisible(false);
            pokeball.setScale(1);
            pokeball.setAlpha(1);
            if (!this._uiConfirmStarter) this._uiConfirmStarter = new UIConfirmacionStarter(this);
            this._uiConfirmStarter.mostrar(starter, textureKey, (acepta) => {
              if (acepta) {
                void this._finalizarEleccionStarterAsync(starter);
              } else {
                pokeball.setVisible(true);
                pokeball.setAlpha(0);
                pokeball.setScale(0.35);
                this.tweens.add({
                  targets: pokeball,
                  alpha: 1,
                  scale: 1,
                  duration: 200,
                  ease: 'Back.easeOut',
                });
                this._dialogo.mostrar(['Está bien, tómate tu tiempo.'], () => {
                  this._jugador?.setInputBloqueado(false);
                  this._flujoEleccionStarter = false;
                });
              }
            });
          },
        });
      },
    });
  }

  /**
   * Persiste el starter en el servidor y sincroniza el store (equipo real en BD).
   */
  async _finalizarEleccionStarterAsync(starter) {
    const nombreJugador = usarJuegoStore.getState().nombreJugador || 'Tú';
    const token = usarAutenticacionStore.getState().token;

    if (!token) {
      this._restaurarPokeballsTrasFalloStarter();
      this._dialogo.mostrar(
        [
          'Necesitas iniciar sesión',
          'para guardar tu Pokémon',
          'en el servidor.',
        ],
        () => {
          this._jugador?.setInputBloqueado(false);
          this._flujoEleccionStarter = false;
        },
        { hablante: 'PROF. ELM' },
      );
      return;
    }

    try {
      await PuenteApi.elegirStarterServidor(starter.id);
      const stAntes = usarJuegoStore.getState();
      const posAntes = { posX: stAntes.posX, posY: stAntes.posY, mapaActual: stAntes.mapaActual };
      await PuenteApi.sincronizarEstadoDesdeServidor();
      usarJuegoStore.getState().setPosition(posAntes.posX, posAntes.posY, posAntes.mapaActual);
    } catch (e) {
      console.error('[starter]', e);
      this._restaurarPokeballsTrasFalloStarter();
      this._dialogo.mostrar(
        [
          '¡Vaya! Hubo un problema',
          'al registrar al POKéMON.',
          'Revisa tu conexión.',
        ],
        () => {
          this._jugador?.setInputBloqueado(false);
          this._flujoEleccionStarter = false;
        },
        { hablante: 'PROF. ELM' },
      );
      return;
    }

    if (sfxPermitido() && this.sound.get('sfx-obtener-starter')) {
      this.sound.play('sfx-obtener-starter', { volume: 0.7 });
    }

    const lineasObtenido = [
      `¡${nombreJugador} obtuvo a ${starter.nombre.toUpperCase()}!`,
      `¡Buena elección!\nCuida bien de ${starter.nombre}.`,
    ];

    this._dialogo.mostrar(
      lineasObtenido,
      () => {
        this._pokeballs.forEach((pb) => pb.setVisible(false));
        this._jugador?.setInputBloqueado(false);
        this._flujoEleccionStarter = false;
      },
      { hablante: 'PROF. ELM' },
    );
  }

  // ── NPCs ──────────────────────────────────────────────────────────────

  /**
   * Comportamiento post-diálogo (tienda, centro, entregas). Tiled 1.9+ pone la clase en `class`;
   * el parser de Phaser solo copia `type`, así que el valor suele perderse. Se compensa con prop
   * personalizada `tipo` y nombres de objeto conocidos del mapa debugger.
   */
  _tipoComportamientoNpcTiled(obj, props) {
    const desdeProp = String(WarpSystem.prop(props, 'tipo') ?? '').trim().toLowerCase();
    if (desdeProp) return desdeProp;
    const t = String(obj?.type ?? obj?.class ?? '').trim().toLowerCase();
    if (t) return t;
    const n = String(obj?.name ?? '').toLowerCase();
    if (n === 'dependiente') return 'tienda';
    if (n === 'enfermera') return 'cura';
    if (n === 'npc_regala_pokeballs' || n === 'npc_entrega_curacion_estados') return 'entregas';
    return '';
  }

  _crearNpc(obj) {
    const props = obj.properties ?? [];
    // Tiled: (x,y) + width/height del rectángulo; los pies van al borde inferior centrado (como pokeball obj.x+8, obj.y+8).
    const ow = typeof obj.width === 'number' && obj.width > 0 ? obj.width : TAM_TILE;
    const oh = typeof obj.height === 'number' && obj.height > 0 ? obj.height : TAM_TILE;
    const footX = obj.x + ow / 2;
    const footY = obj.y + oh;

    const texturasPorNombre = {
      'elm': 'elm', 'madre': 'madre', 'ayudante': 'cientifico',
      'rival': 'nino', 'aldeano': 'aldeano',
      dependiente: 'npc_clerk',
      enfermera: 'npc_mint',
      npc_entrega_curacion_estados: 'npc_chap',
      npc_regala_pokeballs: 'npc_ishihara',
      npc_explica: 'npc_imakuni',
      npc_captura: 'npc_pawn',
      npc_battle_normal: 'npc_jonathan',
      npc_battle_confuso: 'npc_jes',
      npc_battle_dormido: 'npc_yosuke',
      npc_battle_quemado: 'npc_rick',
      npc_battle_veneno: 'npc_courtney',
      npc_battle_paralisis: 'npc_kristin',
      npc_battle_congelado: 'npc_jack',
    };
    const npcTexture = texturasPorNombre[obj.name] || 'aldeano';
    const npc = this.add.sprite(footX, footY, npcTexture, 0).setOrigin(0.5, 1);
    // Por encima de `decoracion_alto` (depth 10); si no, mostradores / marcos tapan NPCs (p. ej. enfermera arriba del mapa).
    npc.setDepth(11);
    if (npcTexture.startsWith('npc_')) {
      npc.setScale(2);
    }

    // Cuerpo estático: el jugador no los empuja y el collider responde de forma estable.
    this.physics.add.existing(npc, true);
    const hitW = 12;
    const hitH = 10;
    npc.body.setSize(hitW, hitH);
    npc.body.setOffset((npc.displayWidth - hitW) / 2, npc.displayHeight - hitH);

    this._npcs.push(npc);
    
    const dialogo = WarpSystem.prop(props, 'dialogo');
    if (!dialogo || !String(dialogo).trim()) return;

    const npcBatallaTrasDialogo = this._npcDisparaBatallaTrasDialogo(obj, props);
    const npcBatallaEsCaptura = this._npcEsBatallaDebugCaptura(obj, props);

    const nombreJugador = usarJuegoStore.getState().nombreJugador || 'Tú';
    const lineasBase = String(dialogo).replaceAll('[JUGADOR]', nombreJugador).split('|');
    const esRival = obj.name === 'rival';
    const hablanteNpcProp = WarpSystem.prop(props, 'dialogo_hablante');
    const etiquetaNpc =
      hablanteNpcProp != null && String(hablanteNpcProp).trim() !== ''
        ? String(hablanteNpcProp).trim()
        : etiquetaHablanteNpc(obj.name);
    const cajaNpcOpts = etiquetaNpc ? { hablante: etiquetaNpc } : {};

    // Centro del rectángulo Tiled: mejor referencia si el sprite es alto (ancla en pies).
    const xRadar = obj.x + ow / 2;
    const yRadar = obj.y + oh / 2;

    // Registrar en el radar centralizado en lugar de anclar el teclado
    this._interactuables.push({
      sprite: npc,
      tipo: 'npc',
      nombreMapa: String(obj.name ?? ''),
      xRadar,
      yRadar,
      accion: () => {
        if (esRival) {
          this._dialogo.mostrar(lineasBase, () => {
            const dir = this._calcularDireccionOpuesta(this._jugador, npc);
            this._secuencias.ejecutar([
              this._secuencias.pasoTween(
                this._jugador,
                { x: this._jugador.x + dir.x * TAM_TILE, y: this._jugador.y + dir.y * TAM_TILE },
                150
              ),
            ]);
          }, cajaNpcOpts);
        } else {
          const store = usarJuegoStore.getState();
          const mapa = store.mapaActual;
          const enLabElm = mapa === 'elm-lab' || mapa === 'elm_lab';
          const esProfElm = obj.name === 'elm';
          const esMadre = obj.name === 'madre';
          const sinStarter = !store.starterElegido;
          const nombrePokemon =
            store.starter?.nombre ?? store.team[0]?.nombre ?? '';

          let lineas = lineasBase;
          if (esProfElm && enLabElm && store.starterElegido) {
            lineas = lineasProfElmTrasStarter(
              nombreJugador,
              nombrePokemon,
              store.pocionEntregada,
            );
          } else if (esMadre && store.starterElegido) {
            lineas = lineasMadreTrasStarter(nombreJugador, nombrePokemon);
          }

          const marcarCharlaElm =
            esProfElm && enLabElm && sinStarter
              ? () => {
                  usarJuegoStore.getState().setElmCharlaEleccionStarter();
                }
              : null;

          let onFinDialogo = marcarCharlaElm;
          if (npcBatallaTrasDialogo) {
            const prevOnFin = onFinDialogo;
            onFinDialogo = () => {
              if (typeof prevOnFin === 'function') prevOnFin();
              const payload = {
                ...this._payloadBatallaDebugDesdePar(obj, props, npcBatallaEsCaptura),
              };
              // Combate de captura / prueba: como un salvaje, se puede huir. Solo entrenador → no huir.
              if (!npcBatallaEsCaptura) {
                payload.esBatallaEntrenador = true;
              }
              this._iniciarBatalla(payload);
            };
          }

          const tipoObjeto = this._tipoComportamientoNpcTiled(obj, props);
          if (tipoObjeto === 'cura') {
            const prevOnFin = onFinDialogo;
            onFinDialogo = () => {
              if (typeof prevOnFin === 'function') prevOnFin();
              void this._flujoCurarCentroAsync();
            };
          } else if (tipoObjeto === 'tienda') {
            const prevOnFin = onFinDialogo;
            onFinDialogo = () => {
              if (typeof prevOnFin === 'function') prevOnFin();
              void this._flujoTiendaDebuggerAsync();
            };
          } else if (tipoObjeto === 'entregas') {
            const prevOnFin = onFinDialogo;
            onFinDialogo = () => {
              if (typeof prevOnFin === 'function') prevOnFin();
              void this._flujoEntregaDebugNpcAsync(String(obj.name ?? ''));
            };
          }

          this._dialogo.mostrar(lineas, onFinDialogo, cajaNpcOpts);
        }
      }
    });
  }

  async _flujoCurarCentroAsync() {
    this._jugador?.setInputBloqueado(true);
    const token = usarAutenticacionStore.getState().token;
    if (!token) {
      this._dialogo.mostrar(
        ['¡Hola! Para usar el CENTRO', 'necesitas registrarte', 'como entrenador.'],
        () => this._jugador?.setInputBloqueado(false),
      );
      return;
    }
    try {
      await PuenteApi.curarEquipoCentro();
      this._dialogo.mostrar(
        ['¡Tus POKéMON están', 'completamente curados!', '¡Esperamos verte pronto!'],
        () => this._jugador?.setInputBloqueado(false),
        { hablante: 'ENFERMERA' },
      );
    } catch (e) {
      console.error('[centro]', e);
      this._dialogo.mostrar(
        ['¡Oh, vaya! Algo fue mal.', 'Inténtalo de nuevo.'],
        () => this._jugador?.setInputBloqueado(false),
        { hablante: 'ENFERMERA' },
      );
    }
  }

  async _flujoTiendaDebuggerAsync() {
    this._jugador?.setInputBloqueado(true);
    const token = usarAutenticacionStore.getState().token;
    if (!token) {
      this._dialogo.mostrar(
        ['¡Bienvenido! Solo los', 'entrenadores registrados', 'pueden comprar aquí.'],
        () => this._jugador?.setInputBloqueado(false),
      );
      return;
    }
    let catalogo;
    try {
      catalogo = await PuenteApi.getCatalogoTienda();
    } catch (e) {
      console.error('[tienda]', e);
      this._dialogo.mostrar(
        ['Lo sentimos, hoy no', 'tenemos artículos en stock.'],
        () => this._jugador?.setInputBloqueado(false),
      );
      return;
    }
    if (!Array.isArray(catalogo) || catalogo.length === 0) {
      this._dialogo.mostrar(['Lo sentimos, hoy no', 'tenemos artículos en stock.'], () => this._jugador?.setInputBloqueado(false));
      return;
    }
    if (!this._uiMenuLista) this._uiMenuLista = new UIMenuLista(this);
    const labels = catalogo.map((it) => {
      const precio = Number(it.precio);
      const p = Number.isFinite(precio) ? precio : '?';
      const nom = String(it.nombre ?? '?').slice(0, 11);
      return `${nom} ${p}₽`;
    });
    labels.push('Salir');
    this._uiMenuLista.mostrar('COMPRAR', labels, {
      maxVisible: 7,
      onPick: (idx) => {
        if (idx === labels.length - 1) {
          this._cerrarMenuTienda();
          return;
        }
        const item = catalogo[idx];
        if (!item) {
          this._cerrarMenuTienda();
          return;
        }
        this._mostrarSelectorCantidadTienda(item);
      },
      onCancel: () => this._cerrarMenuTienda(),
    });
  }

  _cerrarMenuTienda() {
    this._uiMenuLista?.ocultar();
    this._cerrarSelectorCantidadTienda();
    this._jugador?.setInputBloqueado(false);
  }

  _cerrarSelectorCantidadTienda() {
    if (this._selectorCantidadContainer) {
      this._selectorCantidadContainer.destroy(true);
      this._selectorCantidadContainer = null;
    }
    if (this._selectorCantidadHandler) {
      this.input.keyboard.off('keydown', this._selectorCantidadHandler);
      this._selectorCantidadHandler = null;
    }
  }

  _mostrarSelectorCantidadTienda(item) {
    this._uiMenuLista?.ocultar();
    this._cerrarSelectorCantidadTienda();

    const precio = Number(item.precio) || 1;
    const dinero = usarJuegoStore.getState().money ?? 0;
    const maxAffordable = Math.max(1, Math.floor(dinero / precio));
    const maxCant = Math.min(99, maxAffordable);
    let cantidad = 1;

    const W = 120;
    const H = 60;
    const X = Math.floor((160 - W) / 2);
    const Y = 44;

    const container = this.add.container(0, 0).setDepth(115).setScrollFactor(0);
    this._selectorCantidadContainer = container;

    const marco = crearMarcoDialogoRetro(this, X, Y, W, H);
    container.add(marco);

    const estilo = estiloTextoDialogoRetro(W - 12);
    const nombre = String(item.nombre ?? '?').slice(0, 12);

    const txtNombre = this.add.text(X + 6, Y + 6, nombre, { ...estilo }).setOrigin(0);
    container.add(txtNombre);

    const txtCant = this.add.text(X + 6, Y + 20, `×${cantidad}`, { ...estilo, fontSize: '10px' }).setOrigin(0);
    container.add(txtCant);

    const txtTotal = this.add.text(X + 6, Y + 36, `Total: ${cantidad * precio}₽`, { ...estilo }).setOrigin(0);
    container.add(txtTotal);

    const txtHint = this.add.text(X + W - 6, Y + H - 8, '↑↓ · Z ok · X cancel', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '4px',
      fill: '#506070',
    }).setOrigin(1, 0);
    container.add(txtHint);

    const actualizar = () => {
      txtCant.setText(`×${cantidad}`);
      txtTotal.setText(`Total: ${cantidad * precio}₽`);
    };

    this._selectorCantidadHandler = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW':
          cantidad = Math.min(maxCant, cantidad + 1);
          actualizar();
          break;
        case 'ArrowDown': case 'KeyS':
          cantidad = Math.max(1, cantidad - 1);
          actualizar();
          break;
        case 'KeyZ': case 'Enter': case 'NumpadEnter':
          this._cerrarSelectorCantidadTienda();
          void this._ejecutarCompra(item, cantidad);
          break;
        case 'KeyX': case 'Escape':
          this._cerrarSelectorCantidadTienda();
          void this._flujoTiendaDebuggerAsync();
          break;
        default:
          break;
      }
    };
    this.input.keyboard.on('keydown', this._selectorCantidadHandler);
  }

  async _ejecutarCompra(item, cantidad) {
    this._jugador?.setInputBloqueado(true);
    const id = item.itemId ?? item.id;
    try {
      const res = await PuenteApi.comprarItem(id, cantidad);
      const texto = res?.mensaje != null ? String(res.mensaje) : '¡Gracias! ¡Vuelve pronto!';
      this._dialogo.mostrar(
        [texto],
        () => void this._flujoTiendaDebuggerAsync(),
        { hablante: 'DEPENDIENTE' },
      );
    } catch (e) {
      const apiMsg = e?.response?.data?.error;
      const linea = apiMsg != null ? String(apiMsg) : 'Lo siento, no hay stock suficiente.';
      console.error('[tienda] compra', e);
      this._dialogo.mostrar(
        [linea.length > 48 ? `${linea.slice(0, 44)}…` : linea],
        () => void this._flujoTiendaDebuggerAsync(),
        { hablante: 'DEPENDIENTE' },
      );
    }
  }

  async _flujoEntregaDebugNpcAsync(npcName) {
    this._jugador?.setInputBloqueado(true);
    const token = usarAutenticacionStore.getState().token;
    if (!token) {
      this._dialogo.mostrar(
        ['Los obsequios son solo', 'para entrenadores', 'registrados.'],
        () => this._jugador?.setInputBloqueado(false),
      );
      return;
    }
    try {
      if (npcName === 'npc_regala_pokeballs') {
        await PuenteApi.anadirInventarioServidor({ nombreItem: 'Poke-ball', cantidad: 10 });
        this._dialogo.mostrar(
          ['¡Espera! ¡Toma estas', '10 POKé BALLs! A un', 'joven entrenador le', 'harán falta.'],
          () => this._jugador?.setInputBloqueado(false),
          { hablante: 'REPARTO' },
        );
      } else if (npcName === 'npc_entrega_curacion_estados') {
        await PuenteApi.anadirInventarioServidor({ nombreItem: 'Full-restore', cantidad: 2 });
        await PuenteApi.anadirInventarioServidor({ nombreItem: 'Antidote', cantidad: 3 });
        await PuenteApi.anadirInventarioServidor({ nombreItem: 'Full-heal', cantidad: 2 });
        this._dialogo.mostrar(
          [
            '¡Toma esto para tu viaje!',
            'FULL RESTORE x2,',
            'ANTIDOTE x3, FULL HEAL x2.',
            'Cuida bien a tus POKéMON.',
          ],
          () => this._jugador?.setInputBloqueado(false),
          { hablante: 'REPARTO' },
        );
      } else {
        this._jugador?.setInputBloqueado(false);
      }
    } catch (e) {
      console.error('[entrega]', e);
      this._dialogo.mostrar(
        ['¡Vaya! Algo salió mal.', 'No pude entregarte', 'los objetos.'],
        () => this._jugador?.setInputBloqueado(false),
      );
    }
  }

  _calcularDireccionOpuesta(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return { x: dx > 0 ? 1 : -1, y: 0 };
    }
    return { x: 0, y: dy > 0 ? 1 : -1 };
  }

  // ── Zonas de evento (capa Tiled `eventos`) ───────────────────────────

  /** `tipo` en custom props, o class/type del objeto Tiled. */
  _tipoEventoTiled(obj, props) {
    const desdeProp = String(WarpSystem.prop(props, 'tipo') ?? '').trim();
    if (desdeProp) return desdeProp;
    const t = String(obj.type ?? '').trim();
    if (t) return t;
    return String(obj.class ?? '').trim();
  }

  _propBool(props, nombre) {
    const v = WarpSystem.prop(props, nombre);
    if (v === true || v === 1) return true;
    const s = String(v ?? '').trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'si' || s === 'sí';
  }

  /**
   * Estado de prueba para mensajes al inicio de batalla (`battle_*`, `npc_batalla_*`, prop `estadoSalvaje`, …).
   * @returns {string | null} clave interna o null si es combate “normal”.
   */
  _estadoBatallaDebugDesdeObjeto(obj, props) {
    const desdeProp = String(WarpSystem.prop(props, 'estadoSalvaje') ?? '')
      .trim()
      .toLowerCase();
    if (desdeProp) {
      return desdeProp === 'normal' ? null : desdeProp;
    }
    const n = String(obj.name ?? '').toLowerCase();
    const prefijos = ['battle_', 'npc_batalla_', 'npc_combate_', 'npc_battle_'];
    for (const pref of prefijos) {
      if (n.startsWith(pref)) {
        const suf = n.slice(pref.length);
        if (!suf || suf === 'normal') return null;
        return suf;
      }
    }
    return null;
  }

  /**
   * Payload para `_iniciarBatalla` desde props Tiled (zonas `battle` o NPCs con batalla tras diálogo).
   * - Zonas `battle_*` sin prefijo NPC: por defecto estado en el **jugador** (`estadoJugadorDebug`).
   * - Objetos `npc_battle_*`: los textos del mapa describen el **rival** → por defecto `estadoSalvajeDebug`.
   * - Prop `estadoAfectaA` = `rival` | `jugador` fuerza quién lleva el estado de prueba.
   */
  _payloadBatallaDebugDesdePar(obj, props, esTestCaptura) {
    const npcNombre = String(obj.name ?? '').trim().toLowerCase();
    const cfg = npcNombre === 'npc_captura'
      ? generarPokemonAleatorioCaptura()
      : CONFIG_NPC_BATALLA_DEBUG[npcNombre];

    const rawId = WarpSystem.prop(props, 'pokedexId');
    const rawNv = WarpSystem.prop(props, 'nivel');
    const pokedexId = Number.isFinite(Number(rawId))
      ? Number(rawId)
      : (cfg?.pokedexId ?? (esTestCaptura ? 137 : 19));
    const nivel = Number.isFinite(Number(rawNv)) ? Number(rawNv) : (cfg?.nivel ?? 5);
    const nombreHint = String(WarpSystem.prop(props, 'nombre') ?? '').trim();
    const nombrePorDefecto = cfg?.nombre ?? (esTestCaptura ? 'Porygon' : '???');
    const claveEstado = esTestCaptura ? null : this._estadoBatallaDebugDesdeObjeto(obj, props);
    const afecta = String(WarpSystem.prop(props, 'estadoAfectaA') ?? '').trim().toLowerCase();
    const esNpcBattleNombre = /^npc_battle_/i.test(npcNombre);
    let estadoEnRival;
    if (afecta === 'rival') estadoEnRival = true;
    else if (afecta === 'jugador') estadoEnRival = false;
    else estadoEnRival = esNpcBattleNombre;

    const pokemon = {
      id: pokedexId,
      nombre: nombreHint || nombrePorDefecto,
      nivel,
      ...(esTestCaptura ? { esDebugCaptura: true } : {}),
    };
    if (claveEstado) {
      if (estadoEnRival) pokemon.estadoSalvajeDebug = claveEstado;
      else pokemon.estadoJugadorDebug = claveEstado;
    }

    if (cfg?.ataquesMoveset?.length) {
      pokemon.ataquesMoveset = cfg.ataquesMoveset;
    } else {
      const ataqueProp = String(WarpSystem.prop(props, 'ataqueDemostracion') ?? '').trim();
      const rawDemoId = WarpSystem.prop(props, 'ataqueDemostracionId');
      const demoIdNum = Number.isFinite(Number(rawDemoId)) ? Number(rawDemoId) : null;
      if (demoIdNum != null && demoIdNum > 0) pokemon.ataqueDemostracionId = demoIdNum;
      let ataqueNombre = ataqueProp || null;
      if (!ataqueNombre && claveEstado && !esTestCaptura) {
        ataqueNombre = nombreAtaqueDemostracionPorEstadoDebug(claveEstado);
      }
      if (ataqueNombre) pokemon.ataqueDemostracionNombre = ataqueNombre;
    }

    return pokemon;
  }

  /** NPC: tras cerrar el diálogo, iniciar combate (Class `battle`/`captura` o prop `batallaTrasDialogo`). */
  _npcDisparaBatallaTrasDialogo(obj, props) {
    if (this._propBool(props, 'batallaTrasDialogo')) return true;
    const cls = String(obj.class ?? obj.type ?? '').trim().toLowerCase();
    return cls === 'battle' || cls === 'captura';
  }

  _npcEsBatallaDebugCaptura(obj, props) {
    if (this._propBool(props, 'esDebugCaptura')) return true;
    if (String(obj.name ?? '').trim().toLowerCase() === 'npc_captura') return true;
    const cls = String(obj.class ?? obj.type ?? '').trim().toLowerCase();
    return cls === 'captura';
  }

  _crearZonaEvento(obj) {
    const props = obj.properties ?? [];
    const tipo = this._tipoEventoTiled(obj, props);

    if (tipo === 'trigger_elm') {
      crearZonaTriggerElm(this, obj, this._warpSystem);
      return;
    }

    if (tipo === 'react_texto_estatico') {
      this._registrarInteraccionReactTexto(obj, props);
      return;
    }

    if (tipo === 'pc_jugador') {
      this._registrarInteraccionPc(obj);
      return;
    }

    if (tipo === 'battle' || tipo === 'captura') {
      this._registrarZonaBatallaDebugger(obj, props, tipo === 'captura');
      return;
    }

    if (WarpSystem.esWarpViaje(obj)) {
      this._warpSystem.registrarZonaWarp(
        obj,
        this._jugador,
        () => this._warpEstaBloqueado(),
        (parsed) => this._activarWarpDesdeObjeto(parsed)
      );
    }
  }

  /**
   * Texto React / diálogo Phaser para `react_texto_estatico`.
   * @returns {boolean} true si se mostró algo
   */
  _mostrarReactTextoEstatico(lineas, optsReactTexto) {
    if (this._reactTextoEstaticoActivo || !this._jugador) return false;
    const cb = this.game.registry.get('callbacks')?.onTextoEstatico;
    const L = lineas.length ? lineas : ['…'];
    if (!cb) {
      this._dialogo.mostrar(L, null, optsReactTexto);
      return true;
    }
    this._reactTextoEstaticoActivo = true;
    this._jugador.setInputBloqueado(true);
    cb({
      lineas: L,
      onCerrar: () => {
        this._reactTextoEstaticoActivo = false;
        this._jugador?.setInputBloqueado(false);
      },
    });
    return true;
  }

  /** Dispara mensajes `bienvenida_*` (o prop `dispararAlPaso`) al pisar la casilla, no solo con Z. */
  _comprobarBienvenidasTrasPaso() {
    if (!this._jugador || !this._bienvenidasPorTile?.length) return;
    if (this._introActiva || this._reactTextoEstaticoActivo || this._dialogo?.activo) return;
    const { x: jx, y: jy } = this._jugador.getTilePosicion();
    for (const b of this._bienvenidasPorTile) {
      if (b.disparado) continue;
      const d = Math.max(Math.abs(jx - b.tx), Math.abs(jy - b.ty));
      if (d <= b.radio) {
        b.disparado = true;
        this._mostrarReactTextoEstatico(b.lineas, b.optsReactTexto);
        break;
      }
    }
  }

  /** Texto estático en React (`onTextoEstatico`); prop Tiled `dialogo` con líneas separadas por `|`. */
  _registrarInteraccionReactTexto(obj, props) {
    const w = obj.width ?? TAM_TILE;
    const h = obj.height ?? TAM_TILE;
    const cx = obj.x + w / 2;
    const cy = obj.y + h / 2;

    const dialogoRaw = WarpSystem.prop(props, 'dialogo');
    const lineas = String(dialogoRaw ?? '…')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    const hablanteReact = String(WarpSystem.prop(props, 'dialogo_hablante') ?? '').trim();
    const optsReactTexto = hablanteReact ? { hablante: hablanteReact } : {};

    const nombreObj = String(obj.name ?? '').toLowerCase();
    const autoAlPaso =
      this._propBool(props, 'dispararAlPaso') || nombreObj.startsWith('bienvenida_');
    if (autoAlPaso) {
      const rawR = WarpSystem.prop(props, 'radioTiles');
      const radio = Number.isFinite(Number(rawR)) ? Math.max(0, Math.floor(Number(rawR))) : 1;
      this._bienvenidasPorTile.push({
        tx: Math.floor(cx / TAM_TILE),
        ty: Math.floor(cy / TAM_TILE),
        radio,
        disparado: false,
        lineas,
        optsReactTexto,
      });
      // Solo disparo al pisar la zona; no entra en el radar de Z (el alcance de `react_texto`
      // es mayor que el de NPCs y las bienvenidas cerca del mostrador tapaban enfermera / dependiente).
      return;
    }

    const marcador = this.add.rectangle(cx, cy, Math.max(8, w), Math.max(8, h), 0x000000, 0).setDepth(1);
    this._interactuables.push({
      sprite: marcador,
      tipo: 'react_texto',
      nombreMapa: String(obj.name ?? ''),
      accion: () => {
        this._mostrarReactTextoEstatico(lineas, optsReactTexto);
      },
    });
  }

  /**
   * Zona Z → inicia combate salvaje real (`EscenaBatalla`), misma ruta que encuentros.
   * Props opcionales: `pokedexId` (int), `nivel` (int), `nombre` (string).
   * Estado de prueba: prop `estadoSalvaje` o prefijo `battle_` en el nombre del objeto.
   */
  _registrarZonaBatallaDebugger(obj, props, esTestCaptura) {
    const w = obj.width ?? TAM_TILE;
    const h = obj.height ?? TAM_TILE;
    const cx = obj.x + w / 2;
    const cy = obj.y + h / 2;
    const marcador = this.add.rectangle(cx, cy, Math.max(8, w), Math.max(8, h), 0x000000, 0).setDepth(1);

    this._interactuables.push({
      sprite: marcador,
      tipo: 'battle_debug',
      nombreMapa: String(obj.name ?? ''),
      accion: () => {
        this._iniciarBatalla(this._payloadBatallaDebugDesdePar(obj, props, esTestCaptura));
      },
    });
  }

  /** PC de la habitación: menú Phaser + buzón con poción (store `pcPocionRetirada`). */
  _registrarInteraccionPc(obj) {
    const w = obj.width ?? TAM_TILE;
    const h = obj.height ?? TAM_TILE;
    const cx = obj.x + w / 2;
    const cy = obj.y + h / 2;
    const marcador = this.add.rectangle(cx, cy, Math.max(8, w), Math.max(8, h), 0x000000, 0).setDepth(1);

    this._interactuables.push({
      sprite: marcador,
      tipo: 'pc',
      nombreMapa: String(obj.name ?? ''),
      accion: () => this._abrirMenuPc(),
    });
  }

  _abrirMenuPc() {
    if (!this._jugador || this._uiMenuLista?.activo || this._dialogo?.activo) return;
    if (!this._uiMenuLista) this._uiMenuLista = new UIMenuLista(this);
    this._jugador.setInputBloqueado(true);
    this._mostrarMenuPcPrincipal();
  }

  _mostrarMenuPcPrincipal() {
    if (!this._uiMenuLista) return;
    this._uiMenuLista.mostrar('PC', ['Buzón de objetos', 'Salir'], {
      onPick: (i) => {
        if (i === 0) this._flujoBuzonPc();
        else this._cerrarMenuPc();
      },
      onCancel: () => this._cerrarMenuPc(),
    });
  }

  _flujoBuzonPc() {
    const store = usarJuegoStore.getState();
    if (store.pcPocionRetirada) {
      this._dialogo.mostrar(['El buzón está vacío.'], () => this._mostrarMenuPcPrincipal(), {
        hablante: 'PC',
      });
      return;
    }
    this._dialogo.mostrar(
      ['¡Hay una POCIÓN en el buzón!'],
      () => {
        if (!this._uiSiNo) this._uiSiNo = new UIOpcionSiNo(this);
        this._uiSiNo.mostrar('¿Retirar la POCIÓN?', (si) => {
          if (si) {
            void (async () => {
              const token = usarAutenticacionStore.getState().token;
              try {
                if (token) {
                  store.setPcPocionRetirada();
                  try {
                    await PuenteApi.anadirInventarioServidor({ nombreItem: 'Potion', cantidad: 1 });
                  } catch (e) {
                    usarJuegoStore.setState({ pcPocionRetirada: false });
                    throw e;
                  }
                  try {
                    await PuenteApi.guardarJuegoEnServidor(
                      usarJuegoStore.getState().construirPayloadGuardado(),
                    );
                  } catch (e) {
                    console.warn('[PC] guardar flags tras retirar poción', e);
                  }
                } else {
                  store.setPcPocionRetirada();
                  store.addInventario({ id: 'pocion', nombre: 'Poción', cantidad: 1 });
                }
                this._dialogo.mostrar(['¡Has recibido una POCIÓN!'], () => this._mostrarMenuPcPrincipal(), {
                  hablante: 'PC',
                });
              } catch (e) {
                console.error('[PC] inventario servidor', e);
                this._dialogo.mostrar(['¡Vaya! No se pudo', 'retirar el objeto.'], () => this._mostrarMenuPcPrincipal(), {
                  hablante: 'PC',
                });
              }
            })();
          } else {
            this._mostrarMenuPcPrincipal();
          }
        });
      },
      { hablante: 'PC' },
    );
  }

  _cerrarMenuPc() {
    this._uiMenuLista?.ocultar();
    this._jugador?.setInputBloqueado(false);
  }

  // ── Batalla ───────────────────────────────────────────────────────────

  _iniciarBatalla(pokemon) {
    // No usar input.keyboard.removeAllListeners(): la escena sigue viva en pausa tras el combate
    // y al hacer resume se perderían el Z de interacción y los handlers del diálogo hasta recrear la escena.
    this._musica?.stop();
    if (!this._jugador) return;
    void this._iniciarBatallaAsync(pokemon);
  }

  async _iniciarBatallaAsync(pokemon) {
    const { x, y } = this._jugador.getTilePosicion();
    usarJuegoStore.getState().setPosition(x, y, usarJuegoStore.getState().mapaActual);

    const token = usarAutenticacionStore.getState().token;
    if (!token) {
      this._dialogo.mostrar(
        ['Los entrenadores', 'registrados pueden', 'participar en batallas.'],
        () => {},
      );
      return;
    }

    const team = usarJuegoStore.getState().team ?? [];
    const hayPokemonVivo = team.some((p) => {
      const hp = p?.hpActual ?? p?.hp;
      return Number(hp) > 0;
    });
    if (team.length > 0 && !hayPokemonVivo) {
      this._dialogo.mostrar(
        ['¡Todos tus Pokémon', 'están debilitados!', 'Visita el Centro Pokémon.'],
        () => this._jugador?.setInputBloqueado(false),
      );
      return;
    }

    const debugEstadoRival = pokemon?.estadoSalvajeDebug;
    const debugEstadoJugador = pokemon?.estadoJugadorDebug;
    const debugCaptura = Boolean(pokemon?.esDebugCaptura);

    let salvaje = { ...pokemon };
    if (salvaje.pokemonUsuarioId == null && salvaje.id != null) {
      try {
        const prep = await PuenteApi.prepararSalvajePokemon({
          pokedexId: salvaje.id,
          nivel: salvaje.nivel ?? 5,
          ataquesMoveset: salvaje.ataquesMoveset,
          ataqueDemostracionId: salvaje.ataqueDemostracionId,
          ataqueDemostracionNombre: salvaje.ataqueDemostracionNombre,
        });
        salvaje = {
          ...salvaje,
          pokemonUsuarioId: prep.pokemonUsuarioId,
          pokedexId: prep.pokedexId ?? salvaje.id,
          id: prep.pokedexId ?? salvaje.id,
          nombre: prep.nombre ?? salvaje.nombre,
          nivel: prep.nivel ?? salvaje.nivel,
          hpActual: prep.hpActual,
          hpMax: prep.hpMax,
          ataque: prep.ataque,
          defensa: prep.defensa,
        };
      } catch (e) {
        console.error('[batalla] preparar salvaje', e);
        this._dialogo.mostrar(['No se pudo iniciar', 'el combate.'], () => {});
        return;
      }
    }

    if (debugEstadoRival) salvaje.estadoSalvajeDebug = debugEstadoRival;
    if (debugEstadoJugador) salvaje.estadoJugadorDebug = debugEstadoJugador;
    if (debugCaptura) salvaje.esDebugCaptura = true;

    this.scene.launch('EscenaTransicion', {
      siguiente: 'EscenaBatalla',
      datos: { pokemonSalvaje: salvaje },
    });
    this.scene.pause();
  }

  // ── Update ────────────────────────────────────────────────────────────

  update(_time, delta) {
    if (delta > 0) {
      this._deudaTiempoJuegoMs = (this._deudaTiempoJuegoMs ?? 0) + delta;
      if (this._deudaTiempoJuegoMs >= 1000) {
        const sec = Math.floor(this._deudaTiempoJuegoMs / 1000);
        this._deudaTiempoJuegoMs -= sec * 1000;
        usarJuegoStore.getState().acumularTiempoJuego(sec);
      }
    }
    if (!this._jugador || !this._teclado) return;
    if (
      this._dialogo?.activo ||
      this._introActiva ||
      this._secuencias?.activo ||
      this._cambiandoMapa ||
      this._reactTextoEstaticoActivo ||
      this._uiMenuLista?.activo ||
      this._uiConfirmStarter?.esActiva()
    ) {
      return;
    }
    this._jugador.update(normalizarTeclado(this._teclado));
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  shutdown() {
    if (this._onOpcionesAudio) {
      window.removeEventListener('bytes-opciones-audio', this._onOpcionesAudio);
    }
    if (this._aplicarVolumenBgmDesdeOpciones) {
      this.events.off('resume', this._aplicarVolumenBgmDesdeOpciones);
    }
    this._musica?.stop();
    this.events.off('encuentro');

    this._warpSystem?.shutdown();
    this._destruirTilemapActual();

    this._jugador?.off('paso', this._comprobarBienvenidasTrasPaso, this);

    // Protección para fugas de memoria
    this.input.keyboard.removeAllListeners(); 
    this._interactuables = [];
    this._bienvenidasPorTile = [];
  }
}