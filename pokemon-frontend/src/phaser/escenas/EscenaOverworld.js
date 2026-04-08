import Phaser from 'phaser';
import Jugador, { crearTecladoJugador, normalizarTeclado } from '../entidades/Jugador';
import SistemaEncuentros from '../sistemas/SistemaEncuentros';
import SistemaDialogo from '../sistemas/SistemaDialogo';
import { usarJuegoStore } from '../../store/usarJuegoStore';

const TAM_TILE = 16;

// Configuración de cada mapa: posición inicial nueva partida, BGM, interiores...
const CONFIG_MAPAS = {
  'player-house': { esInterior: true,  posXInicio: 3, posYInicio: 3, bgm: null },
  'new-bark-town': { esInterior: false, posXInicio: 5, posYInicio: 5, bgm: 'bgm-overworld' },
  'elm-lab':       { esInterior: true,  posXInicio: 5, posYInicio: 8, bgm: null },
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
    const store = usarJuegoStore.getState();
    const mapa = store.mapaActual;
    const esNuevaPartida = store.esNuevaPartida;
    const configMapa = CONFIG_MAPAS[mapa] ?? CONFIG_MAPAS['player-house'];

    // Posición: nueva partida → inicio del mapa; continuación → posición guardada
    const tileX = esNuevaPartida ? configMapa.posXInicio : (store.posX ?? configMapa.posXInicio);
    const tileY = esNuevaPartida ? configMapa.posYInicio : (store.posY ?? configMapa.posYInicio);

    const tieneAssets = this.cache.tilemap.exists(mapa);

    if (tieneAssets) {
      this._crearEscenaTilemap(mapa, tileX, tileY, configMapa);
    } else {
      this._crearEscenaPlaceholder(mapa, tileX, tileY, configMapa);
    }

    if (esNuevaPartida) {
      this._reproducirIntroNuevaPartida(tileX, tileY);
    } else {
      this._iniciarJuego(configMapa.bgm);
    }
  }

  // ── Animación de intro nueva partida (sprite grande → se encoge) ──────

  _reproducirIntroNuevaPartida(tileX, tileY) {
    // Bloquear controles durante la intro
    this._introActiva = true;

    // Sprite grande centrado (usa el jugador ya creado como referencia de posición final)
    // Si no hay spritesheet, usar un rectángulo de color
    const cx = 80;
    const cy = 72;
    const escalaInicial = 5;

    let spriteIntro;
    if (this.textures.exists('jugador')) {
      spriteIntro = this.add.sprite(cx, cy, 'jugador', 1)
        .setScale(escalaInicial)
        .setDepth(50);
    } else {
      // Placeholder: cuadrado del color del jugador
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
          spriteIntro.destroy();
          this._jugador.setAlpha(1);
          this._introActiva = false;

          // Marcar que ya no es nueva partida
          usarJuegoStore.getState().clearNuevaPartida();

          // Diálogo inicial: mamá habla
          this.time.delayedCall(200, () => {
            this._dialogo.mostrar([
              '¡' + (usarJuegoStore.getState().nombreJugador || 'Tú') + '!',
              '¡El Prof. Elm quiere\nverte! ¡Date prisa!',
            ], () => {
              this._iniciarJuego(null); // habitación → sin BGM de exterior
            });
          });
        },
      });
    });
  }

  // ── Placeholder de mapa (sin assets de Tiled todavía) ────────────────

  _crearEscenaPlaceholder(mapaKey, tileX, tileY, configMapa) {
    if (configMapa.esInterior) {
      this._dibujarHabitacionPlaceholder();
    } else {
      this._dibujarExteriorPlaceholder(mapaKey);
    }

    this._jugador = new Jugador(this, tileX, tileY);
    this._teclado = crearTecladoJugador(this);
    this._dialogo = new SistemaDialogo(this);
    this._encuentros = null;

    this._configurarCamara(null);
    this._configurarMenu();
  }

  _dibujarHabitacionPlaceholder() {
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

  // Tilesets usados por cada mapa (nombre en Tiled JSON → clave Phaser)
  // El nombre en Tiled debe coincidir exactamente con el primer argumento.
  static TILESETS_POR_MAPA = {
    'player-house':  [['players_room', 'players_room']],
    'new-bark-town': [['johto', 'johto'], ['johto_modern', 'johto_modern'], ['house', 'house']],
    'elm-lab':       [['lab', 'lab']],
  };

  _crearEscenaTilemap(mapaKey, tileX, tileY, configMapa) {
    const mapa = this.make.tilemap({ key: mapaKey });
    const defsTileset = EscenaOverworld.TILESETS_POR_MAPA[mapaKey] ?? [['johto', 'johto']];
    const tilesets = defsTileset
      .map(([nombreTiled, claveFaser]) => mapa.addTilesetImage(nombreTiled, claveFaser))
      .filter(Boolean);

    mapa.createLayer('suelo', tilesets, 0, 0);
    mapa.createLayer('decoracion_bajo', tilesets, 0, 0);

    const capaHierba = mapa.createLayer('hierba_alta', tilesets, 0, 0);
    const capaColisiones = mapa.createLayer('colisiones', tilesets, 0, 0);
    const capaAlto = mapa.createLayer('decoracion_alto', tilesets, 0, 0);

    if (capaColisiones) capaColisiones.setCollisionByProperty({ colision: true });
    if (capaAlto) capaAlto.setDepth(10);

    this._jugador = new Jugador(this, tileX, tileY);
    if (capaColisiones) {
      this._jugador.capas = { colisiones: capaColisiones };
      this.physics.add.collider(this._jugador, capaColisiones);
    }

    if (!configMapa.esInterior && capaHierba) {
      const tablaKey = `encuentros-${mapaKey}`;
      const tabla = this.cache.json.get(tablaKey);
      this._encuentros = new SistemaEncuentros(this, capaHierba, tabla);
      this._jugador.on('paso', (tx, ty) => this._encuentros.comprobarPaso(tx, ty));
      this.events.once('encuentro', (pokemon) => this._iniciarBatalla(pokemon));
    }

    mapa.getObjectLayer('npcs')?.objects.forEach(obj => this._crearNpc(obj));
    mapa.getObjectLayer('eventos')?.objects.forEach(obj => this._crearZonaEvento(obj));

    this._teclado = crearTecladoJugador(this);
    this._dialogo = new SistemaDialogo(this);
    this._configurarCamara(mapa);
    this._configurarMenu();
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
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this._dialogo?.activo || this._introActiva) return;
      this.scene.launch('EscenaMenu');
      this.scene.pause();
    });
  }

  // ── NPCs ──────────────────────────────────────────────────────────────

  _crearNpc(obj) {
    const npc = this.add.sprite(obj.x, obj.y, 'jugador', 1).setOrigin(0.5, 1);
    const dialogo = obj.properties?.find(p => p.name === 'dialogo')?.value;
    if (!dialogo) return;

    const lineas = dialogo.split('|');
    this.input.keyboard.on('keydown-Z', () => {
      if (this._dialogo?.activo || this._introActiva) return;
      const dist = Phaser.Math.Distance.Between(this._jugador.x, this._jugador.y, npc.x, npc.y);
      if (dist < TAM_TILE * 1.8) this._dialogo.mostrar(lineas);
    });
  }

  // ── Zonas de evento (transiciones de mapa) ───────────────────────────

  _crearZonaEvento(obj) {
    const zona = this.add.zone(obj.x, obj.y, obj.width ?? TAM_TILE, obj.height ?? TAM_TILE);
    this.physics.world.enable(zona);
    zona.body.setImmovable(true);

    this.physics.add.overlap(this._jugador, zona, () => {
      if (this._introActiva) return;
      const props = obj.properties ?? [];
      const destino = props.find(p => p.name === 'destino')?.value;
      const posX    = props.find(p => p.name === 'posX')?.value ?? 5;
      const posY    = props.find(p => p.name === 'posY')?.value ?? 5;
      if (destino) this._cambiarMapa(destino, posX, posY);
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
    if (this._dialogo?.activo || this._introActiva) return;
    this._jugador.update(normalizarTeclado(this._teclado));
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  shutdown() {
    this._musica?.stop();
  }
}
