import { crearMarcoDialogoRetro, estiloTextoDialogoRetro } from '../utils/marcoDialogoRetro';
import { urlPortraitInicial } from '../../assets/pokemon/starters/portraitUrls';

const GAME_W = 160;
const GAME_H = 144;
const DEPTH = 115;

/**
 * Panel a pantalla fija para elegir el inicial: marco retro, Sí/No.
 * El retrato es un `<img>` en la capa DOM de Phaser para que el GIF **anime**
 */
export default class UIConfirmacionStarter {
  constructor(scene) {
    this._scene = scene;
    this._contenedor = null;
    /** @type {Phaser.GameObjects.DOMElement | null} */
    this._domPortrait = null;
    this._handlerTeclado = null;
    this._activo = false;
    this._seleccion = 0;
    this._onRespuesta = null;
    this._cursores = [];
  }

  /**
   * @param {{ id: number, nombre: string }} starter
   * @param {string} textureKey `chikorita` | `cyndaquil` | `totodile`..
   * @param {(acepta: boolean) => void} onRespuesta
   */
  mostrar(starter, textureKey, onRespuesta) {
    this._onRespuesta = onRespuesta;
    this._activo = true;
    this._seleccion = 0;

    this._contenedor = this._scene.add.container(0, 0).setDepth(DEPTH).setScrollFactor(0);

    const dim = this._scene.add
      .rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0a0c10, 0.78)
      .setScrollFactor(0);
    this._contenedor.add(dim);

    const px = 6;
    const py = 6;
    const pw = 148;
    const ph = 124;

    const marco = crearMarcoDialogoRetro(this._scene, px, py, pw, ph);
    marco.setScrollFactor(0);
    this._contenedor.add(marco);

    const estilo = estiloTextoDialogoRetro(pw - 16);
    const cx = GAME_W / 2;
    const cySprite = py + 44;

    const src = urlPortraitInicial(textureKey);
    const html = `<img src="${src}" alt="" draggable="false" style="width:44px;height:44px;object-fit:contain;image-rendering:pixelated;pointer-events:none;display:block;" />`;
    this._domPortrait = this._scene.add
      .dom(cx, cySprite)
      .createFromHTML(html)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0);
    this._domPortrait.setAlpha(0);
    this._domPortrait.setScale(0.35);
    this._scene.tweens.add({
      targets: this._domPortrait,
      alpha: 1,
      scale: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });

    const titulo = this._scene.add
      .text(px + 8, py + 6, `¡Es ${starter.nombre.toUpperCase()}!`, {
        ...estilo,
        fontSize: '6px',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this._contenedor.add(titulo);

    const pregunta = this._scene.add
      .text(px + 8, py + 74, `¿Llevarás a\n${starter.nombre.toUpperCase()}?`, {
        ...estilo,
        fontSize: '6px',
        lineSpacing: 4,
      })
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this._contenedor.add(pregunta);

    const opcionesX = px + pw - 40;
    const opcionesY = py + ph - 26;
    const opcionesW = 34;
    const opcionesH = 24;

    const marcoOp = crearMarcoDialogoRetro(this._scene, opcionesX, opcionesY, opcionesW, opcionesH);
    marcoOp.setScrollFactor(0);
    this._contenedor.add(marcoOp);

    const estiloOp = { fontFamily: '"Press Start 2P", monospace', fontSize: '6px', fill: '#1a222c' };

    const txtSi = this._scene.add.text(opcionesX + 14, opcionesY + 4, 'Sí', estiloOp).setOrigin(0).setScrollFactor(0);
    const txtNo = this._scene.add.text(opcionesX + 14, opcionesY + 14, 'No', estiloOp).setOrigin(0).setScrollFactor(0);
    this._contenedor.add(txtSi);
    this._contenedor.add(txtNo);

    const cursorSi = this._scene.add
      .text(opcionesX + 4, opcionesY + 4, '▶', { ...estiloOp, fill: '#2040c0' })
      .setOrigin(0)
      .setScrollFactor(0)
      .setVisible(false);
    const cursorNo = this._scene.add
      .text(opcionesX + 4, opcionesY + 14, '▶', { ...estiloOp, fill: '#2040c0' })
      .setOrigin(0)
      .setScrollFactor(0)
      .setVisible(false);
    this._contenedor.add(cursorSi);
    this._contenedor.add(cursorNo);
    this._cursores = [cursorSi, cursorNo];

    const ayuda = this._scene.add
      .text(px + 8, py + ph - 12, '↑↓  Sí/No   Z OK   X No', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '4px',
        fill: '#5c6470',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this._contenedor.add(ayuda);

    this._actualizarCursor();
    this._registrarTeclado();
  }

  _actualizarCursor() {
    this._cursores.forEach((c, i) => c.setVisible(i === this._seleccion));
  }

  _registrarTeclado() {
    this._handlerTeclado = (event) => {
      if (!this._activo) return;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this._seleccion = 0;
          this._actualizarCursor();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this._seleccion = 1;
          this._actualizarCursor();
          break;
        case 'KeyZ':
        case 'Enter':
        case 'NumpadEnter':
          this._confirmar();
          break;
        case 'KeyX':
          this._seleccion = 1;
          this._actualizarCursor();
          this._confirmar();
          break;
        default:
          break;
      }
    };
    this._scene.input.keyboard.on('keydown', this._handlerTeclado);
  }

  _confirmar() {
    const acepta = this._seleccion === 0;
    this.ocultar();
    this._onRespuesta?.(acepta);
  }

  /** Evita abrir otra Poké Ball mientras este panel está en pantalla. */
  esActiva() {
    return this._activo;
  }

  ocultar() {
    this._activo = false;
    if (this._handlerTeclado) {
      this._scene.input.keyboard.off('keydown', this._handlerTeclado);
      this._handlerTeclado = null;
    }
    if (this._domPortrait) {
      this._scene.tweens.killTweensOf(this._domPortrait);
      this._domPortrait.destroy();
      this._domPortrait = null;
    }
    if (this._contenedor) {
      this._contenedor.destroy(true);
      this._contenedor = null;
    }
    this._cursores = [];
  }
}
