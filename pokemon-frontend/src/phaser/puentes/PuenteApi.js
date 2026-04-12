import api from '../../services/api';
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
   * Guarda partida en servidor (posición, dinero, mapa + JSON `estadoCliente`).
   * Requiere JWT. El backend persiste en `USUARIOS.estado_cliente_json`.
   */
  async guardarJuegoEnServidor(payload) {
    const res = await api.post('/api/v1/juego/guardar', payload);
    if (payload?.posX != null && payload?.mapaActual != null) {
      usarJuegoStore.getState().setPosition(payload.posX, payload.posY, payload.mapaActual);
    }
    return res.data;
  },

  /** GET /estado y aplica al store (multi-dispositivo). */
  async sincronizarEstadoDesdeServidor() {
    const data = await this.getEstadoJugador();
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
    return res.data;
  },
};

export default PuenteApi;
