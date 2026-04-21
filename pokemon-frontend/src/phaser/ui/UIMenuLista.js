import { crearMarcoDialogoRetro, estiloTextoDialogoRetro } from '../utils/marcoDialogoRetro';

/**
 * Menú vertical de opciones (PC, tienda, etc.). Navegación W/S o flechas, Z confirma, X cancela.
 * Opcional `maxVisible`: lista con ventana desplazable si hay más ítems que líneas visibles.
 */
export default class UIMenuLista {
  constructor(scene) {
    this._scene = scene;
    this._activo = false;
    this._contenedor = null;
    this._handlerTeclado = null;
    this._items = [];
    this._indiceAbs = 0;
    this._firstVisible = 0;
    this._maxVisible = 0;
    this._onPick = null;
    this._onCancel = null;
    this._textosOpcion = [];
    this._cursor = null;
    this._marco = null;
  }

  get activo() {
    return this._activo;
  }

  /**
   * @param {string} titulo
   * @param {string[]} items
   * @param {{ onPick: (indice: number) => void, onCancel?: () => void, maxVisible?: number }} callbacks
   */
  mostrar(titulo, items, { onPick, onCancel, maxVisible }) {
    this.ocultar();
    this._activo = true;
    this._items = items;
    this._indiceAbs = 0;
    this._firstVisible = 0;
    const n = items.length;
    const cap =
      Number.isFinite(Number(maxVisible)) && Number(maxVisible) > 0
        ? Math.min(Math.floor(Number(maxVisible)), n)
        : n;
    this._maxVisible = Math.max(1, cap);

    this._onPick = onPick;
    this._onCancel = onCancel ?? null;

    this._contenedor = this._scene.add.container(0, 0).setDepth(110).setScrollFactor(0);

    const cfg = this._scene.sys?.game?.config;
    const viewW = Number(cfg?.width) > 0 ? Number(cfg.width) : 160;
    const viewH = Number(cfg?.height) > 0 ? Number(cfg.height) : 144;
    const topLista = 36;
    const margenInferior = 6;
    /** El canvas del juego es 160×144: un marco de 200px queda fuera de pantalla y “no se ve” la tienda. */
    const anchoMax = Math.max(96, viewW - 16);
    const quiereAncho = n > 6 || items.some((s) => String(s).length > 14) ? 148 : 132;
    const anchoMarco = Math.min(quiereAncho, anchoMax);
    const xMarco = Math.max(2, Math.floor((viewW - anchoMarco) / 2));

    const bloqueTitulo = 22;
    const padVertical = 8;
    const altoLinea = 12;
    const altoDisponible = viewH - topLista - margenInferior;
    const maxPorAlto = Math.max(
      1,
      Math.floor((altoDisponible - bloqueTitulo - padVertical) / altoLinea),
    );
    const numSlots = Math.min(this._maxVisible, n, maxPorAlto);
    /** Ventana visible real (puede ser menor que el cap pedido si no cabe en el alto del canvas). */
    this._maxVisible = numSlots;
    const altoMarco = bloqueTitulo + numSlots * altoLinea + padVertical;
    this._marco = crearMarcoDialogoRetro(this._scene, xMarco, topLista, anchoMarco, altoMarco);
    this._contenedor.add(this._marco);

    const xTexto = xMarco + 4;
    const wrapTitulo = Math.max(40, anchoMarco - 16);
    const textoTitulo = this._scene.add.text(xTexto, 40, titulo, {
      ...estiloTextoDialogoRetro(wrapTitulo),
      lineSpacing: 4,
    }).setOrigin(0);
    this._contenedor.add(textoTitulo);

    const wrapLinea = Math.max(48, anchoMarco - 28);
    this._cursor = this._scene.add.text(xTexto, 54, '▶', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      fill: '#2040c0',
    }).setOrigin(0);
    this._contenedor.add(this._cursor);

    this._textosOpcion = [];
    for (let i = 0; i < numSlots; i++) {
      const t = this._scene.add.text(xTexto + 12, 54 + i * 12, '', {
        ...estiloTextoDialogoRetro(wrapLinea),
        lineSpacing: 4,
      }).setOrigin(0);
      this._textosOpcion.push(t);
      this._contenedor.add(t);
    }

    this._sincronizarVistaMenu();
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
    this._marco = null;
  }

  _sincronizarVistaMenu() {
    const n = this._items.length;
    const vis = Math.min(this._maxVisible, n);
    if (n > vis) {
      if (this._indiceAbs < this._firstVisible) this._firstVisible = this._indiceAbs;
      if (this._indiceAbs >= this._firstVisible + vis) this._firstVisible = this._indiceAbs - vis + 1;
    } else {
      this._firstVisible = 0;
    }

    for (let i = 0; i < this._textosOpcion.length; i++) {
      const gi = this._firstVisible + i;
      this._textosOpcion[i].setText(gi < n ? String(this._items[gi]) : '');
    }

    if (this._cursor) {
      this._cursor.setY(54 + (this._indiceAbs - this._firstVisible) * 12);
    }
  }

  _registrarTeclado() {
    this._handlerTeclado = (event) => {
      if (!this._activo) return;

      const n = this._items.length;
      const puedeEnvolver = n <= this._maxVisible;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          if (puedeEnvolver) {
            this._indiceAbs = (this._indiceAbs - 1 + n) % n;
          } else {
            this._indiceAbs = Math.max(0, this._indiceAbs - 1);
          }
          this._sincronizarVistaMenu();
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (puedeEnvolver) {
            this._indiceAbs = (this._indiceAbs + 1) % n;
          } else {
            this._indiceAbs = Math.min(n - 1, this._indiceAbs + 1);
          }
          this._sincronizarVistaMenu();
          break;
        case 'KeyZ':
        case 'Enter':
        case 'NumpadEnter': {
          const idx = this._indiceAbs;
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
