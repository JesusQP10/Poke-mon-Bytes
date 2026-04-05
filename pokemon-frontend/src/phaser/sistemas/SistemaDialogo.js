import Phaser from 'phaser';

/**
 * SistemaDialogo — caja de texto estilo Game Boy Color.
 *
 * Muestra una caja en la parte inferior del canvas (160×40 px)
 * con el texto que aparece carácter a carácter.
 * El jugador avanza con Z/Enter.
 *
 * Uso:
 *   const dialogo = new SistemaDialogo(scene);
 *   dialogo.mostrar(['Hola!', 'Bienvenido a New Bark Town.'], () => {
 *     console.log('Diálogo terminado');
 *   });
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
    // Caja de texto: 158×38 px, posición y:104 (justo encima del borde inferior)
    this._contenedor = this.scene.add.container(0, 104).setDepth(100);

    // Fondo blanco con borde negro
    const fondo = this.scene.add.rectangle(1, 1, 158, 38, 0xf8f8f8).setOrigin(0);
    fondo.setStrokeStyle(1, 0x000000);

    // Texto del diálogo
    this._texto = this.scene.add.text(6, 6, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
      wordWrap: { width: 146 },
      lineSpacing: 4,
    }).setOrigin(0);

    // Flecha de avance (▼) en esquina inferior derecha
    this._flecha = this.scene.add.text(150, 28, '▼', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
    }).setOrigin(0).setVisible(false);

    this._contenedor.add([fondo, this._texto, this._flecha]);

    // Escuchar tecla de avance
    this.scene.input.keyboard.on('keydown', (event) => {
      if (!this._activo) return;
      const esAceptar =
        event.code === 'KeyZ' ||
        event.code === 'Enter' ||
        event.code === 'NumpadEnter';
      if (!esAceptar) return;

      if (!this._esperandoInput) {
        // Completar el texto actual de golpe
        this._completarLinea();
      } else {
        this._siguienteLinea();
      }
    });
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
      delay: 30, // ms por carácter
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
    // Parpadear la flecha si hay más líneas, o simplemente mostrarla
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
