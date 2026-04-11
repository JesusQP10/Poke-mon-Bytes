import Phaser from 'phaser';
import Jugador, { crearTecladoJugador, normalizarTeclado } from '../entidades/Jugador';
import SistemaEncuentros from '../sistemas/SistemaEncuentros';
import SistemaDialogo from '../sistemas/SistemaDialogo';
import { usarJuegoStore } from '../../store/usarJuegoStore';
import SistemaSecuencias from '../sistemas/SistemaSecuencias';
import { STARTERS } from '../ui/UISeleccionStarter';
import UIOpcionSiNo from '../ui/UIOpcionSiNo';
import WarpSystem from '../sistemas/WarpSystem';

const TAM_TILE = 16;

// Configuración de mapas: qué tileset usa cada uno
const TILESET_POR_MAPA = {
  'player-room': 'new_bark_town',
  'player-house': 'new_bark_town',
  'new-bark-town': 'new_bark_town',
  'elm-lab': 'new_bark_town',
  'ruta-29': 'ruta_29_bg',
};

// Configuración de cada mapa: posición inicial, si es interior, BGM
const CONFIG_MAPAS = {
  'player-room': { esInterior: true, posXInicio: 5, posYInicio: 7, bgm: 'bgm-new-bark-town' },
  'player-house': { esInterior: true, posXInicio: 5, posYInicio: 5, bgm: 'bgm-new-bark-town' },
  'new-bark-town': { esInterior: false, posXInicio: 5, posYInicio: 5, bgm: 'bgm-new-bark-town' },
  'elm-lab': { esInterior: true, posXInicio: 6, posYInicio: 11, bgm: 'bgm-elm-lab' },
  'elm_lab': { esInterior: true, posXInicio: 6, posYInicio: 11, bgm: 'bgm-elm-lab' },
  // Mapa 30×9 tiles: filas válidas 0–8 (posY 9 queda fuera del tilemap)
  'ruta-29': { esInterior: false, posXInicio: 19, posYInicio: 8, bgm: 'bgm-overworld' },
};

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
  }

  _warpEstaBloqueado() {
    return Boolean(
      this._introActiva ||
      this._secuencias?.activo ||
      this._cambiandoMapa
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
    if (store.mapaActual === 'elm-lab' && store.starterElegido && !store.pocionEntregada) {
      this._ejecutarSecuenciaAyudante(() => {
        void this._warpSystem.ejecutarTransicionMapa(payload, usarJuegoStore);
      });
      return;
    }
    void this._warpSystem.ejecutarTransicionMapa(payload, usarJuegoStore);
  }

  // Sistema de radar. Busca el interactuable más cercano y ejecuta su lógica.
  _manejarInteraccion() {
    if (this._dialogo?.activo || this._introActiva || this._secuencias?.activo || !this._jugador) return;

    let objetivoMasCercano = null;
    let distanciaMinima = TAM_TILE * 1.8; // Distancia máxima de alcance

    this._interactuables.forEach(obj => {
      // Ignoramos Pokéballs invisibles (ya elegidas)
      if (obj.sprite && !obj.sprite.visible && obj.tipo === 'pokeball') return;

      const dist = Phaser.Math.Distance.Between(this._jugador.x, this._jugador.y, obj.sprite.x, obj.sprite.y);
      if (dist < distanciaMinima) {
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
            this._dialogo.mostrar([
              '¡' + (usarJuegoStore.getState().nombreJugador || 'Tú') + '!',
              '¡El Prof. Elm quiere\nverte! ¡Date prisa!',
            ], () => {
              this._iniciarJuego(configMapa.bgm);
            });
          });
        },
      });
    });
  }

  // ── Placeholder de mapa ────────────────

  _crearEscenaPlaceholder(mapaKey, tileX, tileY, configMapa) {
    if (configMapa.esInterior) {
      if (mapaKey === 'player-room') this._dibujarHabitacionJugador();
      else this._dibujarInteriorGenerico();
    } else {
      this._dibujarExteriorPlaceholder(mapaKey);
    }

    this._jugador = new Jugador(this, tileX, tileY);
    this._teclado = crearTecladoJugador(this);
    this._dialogo = new SistemaDialogo(this);
    this._encuentros = null;

    this._configurarCamara(null);
    this._configurarMenu();
    this._secuencias = new SistemaSecuencias(this);
  }

  _dibujarInteriorGenerico() {
    this.add.rectangle(80, 72, 160, 144, 0xc8a050).setOrigin(0.5);
    this.add.rectangle(80, 8, 160, 16, 0x806838).setOrigin(0.5);
    this.add.rectangle(4, 72, 8, 144, 0x806838).setOrigin(0.5);
    this.add.rectangle(156, 72, 8, 144, 0x806838).setOrigin(0.5);
    this.add.text(80, 72, 'INTERIOR', { fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#80500a' }).setOrigin(0.5).setAlpha(0.4);
  }

  _dibujarHabitacionJugador() {
    this.add.rectangle(80, 72, 160, 144, 0xc8a050).setOrigin(0.5);
    this.add.rectangle(80, 8, 160, 16, 0x806838).setOrigin(0.5);
    this.add.rectangle(4, 72, 8, 144, 0x806838).setOrigin(0.5);
    this.add.rectangle(156, 72, 8, 144, 0x806838).setOrigin(0.5);
    this.add.rectangle(136, 28, 24, 28, 0xe04040).setOrigin(0.5);
    this.add.rectangle(136, 16, 24, 8, 0xffffff).setOrigin(0.5);
    this.add.rectangle(28, 24, 20, 20, 0x8888cc).setOrigin(0.5);
    this.add.rectangle(28, 36, 14, 6, 0x555588).setOrigin(0.5);
    this.add.rectangle(80, 18, 28, 14, 0x333333).setOrigin(0.5);
    this.add.rectangle(80, 136, 20, 12, 0x885520).setOrigin(0.5);
    this.add.text(80, 136, '▼', { fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#fff' }).setOrigin(0.5);
    this.add.text(80, 72, 'HABITACIÓN', { fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#80500a' }).setOrigin(0.5).setAlpha(0.4);
  }

  _dibujarExteriorPlaceholder(mapaKey) {
    this.add.rectangle(80, 72, 160, 144, 0x78c850).setOrigin(0.5);
    const graficos = this.add.graphics();
    graficos.lineStyle(0.5, 0x5aaa3a, 0.4);
    for (let x = 0; x <= 160; x += TAM_TILE) graficos.lineBetween(x, 0, x, 144);
    for (let y = 0; y <= 144; y += TAM_TILE) graficos.lineBetween(0, y, 160, y);
    const nombre = mapaKey.replace(/-/g, ' ').toUpperCase();
    this.add.text(80, 40, nombre, { fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#1a6010', align: 'center' }).setOrigin(0.5);
  }

  // ── Modo completo con tilemap ─────────────────────────────────────────

  _crearEscenaTilemap(mapaKey, tileX, tileY, configMapa) {
    try {
      const mapa = this.make.tilemap({ key: mapaKey });
      this._tilemapPhaser = mapa;
      const tilesetData = mapa.tilesets[0];
      if (!tilesetData) throw new Error(`No tileset found in map ${mapaKey}`);

      const tilesetName = tilesetData.name;
      const tilesetKey = TILESET_POR_MAPA[mapaKey] || 'new_bark_town';
      const tileset = mapa.addTilesetImage(tilesetName, tilesetKey);
      
      if (!tileset) throw new Error(`Failed to load tileset: ${tilesetName} -> ${tilesetKey}`);

      // Evita posX/posY fuera del mapa (p. ej. fila 9 en mapa de 9 filas → desalineación)
      tileX = Phaser.Math.Clamp(tileX, 0, mapa.width - 1);
      tileY = Phaser.Math.Clamp(tileY, 0, mapa.height - 1);

      if (mapa.getLayer('suelo')) mapa.createLayer('suelo', tileset, 0, 0);
      if (mapa.getLayer('decoracion_bajo')) mapa.createLayer('decoracion_bajo', tileset, 0, 0);
      
      const capaHierba = mapa.getLayer('hierba_alta') ? mapa.createLayer('hierba_alta', tileset, 0, 0) : null;
      const capaColisiones = mapa.getLayer('colisiones') ? mapa.createLayer('colisiones', tileset, 0, 0) : null;
      const capaAlto = mapa.getLayer('decoracion_alto') ? mapa.createLayer('decoracion_alto', tileset, 0, 0) : null;
      
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
      mapa.getObjectLayer('npcs')?.objects.forEach(obj => this._crearNpc(obj));
      mapa.getObjectLayer('eventos')?.objects.forEach(obj => {
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
      this._comprobarSecuenciasNarrativas(mapaKey);
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
      this._musica = this.sound.add(bgmKey, { loop: true, volume: 0.6 });
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
      this.scene.launch('EscenaMenu');
      this.scene.pause();
    });
  }

  // ── Secuencias narrativas ─────────────────────────────────────────────

  _comprobarSecuenciasNarrativas(mapaKey) {
    const store = usarJuegoStore.getState();
    if (mapaKey === 'player-house' && !store.pokegearEntregado) {
      this._ejecutarSecuenciaMadre();
    }
  }

  _ejecutarSecuenciaMadre() {
    const store = usarJuegoStore.getState();
    const nombre = store.nombreJugador || 'Tú';

    const madrePx = { x: 5 * 16 + 8, y: 3 * 16 + 8 };
    const spriteMadre = this.add.rectangle(madrePx.x, madrePx.y, 12, 16, 0xff88aa).setDepth(5);

    const lineas = [
      `¡${nombre}!`,
      'Nuestro vecino, el PROF. ELM,\nte estaba buscando.',
      'Dijo que quería pedirte\nun favor.',
      '¡Ah! Casi lo olvido.',
      'Tu POKÉGEAR ha vuelto\ndel taller de reparaciones.',
      '¡Aquí tienes!',
    ];

    this._secuencias.ejecutar([
      this._secuencias.pasoTween(spriteMadre, { x: this._jugador.x, y: this._jugador.y - 16 }, 800),
      this._secuencias.pasoDialogo(this._dialogo, lineas),
      this._secuencias.pasoStore(() => usarJuegoStore.getState().setPokegearEntregado()),
    ], () => {
      spriteMadre.destroy();
    });
  }

  _ejecutarSecuenciaElm() {
    const store = usarJuegoStore.getState();
    const nombre = store.nombreJugador || 'Tú';

    const elmX = 6 * TAM_TILE + TAM_TILE / 2;
    const elmY = 3 * TAM_TILE + TAM_TILE;
    const targetX = elmX;
    const targetY = elmY + TAM_TILE * 2; 

    const lineasElm = [
      `¡${nombre}! Justo a tiempo.`,
      'Estoy investigando los Pokémon\nde la región Johto.',
      '¿Me harías un favor?\nNecesito que lleves uno\nde mis Pokémon.',
      'Están en la mesa. Elige el que más te guste.',
    ];

    this._secuencias.ejecutar([
      this._secuencias.pasoTween(this._jugador, { x: targetX, y: targetY }, 800),
      this._secuencias.pasoDialogo(this._dialogo, lineasElm),
    ]);
  }

  _ejecutarSecuenciaAyudante(onFin) {
    const lineas = [
      '¡Espera! El Prof. Elm me\npidió que te diera esto.',
      '¡Has recibido una POCIÓN!',
    ];

    this._secuencias.ejecutar([
      this._secuencias.pasoDialogo(this._dialogo, lineas),
      this._secuencias.pasoStore(() => {
        const store = usarJuegoStore.getState();
        store.setPocionEntregada();
        store.addInventario({ id: 'pocion', nombre: 'Poción', cantidad: 1 });
      }),
    ], onFin);
  }

  // ── Pokeballs de starter ──────────────────────────────────────────────

  _crearPokeball(obj) {
    if (usarJuegoStore.getState().starterElegido) return;

    const pokeball = this.add.sprite(obj.x + 8, obj.y + 8, 'pokeball').setDepth(5);
    this._pokeballs.push(pokeball);
    
    const starterMap = { 'cyndaquil': 0, 'totodile': 1, 'chikorita': 2 };
    const starterIndex = starterMap[obj.name];
    const starter = STARTERS[starterIndex];
    
    const pokemonSprite = this.add.sprite(obj.x + 8, obj.y - 8, obj.name).setDepth(6).setVisible(false);
    
    // Registrar en el radar centralizado
    this._interactuables.push({
      sprite: pokeball,
      tipo: 'pokeball',
      accion: () => {
        if (usarJuegoStore.getState().starterElegido) return;

        pokeball.setVisible(false);
        pokemonSprite.setVisible(true);
        
        const lineasPresentacion = [`¡Es ${starter.nombre.toUpperCase()}!`];
        
        this._dialogo.mostrar(lineasPresentacion, () => {
          this._mostrarConfirmacionStarter(starter, pokeball, pokemonSprite);
        });
      }
    });
  }
  
  _mostrarConfirmacionStarter(starter, pokeball, pokemonSprite) {
    const store = usarJuegoStore.getState();
    const nombreJugador = store.nombreJugador || 'Tú';
    
    if (!this._uiSiNo) this._uiSiNo = new UIOpcionSiNo(this);
    
    const pregunta = `¿Llevarás a\n${starter.nombre.toUpperCase()}?`;
    
    this._uiSiNo.mostrar(pregunta, (respuesta) => {
      if (respuesta) {
        if (this.sound.get('sfx-obtener-starter')) {
          this.sound.play('sfx-obtener-starter', { volume: 0.7 });
        }
        
        const lineasObtenido = [
          `¡${nombreJugador} obtuvo a ${starter.nombre.toUpperCase()}!`,
          `¡Buena elección!\nCuida bien de ${starter.nombre}.`,
        ];
        
        this._dialogo.mostrar(lineasObtenido, () => {
          usarJuegoStore.getState().setStarterElegido({
            id: starter.id, nombre: starter.nombre, esStarter: true,
            nivel: 5, hpActual: 20, hpMax: 20, ataque: 12, defensa: 10,
          });
          
          this._pokeballs.forEach(pb => pb.setVisible(false));
          pokemonSprite.destroy();
        });
      } else {
        pokeball.setVisible(true);
        pokemonSprite.setVisible(false);
        this._dialogo.mostrar(['Está bien, tómate tu tiempo.'], null);
      }
    });
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
    const lineas = dialogo.replaceAll('[JUGADOR]', nombreJugador).split('|');
    const esRival = obj.name === 'rival';

    // Registrar en el radar centralizado en lugar de anclar el teclado
    this._interactuables.push({
      sprite: npc,
      tipo: 'npc',
      accion: () => {
        if (esRival) {
          this._dialogo.mostrar(lineas, () => {
            const dir = this._calcularDireccionOpuesta(this._jugador, npc);
            this._secuencias.ejecutar([
              this._secuencias.pasoTween(
                this._jugador,
                { x: this._jugador.x + dir.x * TAM_TILE, y: this._jugador.y + dir.y * TAM_TILE },
                150
              ),
            ]);
          });
        } else {
          this._dialogo.mostrar(lineas);
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
      this._crearZonaTriggerElm(obj);
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

  _crearZonaTriggerElm(obj) {
    const width = obj.width ?? TAM_TILE;
    const height = obj.height ?? TAM_TILE;
    const centroX = obj.x + width / 2;
    const centroY = obj.y + height / 2;

    const zona = this.add.zone(centroX, centroY, width, height);
    this.physics.add.existing(zona, true);

    const estado = {
      estabaEnZona: this.physics.overlap(this._jugador, zona),
      yaActivado: false,
    };

    this.physics.add.overlap(this._jugador, zona, () => {
      if (estado.estabaEnZona || estado.yaActivado || this._introActiva || this._secuencias?.activo || this._cambiandoMapa) return;

      const store = usarJuegoStore.getState();
      if (!store.starterElegido) {
        estado.yaActivado = true;
        this._ejecutarSecuenciaElm();
      }
    });

    this._warpSystem.agregarZonaParaWorldstep(zona, estado);
  }

  // ── Batalla ───────────────────────────────────────────────────────────

  _iniciarBatalla(pokemon) {
    this.input.keyboard.removeAllListeners(); // Limpieza antes de la batalla
    this._musica?.stop();
    if (!this._jugador) return;
    const { x, y } = this._jugador.getTilePosicion();
    usarJuegoStore.getState().setPosition(x, y, usarJuegoStore.getState().mapaActual);
    this.scene.launch('EscenaTransicion', {
      siguiente: 'EscenaBatalla',
      datos: { pokemonSalvaje: pokemon },
    });
    this.scene.pause();
  }

  // ── Update ────────────────────────────────────────────────────────────

  update() {
    if (!this._jugador || !this._teclado) return;
    if (this._dialogo?.activo || this._introActiva || this._secuencias?.activo || this._cambiandoMapa) return;
    this._jugador.update(normalizarTeclado(this._teclado));
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  shutdown() {
    this._musica?.stop();
    this.events.off('encuentro');

    this._warpSystem?.shutdown();
    this._destruirTilemapActual();

    // Protección para fugas de memoria
    this.input.keyboard.removeAllListeners(); 
    this._interactuables = [];
  }
}