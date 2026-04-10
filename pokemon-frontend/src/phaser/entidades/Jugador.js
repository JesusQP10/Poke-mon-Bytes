import Phaser from 'phaser';

// Duración de cada paso en ms
const MS_POR_PASO = 200;
// Tamaño de un tile en píxeles
const TAM_TILE = 16;

/**
 * Jugador — sprite del personaje principal.
 *
 * Spritesheet esperado (48×48 px, 12 frames de 16×16):
 *   Fila 0 (frames 0-2):  caminar ABAJO
 *   Fila 1 (frames 3-5):  caminar ARRIBA
 *   Fila 2 (frames 6-8):  caminar IZQUIERDA
 *   Fila 3 (frames 9-11): caminar DERECHA
 */
export default class Jugador extends Phaser.GameObjects.Sprite {
  constructor(scene, tileX, tileY) {
    const px = tileX * TAM_TILE + TAM_TILE / 2;
    const py = tileY * TAM_TILE + TAM_TILE / 2;
    super(scene, px, py, 'jugador', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Hitbox reducida 
    this.body.setSize(10, 8);
    this.body.setOffset(3, 8);

    // Estado interno
    this._moviendose = false;
    this._tileX = tileX;
    this._tileY = tileY;
    this._direccion = 'abajo';
    this._pasos = 0; // contador de pasos para encuentros

    this._crearAnimaciones(scene);

    // Guardar referencia al sistema de colisiones (EscenaOverworld)
    this.capas = null;
  }

  // ── Animaciones ────────────────────────────────────────────────────────

  _crearAnimaciones(scene) {
    // Si no hay spritesheet, no crear animaciones (modo fallback)
    if (!scene.textures.exists('jugador')) return;

    const anims = scene.anims;

    if (!anims.exists('jugador-abajo')) {
      anims.create({
        key: 'jugador-abajo',
        frames: anims.generateFrameNumbers('jugador', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!anims.exists('jugador-arriba')) {
      anims.create({
        key: 'jugador-arriba',
        frames: anims.generateFrameNumbers('jugador', { start: 3, end: 5 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!anims.exists('jugador-izquierda')) {
      anims.create({
        key: 'jugador-izquierda',
        frames: anims.generateFrameNumbers('jugador', { start: 6, end: 8 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!anims.exists('jugador-derecha')) {
      anims.create({
        key: 'jugador-derecha',
        frames: anims.generateFrameNumbers('jugador', { start: 9, end: 11 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────

  update(teclado) {
    if (this._moviendose) return;

    let dx = 0;
    let dy = 0;
    let nuevaDireccion = this._direccion;

    if (teclado.arriba.isDown) {
      dy = -1;
      nuevaDireccion = 'arriba';
    } else if (teclado.abajo.isDown) {
      dy = 1;
      nuevaDireccion = 'abajo';
    } else if (teclado.izquierda.isDown) {
      dx = -1;
      nuevaDireccion = 'izquierda';
    } else if (teclado.derecha.isDown) {
      dx = 1;
      nuevaDireccion = 'derecha';
    }

    // Actualizar frame de idle si cambia de dirección sin moverse
    if (nuevaDireccion !== this._direccion) {
      this._direccion = nuevaDireccion;
      this._setFrameIdle();
    }

    if (dx === 0 && dy === 0) {
      this.anims.stop();
      this._setFrameIdle();
      return;
    }

    const destTileX = this._tileX + dx;
    const destTileY = this._tileY + dy;

    if (this._hayColision(destTileX, destTileY)) {
      this.anims.stop();
      this._setFrameIdle();
      return;
    }

    this._iniciarMovimiento(destTileX, destTileY, nuevaDireccion);
  }

  // ── Movimiento tile-a-tile ─────────────────────────────────────────────

  _iniciarMovimiento(destTileX, destTileY, direccion) {
    this._moviendose = true;
    this._direccion = direccion;
    this._tileX = destTileX;
    this._tileY = destTileY;

    if (this.scene.textures.exists('jugador')) {
      this.anims.play(`jugador-${direccion}`, true);
    }

    const destPx = destTileX * TAM_TILE + TAM_TILE / 2;
    const destPy = destTileY * TAM_TILE + TAM_TILE / 2;

    this.scene.tweens.add({
      targets: this,
      x: destPx,
      y: destPy,
      duration: MS_POR_PASO,
      ease: 'Linear',
      onComplete: () => {
        this._moviendose = false;
        this._pasos++;
        this.emit('paso', this._tileX, this._tileY);
      },
    });
  }

  // ── Colisiones ─────────────────────────────────────────────────────────

  _hayColision(tileX, tileY) {
    if (!this.capas?.colisiones) return false;
    const tile = this.capas.colisiones.getTileAt(tileX, tileY);
    return tile !== null;
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  _setFrameIdle() {
    if (!this.scene.textures.exists('jugador')) return;
    const frameIdle = {
      abajo: 1,
      arriba: 4,
      izquierda: 7,
      derecha: 10,
    };
    this.setFrame(frameIdle[this._direccion] ?? 1);
  }

  getTilePosicion() {
    return { x: this._tileX, y: this._tileY };
  }

  get pasos() {
    return this._pasos;
  }

  resetarPasos() {
    this._pasos = 0;
  }
}

// ── Mapeo de teclas Phaser desde controlesJuego.js ─────────────────────────

/**
 * Crea el objeto de teclado que Jugador.update() espera.
 * Acepta las mismas teclas que controlesJuego.js define.
 */
export function crearTecladoJugador(scene) {
  const kb = scene.input.keyboard;
  return {
    arriba: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W, false),
    arriba2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP, false),
    abajo: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S, false),
    abajo2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN, false),
    izquierda: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A, false),
    izquierda2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, false),
    derecha: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D, false),
    derecha2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, false),
    aceptar: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z, false),
    atras: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X, false),
    menu: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER, false),
  };
}

/**
 * Versión simplificada que normaliza arriba/arriba2, etc. en uno solo.
 * Se usa en Jugador.update() para que no haya que comprobar dos teclas.
 */
export function normalizarTeclado(teclado) {
  return {
    arriba: { isDown: teclado.arriba.isDown || teclado.arriba2.isDown },
    abajo: { isDown: teclado.abajo.isDown || teclado.abajo2.isDown },
    izquierda: { isDown: teclado.izquierda.isDown || teclado.izquierda2.isDown },
    derecha: { isDown: teclado.derecha.isDown || teclado.derecha2.isDown },
    aceptar: { isDown: teclado.aceptar.isDown },
    atras: { isDown: teclado.atras.isDown },
    menu: { isDown: teclado.menu.isDown },
  };
}
