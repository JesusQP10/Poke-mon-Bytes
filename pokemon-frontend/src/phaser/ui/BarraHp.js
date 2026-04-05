import Phaser from 'phaser';

const COLOR_VERDE   = 0x00f800;
const COLOR_AMARILLO = 0xf8d800;
const COLOR_ROJO    = 0xf80000;
const COLOR_FONDO   = 0x404040;

/**
 * BarraHp — barra de salud animada estilo GBC.
 *
 * @param {Phaser.Scene} scene
 * @param {number} x - posición izquierda
 * @param {number} y - posición superior
 * @param {number} ancho - ancho total de la barra
 * @param {number} alto - alto de la barra (por defecto 2px)
 */
export default class BarraHp extends Phaser.GameObjects.Container {
  constructor(scene, x, y, ancho = 48, alto = 2) {
    super(scene, x, y);
    scene.add.existing(this);

    this._ancho = ancho;
    this._alto = alto;
    this._hpMax = 1;
    this._hpActual = 1;

    // Fondo
    this._fondo = scene.add.rectangle(0, 0, ancho, alto, COLOR_FONDO).setOrigin(0);
    // Barra de HP
    this._barra = scene.add.rectangle(0, 0, ancho, alto, COLOR_VERDE).setOrigin(0);

    this.add([this._fondo, this._barra]);
  }

  /**
   * Establece los valores sin animación.
   */
  setValores(hpActual, hpMax) {
    this._hpMax = hpMax;
    this._hpActual = Phaser.Math.Clamp(hpActual, 0, hpMax);
    this._actualizarBarra(this._hpActual);
  }

  /**
   * Anima la barra desde el HP actual hasta el nuevo HP.
   * @param {number} nuevoHp
   * @param {Function} [onComplete]
   */
  animarHacia(nuevoHp, onComplete) {
    nuevoHp = Phaser.Math.Clamp(nuevoHp, 0, this._hpMax);
    const hpAnterior = this._hpActual;
    this._hpActual = nuevoHp;

    this.scene.tweens.addCounter({
      from: hpAnterior,
      to: nuevoHp,
      duration: 600,
      ease: 'Linear',
      onUpdate: (tween) => {
        this._actualizarBarra(Math.round(tween.getValue()));
      },
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }

  _actualizarBarra(hp) {
    const porcentaje = this._hpMax > 0 ? hp / this._hpMax : 0;
    this._barra.width = Math.max(0, Math.floor(this._ancho * porcentaje));

    if (porcentaje > 0.5) {
      this._barra.fillColor = COLOR_VERDE;
    } else if (porcentaje > 0.2) {
      this._barra.fillColor = COLOR_AMARILLO;
    } else {
      this._barra.fillColor = COLOR_ROJO;
    }
  }
}
