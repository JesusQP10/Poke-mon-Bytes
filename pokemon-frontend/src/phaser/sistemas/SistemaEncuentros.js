import { usarJuegoStore } from '../../store/usarJuegoStore';

/**
 * SistemaEncuentros — detecta encuentros aleatorios al caminar en hierba alta.
 *
 * Gen II:
 *   - Cada paso en hierba aumenta un contador.
 *   - Se genera un umbral aleatorio entre MIN_PASOS y MAX_PASOS.
 *   - Al alcanzar el umbral, se selecciona un Pokémon de la tabla de encuentros
 *     ponderada por tasa y se emite el evento 'encuentro'.
 *   - Si el jugador no tiene starter en el equipo, no se emite el evento.
 */

const MIN_PASOS = 4;
const MAX_PASOS = 7;

export default class SistemaEncuentros {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Tilemaps.TilemapLayer} capaHierba
   * @param {Object} tablaEncuentros - JSON cargado desde encuentros_<mapa>.json
   */
  constructor(scene, capaHierba, tablaEncuentros) {
    this.scene = scene;
    this.capaHierba = capaHierba;
    this.tabla = tablaEncuentros?.hierba_alta?.pokemon ?? [];
    this._pasosEnHierba = 0;
    this._umbral = this._nuevoUmbral();
  }

  /**
   * Llamar desde EscenaOverworld cuando el jugador completa un paso.
   * @param {number} tileX
   * @param {number} tileY
   */
  comprobarPaso(tileX, tileY) {
    const tile = this.capaHierba?.getTileAt(tileX, tileY);

    if (!tile) {
      // Salió de la hierba — reiniciar contador
      this._pasosEnHierba = 0;
      this._umbral = this._nuevoUmbral();
      return;
    }

    this._pasosEnHierba++;

    if (this._pasosEnHierba >= this._umbral) {
      this._pasosEnHierba = 0;
      this._umbral = this._nuevoUmbral();

      // Solo con Pokémon persistido en servidor.
      const team = usarJuegoStore.getState().team ?? [];
      if (team.length === 0) return;
      const tieneEquipoReal = team.some((p) => p.pokemonUsuarioId != null || p.esStarter);
      if (!tieneEquipoReal) return;

      const pokemon = this._seleccionarPokemon();
      if (pokemon) {
        this.scene.events.emit('encuentro', pokemon);
      }
    }
  }

  _nuevoUmbral() {
    return MIN_PASOS + Math.floor(Math.random() * (MAX_PASOS - MIN_PASOS + 1));
  }

  _seleccionarPokemon() {
    if (!this.tabla.length) return null;

    // Suma total de tasas para normalizar
    const total = this.tabla.reduce((acc, p) => acc + p.tasa, 0);
    let roll = Math.floor(Math.random() * total);

    for (const entry of this.tabla) {
      roll -= entry.tasa;
      if (roll < 0) {
        const nivel =
          entry.nivelMin +
          Math.floor(Math.random() * (entry.nivelMax - entry.nivelMin + 1));
        return { id: entry.id, nombre: entry.nombre, nivel };
      }
    }

    // Fallback: último de la tabla
    const ultimo = this.tabla[this.tabla.length - 1];
    return { id: ultimo.id, nombre: ultimo.nombre, nivel: ultimo.nivelMin };
  }
}
