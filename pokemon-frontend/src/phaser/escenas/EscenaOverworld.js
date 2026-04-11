import Phaser from 'phaser';
import Jugador, { crearTecladoJugador, normalizarTeclado } from '../entidades/Jugador';
import SistemaEncuentros from '../sistemas/SistemaEncuentros';
import SistemaDialogo from '../sistemas/SistemaDialogo';
import { usarJuegoStore } from '../../store/usarJuegoStore';
import SistemaSecuencias from '../sistemas/SistemaSecuencias';
import { STARTERS } from '../ui/UISeleccionStarter';
import UIOpcionSiNo from '../ui/UIOpcionSiNo';

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
  'elm-lab': { esInterior: true, posXInicio: 5, posYInicio: 8, bgm: 'bgm-elm-lab' },
  'elm_lab': { esInterior: true, posXInicio: 5, posYInicio: 8, bgm: 'bgm-elm-lab' },
  'ruta-29': { esInterior: false, posXInicio: 19, posYInicio: 9, bgm: 'bgm-overworld' },
};

export default class EscenaOverworld extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaOverworld' });
  }

  init(data) {
    // Si se llega desde batalla o transición de mapa con datos, usarlos
    this._datosEntrada = data ?? {};
  }

  create() {
    this._introActiva = false;
    const store = usarJuegoStore.getState();
    const mapa = store.mapaActual;
    const esNuevaPartida = store.esNuevaPartida;
    const configMapa = CONFIG_MAPAS[mapa] ?? CONFIG_MAPAS['player-room'];

    console.log(`[EscenaOverworld.create] ========================================`);
    console.log(`[EscenaOverworld.create] Mapa solicitado: ${mapa}`);
    console.log(`[EscenaOverworld.create] Es nueva partida: ${esNuevaPartida}`);
    console.log(`[EscenaOverworld.create] Config mapa:`, configMapa);

    const tileX = esNuevaPartida ? configMapa.posXInicio : (store.posX ?? configMapa.posXInicio);
    const tileY = esNuevaPartida ? configMapa.posYInicio : (store.posY ?? configMapa.posYInicio);

    // Verificar si el tilemap existe en cache
    let tieneAssets = this.cache.tilemap.exists(mapa);
    
    // Si no existe, intentar buscarlo con diferentes variaciones
    if (!tieneAssets) {
      const variaciones = [mapa, mapa.replace('-', '_'), mapa.replace('_', '-')];
      for (const key of variaciones) {
        if (this.cache.tilemap.exists(key)) {
          console.log(`[EscenaOverworld] Encontrado tilemap con key alternativa: ${key}`);
          tieneAssets = true;
          break;
        }
      }
    }
    
    console.log(`[EscenaOverworld] Tilemap existe en cache: ${tieneAssets}`);
    console.log(`[EscenaOverworld] Keys de tilemaps en cache:`, Object.keys(this.cache.tilemap.entries.entries));
    console.log(`[EscenaOverworld] Keys de texturas en cache:`, this.textures.list);

    // Intentar cargar tilemap real, si falla usar placeholder (dios quiera que no)
    if (tieneAssets) {
      try {
        this._crearEscenaTilemap(mapa, tileX, tileY, configMapa);
      } catch (e) {
        console.error(`[create] ❌ Error cargando tilemap ${mapa}:`, e);
        console.error(`[create] Stack trace:`, e.stack);
        this._crearEscenaPlaceholder(mapa, tileX, tileY, configMapa);
      }
    } else {
      console.warn(`[create] ⚠️ Tilemap ${mapa} no encontrado en cache, usando placeholder`);
      this._crearEscenaPlaceholder(mapa, tileX, tileY, configMapa);
    }

    if (esNuevaPartida) {
      this._reproducirIntroNuevaPartida(tileX, tileY, configMapa);
    } else {
      this._iniciarJuego(configMapa.bgm);
    }
  }

  // ── Animación de intro nueva partida (sprite grande → se encoge) ──────

  _reproducirIntroNuevaPartida(tileX, tileY, configMapa) {
    // Bloquear controles durante la intro
    this._introActiva = true;

    // Timeout de seguridad: si después de 5 segundos la intro no termina, forzar inicio
    const timeoutSeguridad = this.time.delayedCall(5000, () => {
      console.warn('[EscenaOverworld] Timeout de seguridad activado - forzando inicio del juego');
      this._introActiva = false;
      if (this._jugador) this._jugador.setAlpha(1);
      this.cameras.main.setAlpha(1);
      usarJuegoStore.getState().clearNuevaPartida();
      this._iniciarJuego(null);
    });

    // Verificar que el jugador existe
    if (!this._jugador) {
      console.error('[EscenaOverworld] Jugador no inicializado para intro');
      timeoutSeguridad.remove();
      this._introActiva = false;
      usarJuegoStore.getState().clearNuevaPartida();
      this.cameras.main.setAlpha(1);
      this._iniciarJuego(null);
      return;
    }

    // Sprite grande centrado 
    const cx = 80;
    const cy = 72;
    const escalaInicial = 5;

    let spriteIntro;
    if (this.textures.exists('jugador')) {
      spriteIntro = this.add.sprite(cx, cy, 'jugador', 1)
        .setScale(escalaInicial)
        .setDepth(50);
    } else {
      spriteIntro = this.add.rectangle(cx, cy, 10, 12, 0xff8000)
        .setScale(escalaInicial)
        .setDepth(50);
    }

    // Fade in desde negro
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Posición final del jugador real en píxeles
    const destX = this._jugador.x;
    const destY = this._jugador.y;

    // Ocultar jugador real durante la animación
    this._jugador.setAlpha(0);

    // Delay inicial antes de animar
    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: spriteIntro,
        scaleX: 1,
        scaleY: 1,
        x: destX,
        y: destY,
        duration: 1200,
        ease: 'Quad.easeIn',
        onComplete: () => {
          timeoutSeguridad.remove();
          spriteIntro.destroy();
          this._jugador.setAlpha(1);
          this._introActiva = false;

          // Marcar que ya no es nueva partida
          usarJuegoStore.getState().clearNuevaPartida();

          // Verificar que el sistema de diálogo existe
          if (!this._dialogo) {
            console.error('[EscenaOverworld] Sistema de diálogo no inicializado');
            this._iniciarJuego(null);
            return;
          }

          // Diálogo inicial: mamá habla
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

  // ── Placeholder de mapa (sin assets de Tiled todavía) ────────────────

  _crearEscenaPlaceholder(mapaKey, tileX, tileY, configMapa) {
    if (configMapa.esInterior) {
      if (mapaKey === 'player-room') {
        this._dibujarHabitacionJugador();
      } else {
        this._dibujarInteriorGenerico();
      }
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
    // Suelo de madera
    this.add.rectangle(80, 72, 160, 144, 0xc8a050).setOrigin(0.5);

    // Paredes
    this.add.rectangle(80, 8, 160, 16, 0x806838).setOrigin(0.5);
    this.add.rectangle(4, 72, 8, 144, 0x806838).setOrigin(0.5);
    this.add.rectangle(156, 72, 8, 144, 0x806838).setOrigin(0.5);

    // Etiqueta
    this.add.text(80, 72, 'INTERIOR', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#80500a',
    }).setOrigin(0.5).setAlpha(0.4);
  }

  _dibujarHabitacionJugador() {
    // Suelo de madera
    this.add.rectangle(80, 72, 160, 144, 0xc8a050).setOrigin(0.5);

    // Paredes
    this.add.rectangle(80, 8, 160, 16, 0x806838).setOrigin(0.5);   // pared norte
    this.add.rectangle(4, 72, 8, 144, 0x806838).setOrigin(0.5);    // pared oeste
    this.add.rectangle(156, 72, 8, 144, 0x806838).setOrigin(0.5);  // pared este

    // Cama (esquina superior derecha)
    this.add.rectangle(136, 28, 24, 28, 0xe04040).setOrigin(0.5);  // colchón
    this.add.rectangle(136, 16, 24, 8, 0xffffff).setOrigin(0.5);   // almohada

    // PC (esquina superior izquierda)
    this.add.rectangle(28, 24, 20, 20, 0x8888cc).setOrigin(0.5);   // monitor
    this.add.rectangle(28, 36, 14, 6, 0x555588).setOrigin(0.5);    // base

    // TV (pared norte, centro)
    this.add.rectangle(80, 18, 28, 14, 0x333333).setOrigin(0.5);

    // Escaleras/puerta sur (salida)
    this.add.rectangle(80, 136, 20, 12, 0x885520).setOrigin(0.5);
    this.add.text(80, 136, '▼', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#fff',
    }).setOrigin(0.5);

    // Etiqueta
    this.add.text(80, 72, 'HABITACIÓN', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#80500a',
    }).setOrigin(0.5).setAlpha(0.4);
  }

  _dibujarExteriorPlaceholder(mapaKey) {
    this.add.rectangle(80, 72, 160, 144, 0x78c850).setOrigin(0.5);

    const graficos = this.add.graphics();
    graficos.lineStyle(0.5, 0x5aaa3a, 0.4);
    for (let x = 0; x <= 160; x += TAM_TILE) graficos.lineBetween(x, 0, x, 144);
    for (let y = 0; y <= 144; y += TAM_TILE) graficos.lineBetween(0, y, 160, y);

    const nombre = mapaKey.replace(/-/g, ' ').toUpperCase();
    this.add.text(80, 40, nombre, {
      fontFamily: '"Press Start 2P"', fontSize: '6px',
      fill: '#1a6010', align: 'center',
    }).setOrigin(0.5);
  }

  // ── Modo completo con tilemap ─────────────────────────────────────────

  _crearEscenaTilemap(mapaKey, tileX, tileY, configMapa) {
    try {
      console.log(`[_crearEscenaTilemap] Creando tilemap: ${mapaKey}`);
      const mapa = this.make.tilemap({ key: mapaKey });
      
      console.log(`[_crearEscenaTilemap] Tilemap creado:`, mapa);
      console.log(`[_crearEscenaTilemap] Tilesets disponibles:`, mapa.tilesets);
      
      // Obtener el tileset del JSON
      const tilesetData = mapa.tilesets[0];
      if (!tilesetData) {
        throw new Error(`No tileset found in map ${mapaKey}`);
      }

      const tilesetName = tilesetData.name;
      const tilesetKey = TILESET_POR_MAPA[mapaKey] || 'new_bark_town';
      
      console.log(`[_crearEscenaTilemap] Tileset name from JSON: ${tilesetName}`);
      console.log(`[_crearEscenaTilemap] Tileset key to use: ${tilesetKey}`);
      console.log(`[_crearEscenaTilemap] Texture exists in cache:`, this.textures.exists(tilesetKey));
      
      // Cargar el tileset
      const tileset = mapa.addTilesetImage(tilesetName, tilesetKey);
      if (!tileset) {
        throw new Error(`Failed to load tileset: ${tilesetName} -> ${tilesetKey}`);
      }
      
      console.log(`[_crearEscenaTilemap] Tileset cargado correctamente:`, tileset);

      // Crear solo las capas que existen
      console.log('[_crearEscenaTilemap] Capas disponibles:', mapa.layers.map(l => l.name));
      
      if (mapa.getLayer('suelo')) {
        mapa.createLayer('suelo', tileset, 0, 0);
        console.log('[_crearEscenaTilemap] Capa suelo creada');
      }
      if (mapa.getLayer('decoracion_bajo')) {
        mapa.createLayer('decoracion_bajo', tileset, 0, 0);
        console.log('[_crearEscenaTilemap] Capa decoracion_bajo creada');
      }
      const capaHierba = mapa.getLayer('hierba_alta') ? mapa.createLayer('hierba_alta', tileset, 0, 0) : null;
      const capaColisiones = mapa.getLayer('colisiones') ? mapa.createLayer('colisiones', tileset, 0, 0) : null;
      const capaAlto = mapa.getLayer('decoracion_alto') ? mapa.createLayer('decoracion_alto', tileset, 0, 0) : null;
      
      if (capaAlto) {
        console.log('[_crearEscenaTilemap] Capa decoracion_alto creada:', {
          visible: capaAlto.visible,
          depth: capaAlto.depth,
          alpha: capaAlto.alpha,
          x: capaAlto.x,
          y: capaAlto.y
        });
      } else {
        console.log('[_crearEscenaTilemap] Capa decoracion_alto NO existe en el mapa');
      }

      if (capaColisiones) {
        capaColisiones.setCollisionByExclusion([-1]);
        // Ocultar colisiones solo en mapas exteriores
        if (!configMapa.esInterior) {
          capaColisiones.setVisible(false);
        }
      }
      if (capaAlto) capaAlto.setDepth(10);

      // Crear jugador
      this._jugador = new Jugador(this, tileX, tileY);
      if (capaColisiones) {
        this._jugador.capas = { colisiones: capaColisiones };
        this.physics.add.collider(this._jugador, capaColisiones);
      }

      // Sistema de encuentros (solo en exteriores)
      if (!configMapa.esInterior && capaHierba) {
        const tablaKey = `encuentros-${mapaKey}`;
        const tabla = this.cache.json.get(tablaKey);
        if (tabla) {
          this._encuentros = new SistemaEncuentros(this, capaHierba, tabla);
          this._jugador.on('paso', (tx, ty) => this._encuentros.comprobarPaso(tx, ty));
          this.events.once('encuentro', (pokemon) => this._iniciarBatalla(pokemon));
        }
      }

      // NPCs y eventos
      this._npcs = [];
      this._pokeballs = []; // Array para las pokeballs
      mapa.getObjectLayer('npcs')?.objects.forEach(obj => this._crearNpc(obj));
      mapa.getObjectLayer('eventos')?.objects.forEach(obj => {
        // Si es una pokeball de starter, crear sprite interactuable
        if (obj.name === 'chikorita' || obj.name === 'cyndaquil' || obj.name === 'totodile') {
          this._crearPokeball(obj);
        } else {
          this._crearZonaEvento(obj);
        }
      });

      // Añadir colisiones con NPCs después de crearlos
      this._npcs.forEach(npc => {
        this.physics.add.collider(this._jugador, npc);
      });

      // Sistemas
      this._teclado = crearTecladoJugador(this);
      this._dialogo = new SistemaDialogo(this);
      this._configurarCamara(mapa);
      this._configurarMenu();
      this._secuencias = new SistemaSecuencias(this);
      this._comprobarSecuenciasNarrativas(mapaKey);
    } catch (e) {
      console.error(`[_crearEscenaTilemap] Error cargando ${mapaKey}:`, e);
      this._crearEscenaPlaceholder(mapaKey, tileX, tileY, configMapa);
    }
  }

  // ── Arrancar juego (música + control) ────────────────────────────────

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
    // La secuencia de Elm se activa mediante una zona de trigger en el mapa
  }

  _ejecutarSecuenciaMadre() {
    // Buscar el sprite de la madre en la capa npcs
    // Como el sprite ya fue creado en _crearNpc, necesitamos encontrarlo
    // Usamos una referencia guardada o buscamos por nombre
    const store = usarJuegoStore.getState();
    const nombre = store.nombreJugador || 'Tú';

    // Crear sprite temporal de la madre si no existe referencia
    // La madre empieza en tile (5,3) según el tilemap
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
      this._secuencias.pasoTween(
        spriteMadre,
        { x: this._jugador.x, y: this._jugador.y - 16 },
        800
      ),
      this._secuencias.pasoDialogo(this._dialogo, lineas),
      this._secuencias.pasoStore(() => usarJuegoStore.getState().setPokegearEntregado()),
    ], () => {
      spriteMadre.destroy();
    });
  }

  _ejecutarSecuenciaElm() {
    const store = usarJuegoStore.getState();
    const nombre = store.nombreJugador || 'Tú';

    // Posición de Elm según el JSON (x:96, y:48 en píxeles = tile 6, 3)
    const elmX = 6 * TAM_TILE + TAM_TILE / 2;
    const elmY = 3 * TAM_TILE + TAM_TILE;
    
    // Posición objetivo del jugador (frente a Elm)
    const targetX = elmX;
    const targetY = elmY + TAM_TILE * 2; // 2 tiles abajo de Elm

    const lineasElm = [
      `¡${nombre}! Justo a tiempo.`,
      'Estoy investigando los Pokémon\nde la región Johto.',
      '¿Me harías un favor?\nNecesito que lleves uno\nde mis Pokémon.',
      'Están en la mesa. Elige el que más te guste.',
    ];

    this._secuencias.ejecutar([
      // Mover al jugador hacia Elm
      this._secuencias.pasoTween(
        this._jugador,
        { x: targetX, y: targetY },
        800
      ),
      // Diálogo de Elm
      this._secuencias.pasoDialogo(this._dialogo, lineasElm),
    ]);
    
    // Después del diálogo, el jugador puede moverse libremente y elegir una pokeball
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
    console.log('[_crearPokeball] Creando pokeball:', obj.name, 'en posición:', obj.x, obj.y);
    const store = usarJuegoStore.getState();
    
    // Si ya eligió starter, no mostrar las pokeballs
    if (store.starterElegido) {
      console.log('[_crearPokeball] Starter ya elegido, no crear pokeball');
      return;
    }
    
    // Crear sprite de pokeball
    const pokeball = this.add.sprite(obj.x + 8, obj.y + 8, 'pokeball').setDepth(5);
    console.log('[_crearPokeball] Pokeball creada en:', pokeball.x, pokeball.y, 'depth:', pokeball.depth);
    this._pokeballs.push(pokeball);
    
    // Mapeo de nombres a índices de starter
    const starterMap = {
      'cyndaquil': 0,   // STARTERS[0]
      'totodile': 1,    // STARTERS[1]
      'chikorita': 2    // STARTERS[2]
    };
    
    const starterIndex = starterMap[obj.name];
    const starter = STARTERS[starterIndex];
    
    // Crear sprite del Pokémon (oculto inicialmente)
    const pokemonSprite = this.add.sprite(obj.x + 8, obj.y - 8, obj.name).setDepth(6).setVisible(false);
    
    // Interacción con Z
    const handlerInteraccion = () => {
      if (this._dialogo?.activo || this._secuencias?.activo || store.starterElegido) return;
      
      const dist = Phaser.Math.Distance.Between(this._jugador.x, this._jugador.y, pokeball.x, pokeball.y);
      if (dist >= TAM_TILE * 1.5) return;
      
      // Mostrar el Pokémon
      pokeball.setVisible(false);
      pokemonSprite.setVisible(true);
      
      // Mostrar diálogo de presentación
      const lineasPresentacion = [
        `¡Es ${starter.nombre.toUpperCase()}!`,
      ];
      
      this._dialogo.mostrar(lineasPresentacion, () => {
        // Mostrar cuadro de confirmación Sí/No
        this._mostrarConfirmacionStarter(starter, pokeball, pokemonSprite);
      });
    };
    
    this.input.keyboard.on('keydown-Z', handlerInteraccion);
  }
  
  _mostrarConfirmacionStarter(starter, pokeball, pokemonSprite) {
    const store = usarJuegoStore.getState();
    const nombreJugador = store.nombreJugador || 'Tú';
    
    // Crear UI de Sí/No si no existe
    if (!this._uiSiNo) {
      this._uiSiNo = new UIOpcionSiNo(this);
    }
    
    const pregunta = `¿Llevarás a\n${starter.nombre.toUpperCase()}?`;
    
    this._uiSiNo.mostrar(pregunta, (respuesta) => {
      if (respuesta) {
        // Usuario eligió SÍ
        // Reproducir sonido de obtener starter
        if (this.sound.get('sfx-obtener-starter')) {
          this.sound.play('sfx-obtener-starter', { volume: 0.7 });
        }
        
        const lineasObtenido = [
          `¡${nombreJugador} obtuvo a ${starter.nombre.toUpperCase()}!`,
          `¡Buena elección!\nCuida bien de ${starter.nombre}.`,
        ];
        
        this._dialogo.mostrar(lineasObtenido, () => {
          // Guardar starter
          usarJuegoStore.getState().setStarterElegido({
            id: starter.id,
            nombre: starter.nombre,
            esStarter: true,
            nivel: 5,
            hpActual: 20,
            hpMax: 20,
            ataque: 12,
            defensa: 10,
          });
          
          // Ocultar todas las pokeballs y sprites de Pokémon
          this._pokeballs.forEach(pb => pb.setVisible(false));
          pokemonSprite.destroy();
        });
      } else {
        // Usuario eligió NO
        // Volver a mostrar la pokeball y ocultar el Pokémon
        pokeball.setVisible(true);
        pokemonSprite.setVisible(false);
        
        const lineasCancelacion = [
          'Está bien, tómate tu tiempo.',
        ];
        
        this._dialogo.mostrar(lineasCancelacion, null);
      }
    });
  }

  // ── NPCs ──────────────────────────────────────────────────────────────

  _crearNpc(obj) {
    const texturasPorNombre = {
  'elm': 'elm',
  'madre': 'madre',
  'ayudante': 'cientifico',
  'rival': 'nino',
  'aldeano': 'aldeano'
  };
  const npcTexture = texturasPorNombre[obj.name] || 'aldeano';
  const npc = this.add.sprite(obj.x, obj.y, npcTexture, 0).setOrigin(0.5, 1);
    
    // Añadir física al NPC
    this.physics.add.existing(npc, false);
    npc.body.setImmovable(true);
    npc.body.setSize(12, 12); // Tamaño del body de colisión
    npc.body.setOffset(2, 4); // Ajustar offset para que coincida con el sprite
    
    // Guardar NPC para añadir colisión después
    this._npcs.push(npc);
    
    const dialogo = obj.properties?.find(p => p.name === 'dialogo')?.value;
    if (!dialogo) return;

    const nombreJugador = usarJuegoStore.getState().nombreJugador || 'Tú';
    const lineas = dialogo.replaceAll('[JUGADOR]', nombreJugador).split('|');
    const esRival = obj.name === 'rival';

    this.input.keyboard.on('keydown-Z', () => {
      if (this._dialogo?.activo || this._introActiva || this._secuencias?.activo) return;
      const dist = Phaser.Math.Distance.Between(this._jugador.x, this._jugador.y, npc.x, npc.y);
      if (dist >= TAM_TILE * 1.8) return;

      if (esRival) {
        this._dialogo.mostrar(lineas, () => {
          // Empujar al jugador 1 tile (empujon de plata como en juego original)
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

  // ── Zonas de evento (transiciones de mapa) ───────────────────────────

  _crearZonaEvento(obj) {
    // Tiled da esquina superior izquierda, Phaser Zone usa centro
    const width = obj.width ?? TAM_TILE;
    const height = obj.height ?? TAM_TILE;
    const centroX = obj.x + width / 2;
    const centroY = obj.y + height / 2;
    
    const zona = this.add.zone(centroX, centroY, width, height);
    this.physics.add.existing(zona, true);

    // Verificar si el jugador ya está en la zona al inicio
    let estabaEnZona = this.physics.overlap(this._jugador, zona);
    let yaActivado = false;

    this.physics.add.overlap(this._jugador, zona, () => {
      // Si ya estaba en la zona al cargar, no activar hasta que salga
      if (estabaEnZona) return;
      
      if (yaActivado || this._introActiva || this._secuencias?.activo) return;
      
      const props = obj.properties ?? [];
      
      // Verificar si es un trigger especial (como trigger_elm)
      const tipo = props.find(p => p.name === 'tipo')?.value;
      if (tipo === 'trigger_elm') {
        const store = usarJuegoStore.getState();
        if (!store.starterElegido) {
          yaActivado = true;
          this._ejecutarSecuenciaElm();
        }
        return;
      }
      
      // Si no es un trigger especial, es un warp normal
      const destino = props.find(p => p.name === 'destino')?.value;
      const posX    = props.find(p => p.name === 'posX')?.value ?? 5;
      const posY    = props.find(p => p.name === 'posY')?.value ?? 5;
      if (!destino) return;

      yaActivado = true;

      // Interceptar salida del lab para secuencia del ayudante (poción)
      const store = usarJuegoStore.getState();
      const mapaActual = store.mapaActual;
      if (mapaActual === 'elm-lab' && store.starterElegido && !store.pocionEntregada) {
        this._ejecutarSecuenciaAyudante(() => this._cambiarMapa(destino, posX, posY));
      } else {
        this._cambiarMapa(destino, posX, posY);
      }
    });

    // Detectar cuando sale de la zona para resetear flags
    this.physics.world.on('worldstep', () => {
      const ahoraEnZona = this.physics.overlap(this._jugador, zona);
      if (estabaEnZona && !ahoraEnZona) {
        estabaEnZona = false;
      }
      if (!ahoraEnZona) {
        yaActivado = false;
      }
    });
  }

  _cambiarMapa(destino, posX, posY) {
    this._musica?.stop();
    usarJuegoStore.getState().setPosition(posX, posY, destino);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart();
    });
  }

  // ── Batalla ───────────────────────────────────────────────────────────

  _iniciarBatalla(pokemon) {
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
    if (this._dialogo?.activo || this._introActiva || this._secuencias?.activo) return;
    this._jugador.update(normalizarTeclado(this._teclado));
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  shutdown() {
    this._musica?.stop();
    this.events.off('encuentro');
  }
}
