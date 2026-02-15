import { create } from 'zustand';

export const usarJuegoStore = create((set) => ({
  // Estado del jugador
  playerState: null,
  starter: null,
  team: [],
  badges: [],
  money: 3000,
  loading: true,
  error: null,

  // Setear estado desde backend
  setPlayerState: (data) => set({
    playerState: data,
    starter: data.starter || null,
    team: data.team || [],
    badges: data.badges || [],
    money: data.money ?? 3000,
    loading: false,
  }),

  // Setear starter tras elección
  setStarter: (starter) => set({
    starter,
    team: [starter],
  }),

  // Estados de carga/error
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

