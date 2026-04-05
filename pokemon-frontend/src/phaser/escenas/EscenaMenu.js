import Phaser from 'phaser';
import PuenteApi from '../puentes/PuenteApi';
import { usarJuegoStore } from '../../store/usarJuegoStore';

const OPCIONES = ['POKÉMON', 'MOCHILA', 'GUARDAR', 'OPCIONES', 'SALIR'];

/**
 * EscenaMenu — menú in-game estilo GBC.
 * Se lanza sobre EscenaOverworld con scene.launch() y la pausa.
 * Al cerrar, resume EscenaOverworld.
 */
export default class EscenaMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaMenu' });
  }

  create() {
    this._seleccion = 0;

    // Fondo semitransparente sobre el overworld
    this.add.rectangle(0, 0, 160, 144, 0x000000, 0.3).setOrigin(0);

    // Panel del menú (esquina superior derecha, estilo GBC)
    const anchoMenu = 80;
    const altoMenu = OPCIONES.length * 14 + 8;
    const xMenu = 160 - anchoMenu - 2;
    const yMenu = 2;

    const fondo = this.add.rectangle(xMenu, yMenu, anchoMenu, altoMenu, 0xf8f8f8).setOrigin(0);
    fondo.setStrokeStyle(1, 0x000000);

    this._cursores = [];
    this._textos = OPCIONES.map((opcion, i) => {
      const y = yMenu + 6 + i * 14;

      const cursor = this.add.text(xMenu + 4, y, '▶', {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#000',
      }).setOrigin(0).setVisible(false);
      this._cursores.push(cursor);

      return this.add.text(xMenu + 14, y, opcion, {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#000',
      }).setOrigin(0);
    });

    this._actualizarCursor();

    // Input
    this.input.keyboard.on('keydown', this._manejarInput, this);
  }

  _actualizarCursor() {
    this._cursores.forEach((c, i) => c.setVisible(i === this._seleccion));
  }

  _manejarInput(event) {
    switch (event.code) {
      case 'ArrowUp': case 'KeyW':
        if (this._seleccion > 0) this._seleccion--;
        this._actualizarCursor();
        break;
      case 'ArrowDown': case 'KeyS':
        if (this._seleccion < OPCIONES.length - 1) this._seleccion++;
        this._actualizarCursor();
        break;
      case 'KeyZ': case 'Enter': case 'NumpadEnter':
        this._seleccionarOpcion(this._seleccion);
        break;
      case 'KeyX': case 'Escape':
        this._cerrar();
        break;
    }
  }

  async _seleccionarOpcion(indice) {
    switch (OPCIONES[indice]) {
      case 'POKÉMON':
        this._mostrarEquipo();
        break;
      case 'MOCHILA':
        this._mostrarMensaje('Mochila próximamente.');
        break;
      case 'GUARDAR':
        await this._guardar();
        break;
      case 'OPCIONES':
        this._mostrarMensaje('Opciones próximamente.');
        break;
      case 'SALIR':
        this._cerrar();
        break;
    }
  }

  async _guardar() {
    const store = usarJuegoStore.getState();
    this._mostrarMensaje('Guardando...');
    try {
      await PuenteApi.guardarJuego(store.posX, store.posY, store.mapaActual);
      this._mostrarMensaje('¡Partida guardada!');
    } catch (e) {
      this._mostrarMensaje('Error al guardar.');
    }
  }

  _mostrarEquipo() {
    const store = usarJuegoStore.getState();
    const equipo = store.team ?? [];
    if (equipo.length === 0) {
      this._mostrarMensaje('Sin Pokémon en\nel equipo.');
      return;
    }
    const lineas = equipo.map(
      (p, i) => `${i + 1}. ${p.nombreApodo ?? p.nombre ?? '???'} Nv${p.nivel}`
    ).join('\n');
    this._mostrarMensaje(lineas);
  }

  _mostrarMensaje(texto) {
    // Caja de mensaje temporal en la parte inferior
    if (this._cajaMensaje) this._cajaMensaje.destroy();
    if (this._textoMsg) this._textoMsg.destroy();

    this._cajaMensaje = this.add.rectangle(2, 100, 156, 42, 0xf8f8f8)
      .setOrigin(0)
      .setStrokeStyle(1, 0x000000);

    this._textoMsg = this.add.text(6, 104, texto, {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      fill: '#000',
      wordWrap: { width: 148 },
      lineSpacing: 4,
    }).setOrigin(0);

    // Cerrar con Z/Enter
    this.input.keyboard.once('keydown-Z', () => {
      this._cajaMensaje?.destroy();
      this._textoMsg?.destroy();
    });
    this.input.keyboard.once('keydown-ENTER', () => {
      this._cajaMensaje?.destroy();
      this._textoMsg?.destroy();
    });
  }

  _cerrar() {
    this.input.keyboard.off('keydown', this._manejarInput, this);
    this.scene.stop();
    this.scene.resume('EscenaOverworld');
  }
}
