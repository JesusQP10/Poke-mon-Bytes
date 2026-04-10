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
  mapaActual: 'player-room',
  posX: 5,
  posY: 7,

  // Reloj
  reloj: {
    hora: 12,
    minutos: 0,
    diaSemana: 0,
  },

  // Nueva partida
  esNuevaPartida: false,
  nombreJugador: '',

  // Flags de estado narrativo
  pokegearEntregado: false,
  starterElegido: false,
  pocionEntregada: false,

  // Inventario
  inventario: [],

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

  // Setters narrativos
  setPokegearEntregado: () => set({ pokegearEntregado: true }),
  setStarterElegido: (starter) => set({
    starterElegido: true,
    starter,
    team: [starter],
  }),
  setPocionEntregada: () => set({ pocionEntregada: true }),
  addInventario: (item) => set((state) => ({
    inventario: [...state.inventario, item],
  })),

  // Actualizar posición (llamado desde Phaser al moverse o guardar)
  setPosition: (posX, posY, mapaActual) => set({ posX, posY, mapaActual }),

  // Activar/desactivar flag de nueva partida
  setNuevaPartida: (nombre) => {
    const fechaActual = new Date();
    set({
      esNuevaPartida: true,
      nombreJugador: nombre,
      mapaActual: 'player-room',
      posX: 5,  // Usar la posición de inicio del mapa según CONFIG_MAPAS
      posY: 7,  // Usar la posición de inicio del mapa según CONFIG_MAPAS
      reloj: {
        hora: fechaActual.getHours(),
        minutos: fechaActual.getMinutes(),
        diaSemana: fechaActual.getDay(), // 0 = Domingo, 1 = Lunes...
      }
    });
  },
  clearNuevaPartida: () => set({ esNuevaPartida: false }),

  // Estados de carga/error
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

