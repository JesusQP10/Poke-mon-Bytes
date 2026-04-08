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

  // Posición en el mundo
  mapaActual: 'player-house',
  posX: 3,
  posY: 3,

  // Nueva partida
  esNuevaPartida: false,
  nombreJugador: '',

  // Setear estado desde backend
  setPlayerState: (data) => set({
    playerState: data,
    starter: data.starter || null,
    team: data.team || [],
    badges: data.badges || [],
    money: data.money ?? 3000,
    mapaActual: data.mapaActual || 'new-bark-town',
    posX: data.posX ?? 5,
    posY: data.posY ?? 5,
    loading: false,
  }),

  // Setear starter tras elección
  setStarter: (starter) => set({
    starter,
    team: [starter],
  }),

  // Actualizar posición (llamado desde Phaser al moverse o guardar)
  setPosition: (posX, posY, mapaActual) => set({ posX, posY, mapaActual }),

  // Activar/desactivar flag de nueva partida
  setNuevaPartida: (nombre) => set({
    esNuevaPartida: true,
    nombreJugador: nombre,
    mapaActual: 'player-house',
    posX: 3,
    posY: 3,
  }),
  clearNuevaPartida: () => set({ esNuevaPartida: false }),

  // Estados de carga/error
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

