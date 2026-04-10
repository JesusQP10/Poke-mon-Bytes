/**
 * UISeleccionStarter — menú de selección de Pokémon inicial.
 *
 * Muestra 3 opciones (Cyndaquil, Totodile, Chikorita) con navegación
 * ← → y confirmación con Z. Cancelación con X.
 *
 * Uso:
 *   const ui = new UISeleccionStarter(scene, sistemaDialogo);
 *   ui.mostrar((indice) => { console.log('Elegido:', indice); });
 */

const STARTERS = [
  { id: 155, nombre: 'Cyndaquil', color: 0xff6600 },
  { id: 158, nombre: 'Totodile',  color: 0x0066ff },
  { id: 152, nombre: 'Chikorita', color: 0x00aa44 },
];

const POSICIONES_X = [36, 80, 124];
const POS_Y = 72;

export default class UISeleccionStarter {
  constructor(scene, dialogo) {
    this._scene = scene;
    this._dialogo = dialogo;
    this._contenedor = null;
    this._seleccion = 0;
    this._activo = false;
    this._onElegido = null;
    this._cursores = [];
    this._handlerTeclado = null;
  }

  mostrar(onElegido) {
    this._onElegido = onElegido;
    this._seleccion = 0;
    this._activo = true;
    this._construirUI();
    this._actualizarCursor();
    this._registrarTeclado();
  }

  ocultar() {
    this._activo = false;
    if (this._handlerTeclado) {
      this._scene.input.keyboard.off('keydown', this._handlerTeclado);
      this._handlerTeclado = null;
    }
    if (this._contenedor) {
      this._contenedor.destroy();
      this._contenedor = null;
    }
  }

  _construirUI() {
    this._contenedor = this._scene.add.container(0, 0).setDepth(90);

    // Fondo semitransparente
    const fondo = this._scene.add.rectangle(80, 72, 160, 144, 0x000000, 0.5);
    this._contenedor.add(fondo);

    // Título
    const titulo = this._scene.add.text(80, 20, 'Elige tu Pokémon', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#ffffff',
    }).setOrigin(0.5);
    this._contenedor.add(titulo);

    this._cursores = [];

    STARTERS.forEach((starter, i) => {
      const x = POSICIONES_X[i];

      // Poké Ball (círculo de color como placeholder)
      const ball = this._scene.add.circle(x, POS_Y, 10, starter.color);
      this._contenedor.add(ball);

      // Nombre
      const nombre = this._scene.add.text(x, POS_Y + 16, starter.nombre, {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        fill: '#ffffff',
      }).setOrigin(0.5);
      this._contenedor.add(nombre);

      // Cursor (▼ encima de la ball seleccionada)
      const cursor = this._scene.add.text(x, POS_Y - 18, '▼', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        fill: '#ffff00',
      }).setOrigin(0.5).setVisible(false);
      this._contenedor.add(cursor);
      this._cursores.push(cursor);
    });

    // Instrucciones
    const instrucciones = this._scene.add.text(80, 120, '← → Mover   Z Elegir   X Cancelar', {
      fontFamily: '"Press Start 2P"',
      fontSize: '4px',
      fill: '#aaaaaa',
    }).setOrigin(0.5);
    this._contenedor.add(instrucciones);
  }

  _actualizarCursor() {
    this._cursores.forEach((c, i) => c.setVisible(i === this._seleccion));
  }

  _registrarTeclado() {
    this._handlerTeclado = (event) => {
      if (!this._activo) return;

      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this._seleccion = Math.max(0, this._seleccion - 1);
          this._actualizarCursor();
          break;

        case 'ArrowRight':
        case 'KeyD':
          this._seleccion = Math.min(STARTERS.length - 1, this._seleccion + 1);
          this._actualizarCursor();
          break;

        case 'KeyZ':
        case 'Enter':
        case 'NumpadEnter':
          this._confirmar();
          break;

        case 'KeyX':
          // Cancelar — no hace nada en la selección inicial (debe elegir uno)
          break;
      }
    };
    this._scene.input.keyboard.on('keydown', this._handlerTeclado);
  }

  _confirmar() {
    const starter = STARTERS[this._seleccion];
    // Mostrar confirmación via diálogo
    this._dialogo.mostrar(
      [`¿Llevarás a ${starter.nombre}?`, 'Z: Sí   X: No'],
      null
    );

    // Escuchar confirmación/cancelación
    const handlerConfirm = (event) => {
      if (event.code === 'KeyZ' || event.code === 'Enter' || event.code === 'NumpadEnter') {
        this._scene.input.keyboard.off('keydown', handlerConfirm);
        this._dialogo.ocultar();
        this.ocultar();
        this._onElegido?.(this._seleccion);
      } else if (event.code === 'KeyX') {
        this._scene.input.keyboard.off('keydown', handlerConfirm);
        this._dialogo.ocultar();
        // Volver a la selección
      }
    };
    // Quitar el handler principal temporalmente para evitar conflictos
    this._scene.input.keyboard.off('keydown', this._handlerTeclado);
    this._scene.input.keyboard.on('keydown', handlerConfirm);
  }
}

export { STARTERS };
