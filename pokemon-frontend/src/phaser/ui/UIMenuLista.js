/**
 * Menú vertical de opciones (PC, etc.). Navegación W/S o flechas, Z confirma, X cancela.
 */
export default class UIMenuLista {
  constructor(scene) {
    this._scene = scene;
    this._activo = false;
    this._contenedor = null;
    this._handlerTeclado = null;
    this._items = [];
    this._indice = 0;
    this._onPick = null;
    this._onCancel = null;
    this._textosOpcion = [];
    this._cursor = null;
  }

  get activo() {
    return this._activo;
  }

  /**
   * @param {string} titulo
   * @param {string[]} items
   * @param {{ onPick: (indice: number) => void, onCancel?: () => void }} callbacks
   */
  mostrar(titulo, items, { onPick, onCancel }) {
    this.ocultar();
    this._activo = true;
    this._items = items;
    this._indice = 0;
    this._onPick = onPick;
    this._onCancel = onCancel ?? null;

    this._contenedor = this._scene.add.container(0, 0).setDepth(110).setScrollFactor(0);

    const fondo = this._scene.add.rectangle(10, 36, 140, 72, 0xf8f8f8)
      .setOrigin(0)
      .setStrokeStyle(2, 0x000000);
    this._contenedor.add(fondo);

    const textoTitulo = this._scene.add.text(14, 40, titulo, {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
      wordWrap: { width: 132 },
    }).setOrigin(0);
    this._contenedor.add(textoTitulo);

    this._cursor = this._scene.add.text(14, 54, '▶', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
    }).setOrigin(0);
    this._contenedor.add(this._cursor);

    this._textosOpcion = [];
    items.forEach((label, i) => {
      const t = this._scene.add.text(26, 54 + i * 12, label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        fill: '#000000',
        wordWrap: { width: 118 },
      }).setOrigin(0);
      this._textosOpcion.push(t);
      this._contenedor.add(t);
    });

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
      this._contenedor.destroy(true);
      this._contenedor = null;
    }
    this._textosOpcion = [];
    this._cursor = null;
  }

  _actualizarCursor() {
    if (!this._cursor) return;
    this._cursor.setY(54 + this._indice * 12);
  }

  _registrarTeclado() {
    this._handlerTeclado = (event) => {
      if (!this._activo) return;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this._indice = (this._indice - 1 + this._items.length) % this._items.length;
          this._actualizarCursor();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this._indice = (this._indice + 1) % this._items.length;
          this._actualizarCursor();
          break;
        case 'KeyZ':
        case 'Enter':
        case 'NumpadEnter': {
          const idx = this._indice;
          const cb = this._onPick;
          this.ocultar();
          if (cb) cb(idx);
          break;
        }
        case 'KeyX':
        case 'Escape': {
          const cancel = this._onCancel;
          this.ocultar();
          if (cancel) cancel();
          break;
        }
        default:
          break;
      }
    };
    this._scene.input.keyboard.on('keydown', this._handlerTeclado);
  }
}
