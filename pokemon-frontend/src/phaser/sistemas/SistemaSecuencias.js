/**
 * SistemaSecuencias — gestor de cutscenes y eventos narrativos.
 *
 * Uso:
 *   const seq = new SistemaSecuencias(scene);
 *   seq.ejecutar([
 *     seq.pasoDialogo(dialogo, ['Línea 1', 'Línea 2']),
 *     seq.pasoTween(sprite, { x: 80 }, 500),
 *     seq.pasoStore(() => store.setPokegearEntregado()),
 *   ]);
 */
export default class SistemaSecuencias {
  constructor(scene) {
    this._scene = scene;
    this._activo = false;
  }

  get activo() {
    return this._activo;
  }

  /**
   * Ejecuta un array de pasos en orden secuencial.
   * Cada paso es una función (resolve) => void que llama a resolve() al terminar.
   * @param {Array<Function>} pasos
   * @param {Function} [onFin] - Callback opcional al terminar todos los pasos
   */
  ejecutar(pasos, onFin) {
    if (!pasos || pasos.length === 0) {
      onFin?.();
      return;
    }
    this._activo = true;
    this._ejecutarPaso(pasos, 0, onFin);
  }

  _ejecutarPaso(pasos, indice, onFin) {
    if (indice >= pasos.length) {
      this._activo = false;
      onFin?.();
      return;
    }
    const paso = pasos[indice];
    paso(() => this._ejecutarPaso(pasos, indice + 1, onFin));
  }

  // ── Helpers de paso ────────────────────────────────────────────────────

  /**
   * Muestra un diálogo y resuelve al cerrar la última línea.
   * @param {SistemaDialogo} dialogo - Instancia de SistemaDialogo
   * @param {string[]} lineas
   * @param {{ hablante?: string }} [opciones] - Ver `SistemaDialogo.mostrar`.
   */
  pasoDialogo(dialogo, lineas, opciones) {
    return (resolve) => {
      dialogo.mostrar(lineas, resolve, opciones ?? {});
    };
  }

  /**
   * Ejecuta un tween de Phaser y resuelve en onComplete.
   * @param {Phaser.GameObjects.GameObject|Array} targets
   * @param {Object} props - Propiedades del tween (x, y, alpha, etc.)
   * @param {number} duracion - Duración en ms
   */
  pasoTween(targets, props, duracion) {
    return (resolve) => {
      this._scene.tweens.add({
        targets,
        ...props,
        duration: duracion,
        ease: 'Linear',
        onComplete: resolve,
      });
    };
  }

  /**
   * Llama a un setter del store y resuelve inmediatamente.
   * @param {Function} setter
   */
  pasoStore(setter) {
    return (resolve) => {
      setter();
      resolve();
    };
  }

  /**
   * Muestra una UI de selección y resuelve cuando el usuario confirma.
   * @param {Object} ui - Objeto con método mostrar(onElegido)
   * @param {Function} onElegido - Callback (indice) => void llamado al confirmar
   */
  pasoUI(ui, onElegido) {
    return (resolve) => {
      ui.mostrar((indice) => {
        onElegido(indice, resolve);
      });
    };
  }

  /**
   * Espera un tiempo en ms y resuelve.
   * @param {number} ms
   */
  pasoEspera(ms) {
    return (resolve) => {
      this._scene.time.delayedCall(ms, resolve);
    };
  }
}
