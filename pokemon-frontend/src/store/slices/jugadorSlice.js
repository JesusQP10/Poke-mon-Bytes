/**
 * Slice de Zustand para el estado del jugador
 * Maneja: nombre, starter, equipo, badges, dinero
 */

export const crearJugadorSlice = (set, get) => ({
  // Estado del jugador
  nombreJugador: '',
  starter: null,
  team: [],
  badges: [],
  money: 3000,

  // Setters
  setNombreJugador: (nombre) => set({ nombreJugador: nombre }),
  
  setStarter: (starter) => set({
    starter,
    team: [starter],
  }),
  
  setStarterElegido: (starter) => set((state) => ({
    starter,
    team: [starter],
    narrativa: {
      ...state.narrativa,
      starterElegido: true,
    },
  })),
  
  addPokemonEquipo: (pokemon) => set((state) => {
    if (state.team.length >= 6) {
      console.warn('[jugadorSlice] Equipo lleno, no se puede añadir más Pokémon');
      return state;
    }
    return { team: [...state.team, pokemon] };
  }),
  
  removePokemonEquipo: (index) => set((state) => ({
    team: state.team.filter((_, i) => i !== index),
  })),
  
  addBadge: (badge) => set((state) => ({
    badges: [...state.badges, badge],
  })),
  
  setMoney: (cantidad) => set({ money: cantidad }),
  
  addMoney: (cantidad) => set((state) => ({
    money: state.money + cantidad,
  })),
  
  removeMoney: (cantidad) => set((state) => ({
    money: Math.max(0, state.money - cantidad),
  })),

  // Reset
  resetJugador: () => set({
    nombreJugador: '',
    starter: null,
    team: [],
    badges: [],
    money: 3000,
  }),
});
