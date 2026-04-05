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

  async guardarJuego(posX, posY, mapaActual) {
    const res = await api.post('/api/v1/juego/guardar', { posX, posY, mapaActual });
    // Actualizar el store de React
    usarJuegoStore.getState().setPosition(posX, posY, mapaActual);
    return res.data;
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

  // ── Tienda ─────────────────────────────────────────────────────────────

  async comprarItem(itemId, cantidad) {
    const res = await api.post('/api/v1/tienda/comprar', { itemId, cantidad });
    return res.data;
  },
};

export default PuenteApi;
