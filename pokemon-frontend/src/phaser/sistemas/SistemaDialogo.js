import Phaser from 'phaser';
import { delayDialogoMs } from '../../config/opcionesCliente';
import {
  crearMarcoDialogoRetro,
  estiloTextoDialogoRetro,
  estiloNombreHablanteDialogoRetro,
  redibujaMarcoDialogoRetro,
} from '../utils/marcoDialogoRetro';

const VIEW_H = 144;
const PANEL_W = 158;
const PANEL_H_SIN_NOMBRE = 44;
const PANEL_H_CON_NOMBRE = 52;
const MARGIN_X = 1;
const MARGIN_BOTTOM = 2;

/**
 * SistemaDialogo — caja de texto estilo menú in-game (retro).
 *
 * Caja inferior con marco; texto carácter a carácter. Avance con Z/Enter o clic (indicador ▼).
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
    this._opcionesMostrar = {};
    this._panelH = PANEL_H_SIN_NOMBRE;
    this._flechaTween = null;

    this._crearUI();
    this._contenedor.setVisible(false);
  }

  _crearUI() {
    this._contenedor = this.scene.add.container(MARGIN_X, VIEW_H - PANEL_H_SIN_NOMBRE - MARGIN_BOTTOM).setDepth(100).setScrollFactor(0);

    this._marco = crearMarcoDialogoRetro(this.scene, 0, 0, PANEL_W, PANEL_H_SIN_NOMBRE);
    this._contenedor.add(this._marco);

    const wrap = PANEL_W - 14;
    this._labelHablante = this.scene.add.text(7, 5, '', estiloNombreHablanteDialogoRetro()).setOrigin(0).setVisible(false);
    this._texto = this.scene.add.text(7, 6, '', estiloTextoDialogoRetro(wrap)).setOrigin(0);

    this._flecha = this.scene.add.text(PANEL_W - 12, PANEL_H_SIN_NOMBRE - 12, '▼', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      fill: '#2040c0',
    }).setOrigin(0).setVisible(false);

    this._zonaClick = this.scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H_SIN_NOMBRE, 0xffffff, 0)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    this._zonaClick.on('pointerdown', () => this._aceptar());

    this._contenedor.add([this._zonaClick, this._labelHablante, this._texto, this._flecha]);

    this._handlerTeclado = (event) => {
      if (!this._activo) return;
      const esAceptar =
        event.code === 'KeyZ' ||
        event.code === 'Enter' ||
        event.code === 'NumpadEnter';
      if (!esAceptar) return;
      this._aceptar();
    };
    this.scene.input.keyboard.on('keydown', this._handlerTeclado);
  }

  _aceptar() {
    if (!this._activo) return;
    if (!this._esperandoInput) {
      this._completarLinea();
    } else {
      this._siguienteLinea();
    }
  }

  _aplicarLayoutPanel() {
    const hablante = this._opcionesMostrar?.hablante;
    const conNombre = Boolean(hablante && String(hablante).trim());
    this._panelH = conNombre ? PANEL_H_CON_NOMBRE : PANEL_H_SIN_NOMBRE;

    redibujaMarcoDialogoRetro(this._marco, PANEL_W, this._panelH);
    this._zonaClick.setSize(PANEL_W, this._panelH);

    this._labelHablante.setVisible(conNombre);
    if (conNombre) this._labelHablante.setText(String(hablante).trim().toUpperCase());

    const wrap = PANEL_W - 14;
    this._texto.setStyle(estiloTextoDialogoRetro(wrap));
    this._texto.setPosition(7, conNombre ? 15 : 6);

    const yFlecha = this._panelH - 12;
    this._flecha.setY(yFlecha);

    this._contenedor.setY(VIEW_H - this._panelH - MARGIN_BOTTOM);
    this._contenedor.setX(MARGIN_X);
  }

  _pararTweenFlecha() {
    if (this._flechaTween) {
      this._flechaTween.stop();
      this.scene.tweens.remove(this._flechaTween);
      this._flechaTween = null;
    }
    this._flecha.setY(this._panelH - 12);
  }

  _animarFlecha() {
    this._pararTweenFlecha();
    const y0 = this._panelH - 12;
    this._flecha.setY(y0);
    this._flechaTween = this.scene.tweens.add({
      targets: this._flecha,
      y: y0 - 3,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * @param {string[]} lineas - Array de strings, una por "pantalla" de diálogo.
   * @param {Function|null} [onFin] - Callback al terminar todas las líneas.
   * @param {{ hablante?: string }} [opciones] - `hablante`: etiqueta superior (p. ej. PROF. ELM).
   */
  mostrar(lineas, onFin, opciones = {}) {
    this._lineas = lineas;
    this._indice = 0;
    this._onFin = onFin ?? null;
    this._opcionesMostrar = opciones ?? {};
    this._activo = true;
    this._aplicarLayoutPanel();
    this._contenedor.setVisible(true);
    this._mostrarLinea(0);
  }

  ocultar() {
    this._activo = false;
    this._limpiarIntervalo();
    this._pararTweenFlecha();
    this._contenedor.setVisible(false);
  }

  get activo() {
    return this._activo;
  }

  _mostrarLinea(indice) {
    this._esperandoInput = false;
    this._pararTweenFlecha();
    this._flecha.setVisible(false);
    this._charIndex = 0;
    const lineaCompleta = this._lineas[indice] ?? '';
    this._texto.setText('');

    this._limpiarIntervalo();
    if (!lineaCompleta.length) {
      this._completarLinea();
      return;
    }
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
    this._animarFlecha();
  }

  _siguienteLinea() {
    this._flecha.setVisible(false);
    this._pararTweenFlecha();
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
