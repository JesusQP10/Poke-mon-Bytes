import Phaser from 'phaser';
import Jugador, { crearTecladoJugador, normalizarTeclado } from '../entidades/Jugador';
import SistemaEncuentros from '../sistemas/SistemaEncuentros';
import SistemaDialogo from '../sistemas/SistemaDialogo';
import { usarJuegoStore } from '../../store/usarJuegoStore';

const TAM_TILE = 16;

export default class EscenaOverworld extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaOverworld' });
  }

  create() {
    const store = usarJuegoStore.getState();

    // ── Tilemap ──────────────────────────────────────────────────────────
    // Si el tilemap aún no existe (assets pendientes), mostrar placeholder
    if (!this.cache.tilemap.exists('new-bark-town')) {
      this._crearEscenaPlaceholder(store);
      return;
    }

    this._crearEscenaTilemap(store);
  }

  // ── Modo placeholder (sin assets de tilemap todavía) ──────────────────

  _crearEscenaPlaceholder(store) {
    // Fondo verde del juego
    this.add.rectangle(80, 72, 160, 144, 0x78c850);

    // Grid de tiles visual (referencia)
    const graficos = this.add.graphics();
    graficos.lineStyle(0.5, 0x5aaa3a, 0.4);
    for (let x = 0; x <= 160; x += TAM_TILE) graficos.lineBetween(x, 0, x, 144);
    for (let y = 0; y <= 144; y += TAM_TILE) graficos.lineBetween(0, y, 160, y);

    // Texto informativo
    this.add.text(80, 30, 'NEW BARK\n  TOWN', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#1a6010',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(80, 120, 'Añade los tilesets\npara ver el mapa', {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      fill: '#2a7020',
      align: 'center',
    }).setOrigin(0.5);

    // Jugador en modo placeholder (sin tilemap)
    this._jugador = this._crearJugadorSinMapa(store.posX, store.posY);
    this._teclado = crearTecladoJugador(this);
    this._dialogo = new SistemaDialogo(this);

    this._configurarCamara(null);
    this._configurarMenu();

    // Sin sistema de encuentros en placeholder
    this._encuentros = null;
  }

  // ── Modo completo con tilemap ─────────────────────────────────────────

  _crearEscenaTilemap(store) {
    const mapa = this.make.tilemap({ key: 'new-bark-town' });
    const tilesetExt = mapa.addTilesetImage('johto-exterior', 'johto-exterior');
    const tilesetInt = mapa.addTilesetImage('johto-interior', 'johto-interior');
    const tilesets = [tilesetExt, tilesetInt].filter(Boolean);

    // ── Capas ────────────────────────────────────────────────────────────
    const capasSuelo = [
      mapa.createLayer('suelo', tilesets, 0, 0),
      mapa.createLayer('decoracion_bajo', tilesets, 0, 0),
    ].filter(Boolean);

    const capaHierba = mapa.createLayer('hierba_alta', tilesets, 0, 0);
    const capaColisiones = mapa.createLayer('colisiones', tilesets, 0, 0);
    const capaAlto = mapa.createLayer('decoracion_alto', tilesets, 0, 0);

    // Colisiones con la capa de obstáculos
    if (capaColisiones) {
      capaColisiones.setCollisionByProperty({ colision: true });
    }

    // Capa alto renderizada sobre el jugador
    if (capaAlto) capaAlto.setDepth(10);

    // ── Jugador ──────────────────────────────────────────────────────────
    this._jugador = new Jugador(this, store.posX, store.posY);
    if (capaColisiones) {
      this._jugador.capas = { colisiones: capaColisiones };
      this.physics.add.collider(this._jugador, capaColisiones);
    }

    // ── Sistemas ─────────────────────────────────────────────────────────
    const tablaEncuentros = this.cache.json.get('encuentros-new-bark-town');
    this._encuentros = new SistemaEncuentros(this, capaHierba, tablaEncuentros);

    this._jugador.on('paso', (tx, ty) => {
      this._encuentros.comprobarPaso(tx, ty);
    });

    this.events.once('encuentro', (pokemon) => {
      this._iniciarBatalla(pokemon);
    });

    // ── NPCs desde Object Layer ───────────────────────────────────────────
    const capaNpcs = mapa.getObjectLayer('npcs');
    if (capaNpcs) {
      this._crearNpcs(capaNpcs.objects);
    }

    // ── Zonas de evento (transiciones de mapa) ───────────────────────────
    const capaEventos = mapa.getObjectLayer('eventos');
    if (capaEventos) {
      this._crearZonasEvento(capaEventos.objects);
    }

    // ── UI y controles ────────────────────────────────────────────────────
    this._teclado = crearTecladoJugador(this);
    this._dialogo = new SistemaDialogo(this);
    this._configurarCamara(mapa);
    this._configurarMenu();

    // ── Música ───────────────────────────────────────────────────────────
    if (this.sound.get('bgm-overworld')) {
      this.sound.get('bgm-overworld').stop();
    }
    if (this.cache.audio.exists('bgm-overworld')) {
      this._musica = this.sound.add('bgm-overworld', { loop: true, volume: 0.6 });
      this._musica.play();
    }
  }

  // ── Cámara ────────────────────────────────────────────────────────────

  _configurarCamara(mapa) {
    this.cameras.main.setZoom(1);
    this.cameras.main.startFollow(this._jugador, true, 1, 1);

    if (mapa) {
      const anchoMundo = mapa.widthInPixels;
      const altoMundo = mapa.heightInPixels;
      this.cameras.main.setBounds(0, 0, anchoMundo, altoMundo);
      this.physics.world.setBounds(0, 0, anchoMundo, altoMundo);
    }
  }

  // ── Menú in-game ──────────────────────────────────────────────────────

  _configurarMenu() {
    this._teclado_menu = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this._dialogo?.activo) return;
      this.scene.launch('EscenaMenu');
      this.scene.pause();
    });
  }

  // ── NPCs ──────────────────────────────────────────────────────────────

  _crearNpcs(objetos) {
    objetos.forEach((obj) => {
      const npc = this.add.sprite(obj.x, obj.y, 'jugador', 1).setOrigin(0.5, 1);
      // Interacción con Z al estar adyacente
      const dialogo = obj.properties?.find((p) => p.name === 'dialogo')?.value;
      if (dialogo) {
        npc.setInteractive();
        this._registrarInteraccionNpc(npc, dialogo.split('|'));
      }
    });
  }

  _registrarInteraccionNpc(npc, lineas) {
    this.input.keyboard.on('keydown-Z', () => {
      if (this._dialogo?.activo) return;
      const dist = Phaser.Math.Distance.Between(
        this._jugador.x, this._jugador.y, npc.x, npc.y
      );
      if (dist < TAM_TILE * 1.8) {
        this._dialogo.mostrar(lineas);
      }
    });
  }

  // ── Zonas de evento ───────────────────────────────────────────────────

  _crearZonasEvento(objetos) {
    objetos.forEach((obj) => {
      const zona = this.add.zone(obj.x, obj.y, obj.width, obj.height);
      this.physics.world.enable(zona);
      zona.body.setImmovable(true);
      this.physics.add.overlap(this._jugador, zona, () => {
        const destino = obj.properties?.find((p) => p.name === 'destino')?.value;
        if (destino) {
          this._cambiarMapa(destino, obj);
        }
      });
    });
  }

  _cambiarMapa(destino, eventoObj) {
    // TODO Fase 3: cargar el mapa destino
    console.log(`Transición a mapa: ${destino}`);
  }

  // ── Batalla ───────────────────────────────────────────────────────────

  _iniciarBatalla(pokemon) {
    this._musica?.stop();
    // Guardar posición antes de entrar a batalla
    const { x, y } = this._jugador.getTilePosicion();
    const store = usarJuegoStore.getState();
    store.setPosition(x, y, store.mapaActual);

    // Pasar datos del Pokémon salvaje a la escena de batalla
    this.scene.launch('EscenaTransicion', {
      siguiente: 'EscenaBatalla',
      datos: { pokemonSalvaje: pokemon },
    });
    this.scene.pause();
  }

  // ── Jugador sin tilemap ───────────────────────────────────────────────

  _crearJugadorSinMapa(tileX, tileY) {
    const jugador = new Jugador(this, tileX, tileY);
    // Sin capas de colisión en modo placeholder
    return jugador;
  }

  // ── Update ────────────────────────────────────────────────────────────

  update() {
    if (!this._jugador || !this._teclado) return;
    if (this._dialogo?.activo) return;

    const teclas = normalizarTeclado(this._teclado);
    this._jugador.update(teclas);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  shutdown() {
    this._musica?.stop();
  }
}
