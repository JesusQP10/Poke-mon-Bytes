/**
 * Slice de Zustand para el estado del mundo
 * Maneja: posición, mapa actual, reloj
 */

export const crearMundoSlice = (set, get) => ({
  // Posición en el mundo
  mapaActual: 'player-room',
  posX: 5,
  posY: 7,

  // Reloj del juego
  reloj: {
    hora: 12,
    minutos: 0,
    diaSemana: 0, // 0 = Domingo, 1 = Lunes, etc.
  },

  // Setters
  setPosition: (posX, posY, mapaActual) => set({
    posX,
    posY,
    ...(mapaActual && { mapaActual }),
  }),

  setMapa: (mapaActual) => set({ mapaActual }),

  setReloj: (hora, minutos, diaSemana) => set({
    reloj: { hora, minutos, diaSemana },
  }),

  actualizarReloj: () => set((state) => {
    const { hora, minutos } = state.reloj;
    let nuevosMinutos = minutos + 1;
    let nuevaHora = hora;

    if (nuevosMinutos >= 60) {
      nuevosMinutos = 0;
      nuevaHora = (hora + 1) % 24;
    }

    return {
      reloj: {
        ...state.reloj,
        hora: nuevaHora,
        minutos: nuevosMinutos,
      },
    };
  }),

  inicializarReloj: () => {
    const fechaActual = new Date();
    set({
      reloj: {
        hora: fechaActual.getHours(),
        minutos: fechaActual.getMinutes(),
        diaSemana: fechaActual.getDay(),
      },
    });
  },

  // Reset
  resetMundo: () => set({
    mapaActual: 'player-room',
    posX: 5,
    posY: 7,
    reloj: {
      hora: 12,
      minutos: 0,
      diaSemana: 0,
    },
  }),
});
