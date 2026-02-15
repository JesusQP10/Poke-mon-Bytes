import api from './api';

export const gameService = {
  // Obtener estado completo del jugador
  // Respuesta esperada: { starter: null | {...}, team: [], badges: [], money: 3000, ... }
  getPlayerState: async () => {
    const response = await api.get('/api/v1/juego/estado');
    return response.data;
  },

  // Elegir starter
  // Body: { starterId: 155 } (número de pokédex)
  // Respuesta esperada: { starter: { id: 155, name: "Cyndaquil", type: "fire", ... } }
  elegirInicial: async (starterId) => {
    const response = await api.post('/api/v1/juego/starter', { starterId });
    return response.data;
  },

  // Obtener equipo del jugador
  obtenerEquipo: async () => {
    const response = await api.get('/api/v1/juego/equipo');
    return response.data;
  },

  // Guardar partida
  guardarJuego: async () => {
    const response = await api.post('/api/v1/juego/guardar');
    return response.data;
  },
};

