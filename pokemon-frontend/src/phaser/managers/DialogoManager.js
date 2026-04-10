/**
 * DialogoManager - Gestiona diálogos con soporte para variables
 * Carga diálogos desde JSON y reemplaza placeholders
 */

import dialogosData from '../data/dialogos.json';

export default class DialogoManager {
  constructor(sistemaDialogo) {
    this.sistema = sistemaDialogo;
    this.dialogos = dialogosData;
    this.variables = {};
  }

  /**
   * Establece variables para reemplazo en diálogos
   * @param {Object} vars - { JUGADOR: 'Ash', POKEMON: 'Pikachu', ... }
   */
  setVariables(vars) {
    this.variables = { ...this.variables, ...vars };
  }

  /**
   * Obtiene un diálogo por su ruta (ej: 'intro.madre_inicial')
   * @param {string} ruta - Ruta del diálogo en formato 'categoria.clave'
   * @returns {string[]} Array de líneas del diálogo
   */
  obtener(ruta) {
    const partes = ruta.split('.');
    let dialogo = this.dialogos;
    
    for (const parte of partes) {
      dialogo = dialogo?.[parte];
      if (!dialogo) {
        console.warn(`[DialogoManager] Diálogo no encontrado: ${ruta}`);
        return [`[DIÁLOGO NO ENCONTRADO: ${ruta}]`];
      }
    }
    
    if (!Array.isArray(dialogo)) {
      console.warn(`[DialogoManager] Diálogo inválido: ${ruta}`);
      return [`[DIÁLOGO INVÁLIDO: ${ruta}]`];
    }
    
    return this._reemplazarVariables(dialogo);
  }

  /**
   * Muestra un diálogo por su ruta
   * @param {string} ruta - Ruta del diálogo
   * @param {Function} onComplete - Callback al terminar
   */
  mostrar(ruta, onComplete) {
    const lineas = this.obtener(ruta);
    this.sistema.mostrar(lineas, onComplete);
  }

  /**
   * Muestra un diálogo con variables temporales
   * @param {string} ruta - Ruta del diálogo
   * @param {Object} vars - Variables temporales para este diálogo
   * @param {Function} onComplete - Callback al terminar
   */
  mostrarCon(ruta, vars, onComplete) {
    const varsAnteriores = { ...this.variables };
    this.setVariables(vars);
    
    const lineas = this.obtener(ruta);
    this.sistema.mostrar(lineas, () => {
      this.variables = varsAnteriores;
      onComplete?.();
    });
  }

  /**
   * Reemplaza variables en las líneas del diálogo
   * @private
   */
  _reemplazarVariables(lineas) {
    return lineas.map(linea => {
      let resultado = linea;
      
      for (const [clave, valor] of Object.entries(this.variables)) {
        const placeholder = `[${clave}]`;
        resultado = resultado.replaceAll(placeholder, valor);
      }
      
      return resultado;
    });
  }

  /**
   * Verifica si existe un diálogo
   * @param {string} ruta - Ruta del diálogo
   * @returns {boolean}
   */
  existe(ruta) {
    const partes = ruta.split('.');
    let dialogo = this.dialogos;
    
    for (const parte of partes) {
      dialogo = dialogo?.[parte];
      if (!dialogo) return false;
    }
    
    return Array.isArray(dialogo);
  }
}
