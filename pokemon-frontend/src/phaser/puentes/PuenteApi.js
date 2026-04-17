import api from '../../services/api';
import { usarAutenticacionStore } from '../../store/usarAutenticacionStore';
import { usarJuegoStore } from '../../store/usarJuegoStore';

/**
 * PuenteApi — llamadas al backend Spring Boot desde las escenas Phaser.
 * Usa la instancia de Axios del interceptor JWT configurado.
 */
const PuenteApi = {
  // ── Juego ──────────────────────────────────────────────────────────────

  async getEstadoJugador() {
    const res = await api.get('/api/v1/juego/estado');
    return res.data;
  },

  async getEquipo() {
    const res = await api.get('/api/v1/juego/equipo');
    return res.data;
  },

  /**
   * Guarda partida en servidor (posición, mapa + JSON `estadoCliente`).
   * Dinero e inventario viven en tablas servidor; no se sobrescribe desde el cliente.
   *
   * @param {object} payload
   * @param {{ actualizarCacheLocal?: boolean }} [opts] Si `false`, no escribe `localStorage`
   *   (el “último guardado” para Continuar debe ser solo GUARDAR en menú, no combates ni syncs).
   */
  async guardarJuegoEnServidor(payload, opts = {}) {
    const actualizarCacheLocal = opts.actualizarCacheLocal !== false;
    const res = await api.post('/api/v1/juego/guardar', payload);
    if (payload?.posX != null && payload?.mapaActual != null) {
      usarJuegoStore.getState().setPosition(payload.posX, payload.posY, payload.mapaActual);
    }
    if (usarAutenticacionStore.getState().token) {
      try {
        await this.sincronizarEstadoDesdeServidor();
      } catch (e) {
        console.warn('[guardar] sincronizar tras guardar', e);
      }
      if (actualizarCacheLocal) {
        try {
          usarJuegoStore.getState().guardarPartidaLocal();
        } catch (e) {
          console.warn('[guardar] caché local tras sincronizar', e);
        }
      }
    }
    return res.data;
  },

  /**
   * Alinea PS en BD con el último `teamCliente` guardado en servidor (blob).
   * Solo debe llamarse al **cargar partida** (p. ej. Continuar en el título), no en cada sync:
   * si se hace tras un combate sin guardar, revertiría los PS persistidos en BD por los turnos.
   */
  async restaurarHpCheckpointDesdeBlob() {
    if (!usarAutenticacionStore.getState().token) return;
    await api.post("/api/v1/juego/restaurar-hp-checkpoint");
  },

  /** GET /estado y aplica al store (multi-dispositivo). */
  async sincronizarEstadoDesdeServidor() {
    const data = await this.getEstadoJugador();
    usarJuegoStore.getState().setPlayerState(data);
    return data;
  },

  /** POST /juego/reiniciar — nueva partida en servidor (equipo, inventario, JSON, posición). */
  async reiniciarPartidaEnServidor() {
    const res = await api.post('/api/v1/juego/reiniciar');
    const data = res.data;
    usarJuegoStore.getState().setPlayerState(data);
    return data;
  },

  // ── Batalla ────────────────────────────────────────────────────────────

  async getMovimientos(pokemonUsuarioId) {
    const res = await api.get(`/api/v1/batalla/movimientos/${pokemonUsuarioId}`);
    return res.data;
  },

  async ejecutarTurno(solicitud) {
    const res = await api.post('/api/v1/batalla/turno', solicitud);
    return res.data;
  },

  async intentarCaptura(defensorId, nombreBall) {
    const res = await api.post('/api/v1/batalla/captura', { defensorId, nombreBall });
    return res.data;
  },

  /** Crea instancia salvaje en BD. Liberar al salir del combate si no hubo captura. */
  async prepararSalvajePokemon({ pokedexId, nivel }) {
    const res = await api.post('/api/v1/batalla/salvaje/preparar', { pokedexId, nivel });
    return res.data;
  },

  async liberarSalvajePokemon(pokemonUsuarioId) {
    await api.post('/api/v1/batalla/salvaje/liberar', { pokemonUsuarioId });
  },

  /** POST /juego/starter — persiste el inicial en BD (requiere JWT). */
  async elegirStarterServidor(starterId) {
    const res = await api.post('/api/v1/juego/starter', { starterId });
    return res.data;
  },

  // ── Tienda ─────────────────────────────────────────────────────────────

  async comprarItem(itemId, cantidad) {
    const res = await api.post('/api/v1/tienda/comprar', { itemId, cantidad });
    const { inventario, money } = res.data ?? {};
    if (Array.isArray(inventario) || Number.isFinite(money)) {
      usarJuegoStore.getState().setInventarioYMonto(
        Array.isArray(inventario) ? inventario : undefined,
        Number.isFinite(money) ? money : undefined,
      );
    }
    return res.data;
  },

  /** POST /juego/inventario/anadir — requiere JWT. `itemId` o `nombreItem` (p. ej. "Potion"). */
  async anadirInventarioServidor({ itemId, nombreItem, cantidad = 1 } = {}) {
    const body = { cantidad };
    if (itemId != null) body.itemId = itemId;
    if (nombreItem) body.nombreItem = nombreItem;
    const res = await api.post('/api/v1/juego/inventario/anadir', body);
    const inv = res.data?.inventario;
    if (Array.isArray(inv)) {
      usarJuegoStore.getState().setInventarioYMonto(inv, undefined);
    }
    return res.data;
  },
};

export default PuenteApi;
