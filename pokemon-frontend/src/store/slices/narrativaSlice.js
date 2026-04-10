/**
 * Slice de Zustand para flags narrativos
 * Maneja: progreso de la historia, eventos completados
 */

export const crearNarrativaSlice = (set, get) => ({
  // Flags de estado narrativo
  narrativa: {
    esNuevaPartida: false,
    pokegearEntregado: false,
    starterElegido: false,
    pocionEntregada: false,
    visitoElmLab: false,
    derrotoPrimerRival: false,
    llegoCiudadViolet: false,
  },

  // Setters individuales
  setNuevaPartida: (esNueva) => set((state) => ({
    narrativa: { ...state.narrativa, esNuevaPartida: esNueva },
  })),

  setPokegearEntregado: () => set((state) => ({
    narrativa: { ...state.narrativa, pokegearEntregado: true },
  })),

  setStarterElegido: () => set((state) => ({
    narrativa: { ...state.narrativa, starterElegido: true },
  })),

  setPocionEntregada: () => set((state) => ({
    narrativa: { ...state.narrativa, pocionEntregada: true },
  })),

  setVisitoElmLab: () => set((state) => ({
    narrativa: { ...state.narrativa, visitoElmLab: true },
  })),

  setDerrotoPrimerRival: () => set((state) => ({
    narrativa: { ...state.narrativa, derrotoPrimerRival: true },
  })),

  setLlegoCiudadViolet: () => set((state) => ({
    narrativa: { ...state.narrativa, llegoCiudadViolet: true },
  })),

  // Setter genérico
  setFlag: (flag, valor = true) => set((state) => ({
    narrativa: { ...state.narrativa, [flag]: valor },
  })),

  // Getter
  getFlag: (flag) => {
    const state = get();
    return state.narrativa[flag] || false;
  },

  // Reset
  resetNarrativa: () => set({
    narrativa: {
      esNuevaPartida: false,
      pokegearEntregado: false,
      starterElegido: false,
      pocionEntregada: false,
      visitoElmLab: false,
      derrotoPrimerRival: false,
      llegoCiudadViolet: false,
    },
  }),
});
