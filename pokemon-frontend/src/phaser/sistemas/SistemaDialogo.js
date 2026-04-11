import Phaser from 'phaser';
import { delayDialogoMs } from '../../config/opcionesCliente';
import { crearMarcoDialogoRetro, estiloTextoDialogoRetro } from '../utils/marcoDialogoRetro';

/**
 * SistemaDialogo — caja de texto estilo menú in-game (retro).
 *
 * Caja inferior 160×44 con marco doble; texto carácter a carácter.
 * Avance con Z/Enter.
 */
export default class SistemaDialogo {
  constructor(scene) {
    this.scene = scene;
    this._activo = false;
    this._lineas = [];
    this._indice = 0;
    this._onFin = null;
    this._contenedor = null;
    this._texto = null;
    this._intervalo = null;
    this._charIndex = 0;
    this._esperandoInput = false;

    this._crearUI();
    this._contenedor.setVisible(false);
  }

  _crearUI() {
    const W = 158;
    const H = 44;
    this._contenedor = this.scene.add.container(1, 100).setDepth(100).setScrollFactor(0);

    const marco = crearMarcoDialogoRetro(this.scene, 0, 0, W, H);
    this._contenedor.add(marco);

    const wrap = W - 14;
    this._texto = this.scene.add.text(7, 6, '', estiloTextoDialogoRetro(wrap)).setOrigin(0);

    this._flecha = this.scene.add.text(W - 12, H - 12, '▼', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      fill: '#2040c0',
    }).setOrigin(0).setVisible(false);

    this._contenedor.add([this._texto, this._flecha]);

    this._handlerTeclado = (event) => {
      if (!this._activo) return;
      const esAceptar =
        event.code === 'KeyZ' ||
        event.code === 'Enter' ||
        event.code === 'NumpadEnter';
      if (!esAceptar) return;

      if (!this._esperandoInput) {
        this._completarLinea();
      } else {
        this._siguienteLinea();
      }
    };
    this.scene.input.keyboard.on('keydown', this._handlerTeclado);
  }

  /**
   * @param {string[]} lineas - Array de strings, una por "pantalla" de diálogo.
   * @param {Function} [onFin] - Callback al terminar todas las líneas.
   */
  mostrar(lineas, onFin) {
    this._lineas = lineas;
    this._indice = 0;
    this._onFin = onFin ?? null;
    this._activo = true;
    this._contenedor.setVisible(true);
    this._mostrarLinea(0);
  }

  ocultar() {
    this._activo = false;
    this._limpiarIntervalo();
    this._contenedor.setVisible(false);
  }

  get activo() {
    return this._activo;
  }

  _mostrarLinea(indice) {
    this._esperandoInput = false;
    this._flecha.setVisible(false);
    this._charIndex = 0;
    const lineaCompleta = this._lineas[indice];
    this._texto.setText('');

    this._limpiarIntervalo();
    this._intervalo = this.scene.time.addEvent({
      delay: delayDialogoMs(),
      repeat: lineaCompleta.length - 1,
      callback: () => {
        this._charIndex++;
        this._texto.setText(lineaCompleta.substring(0, this._charIndex));
        if (this._charIndex >= lineaCompleta.length) {
          this._completarLinea();
        }
      },
    });
  }

  _completarLinea() {
    this._limpiarIntervalo();
    this._texto.setText(this._lineas[this._indice]);
    this._esperandoInput = true;
    this._flecha.setVisible(true);
  }

  _siguienteLinea() {
    this._flecha.setVisible(false);
    this._indice++;
    if (this._indice < this._lineas.length) {
      this._mostrarLinea(this._indice);
    } else {
      this.ocultar();
      if (this._onFin) this._onFin();
    }
  }

  _limpiarIntervalo() {
    if (this._intervalo) {
      this._intervalo.remove(false);
      this._intervalo = null;
    }
  }
}
