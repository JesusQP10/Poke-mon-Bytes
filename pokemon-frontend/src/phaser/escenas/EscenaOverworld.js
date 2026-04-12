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
import WarpSystem from '../sistemas/WarpSystem';
import {
  TAM_TILE,
  TILESET_POR_MAPA,
  CONFIG_MAPAS,
  dibujarPlaceholderPorMapa,
  comprobarNarrativaTrasTilemap,
  crearZonaTriggerElm,
  intentarWarpConSecuenciaAyudante,
} from '../mapas';
import { lineasProfElmTrasStarter, lineasMadreTrasStarter } from '../mapas/dialogosPostStarter';
import { STATS_MENU_FALLBACK_POR_POKEDEX } from '../../config/statsCombateMenuFallback';
import { volumenBgmParaPhaser, sfxPermitido } from '../../config/opcionesCliente';
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
    this._tilemapPhaser = null;
    this._warpSystem = new WarpSystem(this, { tileSize: TAM_TILE, fadeMs: 250 });

    const store = usarJuegoStore.getState();
    const mapa = store.mapaActual;
    const esNuevaPartida = store.esNuevaPartida;
    const configMapa = CONFIG_MAPAS[mapa] ?? CONFIG_MAPAS['player-room'];

    const tileX = esNuevaPartida ? configMapa.posXInicio : (store.posX ?? configMapa.posXInicio);
    const tileY = esNuevaPartida ? configMapa.posYInicio : (store.posY ?? configMapa.posYInicio);

    let tieneAssets = this.cache.tilemap.exists(mapa);
    
    if (!tieneAssets) {
      const variaciones = [mapa, mapa.replace('-', '_'), mapa.replace('_', '-')];
      for (const key of variaciones) {
        if (this.cache.tilemap.exists(key)) {
          tieneAssets = true;
          break;
        }
      }
    }
    
    if (tieneAssets) {
      try {
        this._crearEscenaTilemap(mapa, tileX, tileY, configMapa);
      } catch (e) {
        console.error(`[create] ❌ Error cargando tilemap ${mapa}:`, e);
        this._crearEscenaPlaceholder(mapa, tileX, tileY, configMapa);
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
    this.events.once(Phaser.Scenes.Events.POSTUPDATE, () => {
      this._warpSystem?.sincronizarPresenciaJugadorEnZonas();
    });

    this._aplicarVolumenBgmDesdeOpciones = () => {
      const v = volumenBgmParaPhaser();
      if (this._musica) {
        this._musica.setVolume(v);
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

    let objetivoMasCercano = null;
    let distanciaMinima = Infinity;

    this._interactuables.forEach((obj) => {
      if (obj.sprite && !obj.sprite.visible && obj.tipo === 'pokeball') return;

      const dist = Phaser.Math.Distance.Between(this._jugador.x, this._jugador.y, obj.sprite.x, obj.sprite.y);
      const alcanceMax =
        obj.tipo === 'react_texto' || obj.tipo === 'pc'
          ? TAM_TILE * 3.25
          : TAM_TILE * 1.8;
      if (dist <= alcanceMax && dist < distanciaMinima) {
        distanciaMinima = dist;
        objetivoMasCercano = obj;
      }
    });

    if (objetivoMasCercano) {
      objetivoMasCercano.accion();
    }
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

      const tilesetKey = TILESET_POR_MAPA[mapaKey] || 'new_bark_town';
      // Enlazar cada tileset del JSON a la textura cargada (mismo PNG puede repetirse con distinto firstgid en Tiled).
      const tilesetsEnlazados = [];
      for (const ts of mapa.tilesets) {
        const enlazado = mapa.addTilesetImage(ts.name, tilesetKey);
        if (!enlazado) throw new Error(`Failed to load tileset: ${ts.name} -> ${tilesetKey}`);
        tilesetsEnlazados.push(enlazado);
      }
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

      this._npcs.forEach(npc => {
        this.physics.add.collider(this._jugador, npc);
      });

      this._teclado = crearTecladoJugador(this);
      this._dialogo = new SistemaDialogo(this);
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
      await PuenteApi.sincronizarEstadoDesdeServidor();
    } catch (e) {
      console.error('[starter]', e);
      this._restaurarPokeballsTrasFalloStarter();
      this._dialogo.mostrar(
        [
          'No se pudo registrar',
          'al Pokémon en el servidor.',
          'Revisa la conexión.',
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

  _crearNpc(obj) {
    const texturasPorNombre = {
      'elm': 'elm', 'madre': 'madre', 'ayudante': 'cientifico',
      'rival': 'nino', 'aldeano': 'aldeano'
    };
    const npcTexture = texturasPorNombre[obj.name] || 'aldeano';
    const npc = this.add.sprite(obj.x, obj.y, npcTexture, 0).setOrigin(0.5, 1);
    
    this.physics.add.existing(npc, false);
    npc.body.setImmovable(true);
    npc.body.setSize(12, 12); 
    npc.body.setOffset(2, 4); 
    
    this._npcs.push(npc);
    
    const dialogo = obj.properties?.find(p => p.name === 'dialogo')?.value;
    if (!dialogo) return;

    const nombreJugador = usarJuegoStore.getState().nombreJugador || 'Tú';
    const lineasBase = dialogo.replaceAll('[JUGADOR]', nombreJugador).split('|');
    const esRival = obj.name === 'rival';
    const hablanteNpcProp = obj.properties?.find((p) => p.name === 'dialogo_hablante')?.value;
    const etiquetaNpc =
      hablanteNpcProp != null && String(hablanteNpcProp).trim() !== ''
        ? String(hablanteNpcProp).trim()
        : etiquetaHablanteNpc(obj.name);
    const cajaNpcOpts = etiquetaNpc ? { hablante: etiquetaNpc } : {};

    // Registrar en el radar centralizado en lugar de anclar el teclado
    this._interactuables.push({
      sprite: npc,
      tipo: 'npc',
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
                  try {
                    usarJuegoStore.getState().guardarPartidaLocal();
                  } catch {
                    /* caché opcional */
                  }
                }
              : null;
          this._dialogo.mostrar(lineas, marcarCharlaElm, cajaNpcOpts);
        }
      }
    });
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

  _crearZonaEvento(obj) {
    const props = obj.properties ?? [];
    const tipo = String(WarpSystem.prop(props, 'tipo') ?? '').trim();

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

    if (WarpSystem.esWarpViaje(obj)) {
      this._warpSystem.registrarZonaWarp(
        obj,
        this._jugador,
        () => this._warpEstaBloqueado(),
        (parsed) => this._activarWarpDesdeObjeto(parsed)
      );
    }
  }

  /** Texto estático en React (`onTextoEstatico`); prop Tiled `dialogo` con líneas separadas por `|`. */
  _registrarInteraccionReactTexto(obj, props) {
    const w = obj.width ?? TAM_TILE;
    const h = obj.height ?? TAM_TILE;
    const cx = obj.x + w / 2;
    const cy = obj.y + h / 2;
    const marcador = this.add.rectangle(cx, cy, Math.max(8, w), Math.max(8, h), 0x000000, 0).setDepth(1);

    const dialogoRaw = WarpSystem.prop(props, 'dialogo');
    const lineas = String(dialogoRaw ?? '…')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    const hablanteReact = String(WarpSystem.prop(props, 'dialogo_hablante') ?? '').trim();
    const optsReactTexto = hablanteReact ? { hablante: hablanteReact } : {};

    this._interactuables.push({
      sprite: marcador,
      tipo: 'react_texto',
      accion: () => {
        if (this._reactTextoEstaticoActivo || !this._jugador) return;
        const cb = this.game.registry.get('callbacks')?.onTextoEstatico;
        if (!cb) {
          this._dialogo.mostrar(lineas.length ? lineas : ['…'], null, optsReactTexto);
          return;
        }
        this._reactTextoEstaticoActivo = true;
        this._jugador.setInputBloqueado(true);
        cb({
          lineas: lineas.length ? lineas : ['…'],
          onCerrar: () => {
            this._reactTextoEstaticoActivo = false;
            this._jugador?.setInputBloqueado(false);
          },
        });
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
      this._dialogo.mostrar(['No hay objetos en el buzón.'], () => this._mostrarMenuPcPrincipal(), {
        hablante: 'PC',
      });
      return;
    }
    this._dialogo.mostrar(
      ['Hay una POCION en el buzón.'],
      () => {
        if (!this._uiSiNo) this._uiSiNo = new UIOpcionSiNo(this);
        this._uiSiNo.mostrar('¿Retirar la POCION?', (si) => {
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
                  try {
                    usarJuegoStore.getState().guardarPartidaLocal();
                  } catch {
                    /* opcional */
                  }
                }
                this._dialogo.mostrar(['Has retirado la POCION.'], () => this._mostrarMenuPcPrincipal(), {
                  hablante: 'PC',
                });
              } catch (e) {
                console.error('[PC] inventario servidor', e);
                this._dialogo.mostrar(['No se pudo retirar', 'el objeto.'], () => this._mostrarMenuPcPrincipal(), {
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
    this.input.keyboard.removeAllListeners(); // Limpieza antes de la batalla
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
        ['Inicia sesión', 'para poder combatir.'],
        () => {},
      );
      return;
    }

    let salvaje = { ...pokemon };
    if (salvaje.pokemonUsuarioId == null && salvaje.id != null) {
      try {
        const prep = await PuenteApi.prepararSalvajePokemon({
          pokedexId: salvaje.id,
          nivel: salvaje.nivel ?? 5,
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

    // Protección para fugas de memoria
    this.input.keyboard.removeAllListeners(); 
    this._interactuables = [];
  }
}