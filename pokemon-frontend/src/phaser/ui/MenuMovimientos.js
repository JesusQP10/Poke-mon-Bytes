import Phaser from 'phaser';

/**
 * MenuMovimientos — grid 2×2 de los 4 movimientos del Pokémon activo.
 * Se sitúa en la mitad derecha del área inferior (x:80, y:96, 80×48).
 */
export default class MenuMovimientos extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 80, 96);
    scene.add.existing(this);
    this.setDepth(50);

    this._movimientos = [];
    this._seleccion = 0;
    this._activo = false;
    this._onSeleccion = null;

    this._crearUI();
    this.setVisible(false);
  }

  _crearUI() {
    // Fondo
    const fondo = this.scene.add.rectangle(0, 0, 80, 48, 0xf8f8f8).setOrigin(0);
    fondo.setStrokeStyle(1, 0x000000);
    this.add(fondo);

    // 4 slots de movimiento (grid 2×2)
    this._slots = [];
    const posiciones = [
      { x: 4, y: 4 },   // 0: superior izquierda
      { x: 44, y: 4 },  // 1: superior derecha
      { x: 4, y: 26 },  // 2: inferior izquierda
      { x: 44, y: 26 }, // 3: inferior derecha
    ];

    posiciones.forEach((pos) => {
      const nombre = this.scene.add.text(pos.x + 4, pos.y + 2, '-', {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        fill: '#000000',
      }).setOrigin(0);

      const tipo = this.scene.add.text(pos.x + 4, pos.y + 11, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '4px',
        fill: '#606060',
      }).setOrigin(0);

      // Cursor de selección
      const cursor = this.scene.add.text(pos.x, pos.y + 2, '▶', {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        fill: '#000000',
      }).setOrigin(0).setVisible(false);

      this.add([nombre, tipo, cursor]);
      this._slots.push({ nombre, tipo, cursor, pos });
    });
  }

  /**
   * @param {Array} movimientos - Array de objetos con { nombre, tipo, pp, ppMax }
   * @param {Function} onSeleccion - Callback con el índice seleccionado
   */
  mostrar(movimientos, onSeleccion) {
    this._movimientos = movimientos;
    this._seleccion = 0;
    this._onSeleccion = onSeleccion;
    this._activo = true;

    movimientos.forEach((mov, i) => {
      if (i < 4) {
        this._slots[i].nombre.setText(mov.nombre ?? '?');
        this._slots[i].tipo.setText(mov.tipo ?? '');
      }
    });

    // Limpiar slots vacíos
    for (let i = movimientos.length; i < 4; i++) {
      this._slots[i].nombre.setText('-');
      this._slots[i].tipo.setText('');
    }

    this._actualizarCursor();
    this.setVisible(true);

    // Capturar input
    this._keyListener = (event) => this._manejarInput(event);
    this.scene.input.keyboard.on('keydown', this._keyListener);
  }

  ocultar() {
    this._activo = false;
    this.setVisible(false);
    if (this._keyListener) {
      this.scene.input.keyboard.off('keydown', this._keyListener);
    }
  }

  _manejarInput(event) {
    if (!this._activo) return;

    const total = Math.min(this._movimientos.length, 4);

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        if (this._seleccion >= 2) this._seleccion -= 2;
        break;
      case 'ArrowDown':
      case 'KeyS':
        if (this._seleccion + 2 < total) this._seleccion += 2;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        if (this._seleccion % 2 === 1) this._seleccion--;
        break;
      case 'ArrowRight':
      case 'KeyD':
        if (this._seleccion % 2 === 0 && this._seleccion + 1 < total) this._seleccion++;
        break;
      case 'KeyZ':
      case 'Enter':
      case 'NumpadEnter':
        this.ocultar();
        if (this._onSeleccion) this._onSeleccion(this._seleccion);
        return;
      case 'KeyX':
      case 'Escape':
        this.ocultar();
        if (this._onSeleccion) this._onSeleccion(-1); // -1 = cancelar
        return;
    }

    this._actualizarCursor();
  }

  _actualizarCursor() {
    this._slots.forEach((slot, i) => {
      slot.cursor.setVisible(i === this._seleccion);
    });
  }
}
