/**
 * Store refactorizado usando slices modulares
 * Combina todos los slices en un único store
 */

import { create } from 'zustand';
import { crearJugadorSlice } from './slices/jugadorSlice';
import { crearMundoSlice } from './slices/mundoSlice';
import { crearInventarioSlice } from './slices/inventarioSlice';
import { crearNarrativaSlice } from './slices/narrativaSlice';

export const usarJuegoStore = create((set, get) => ({
  // Estado de carga
  loading: true,
  error: null,
  playerState: null,

  // Combinar todos los slices
  ...crearJugadorSlice(set, get),
  ...crearMundoSlice(set, get),
  ...crearInventarioSlice(set, get),
  ...crearNarrativaSlice(set, get),

  // Métodos globales
  setPlayerState: (data) => set({
    playerState: data,
    nombreJugador: data.nombreJugador || '',
    starter: data.starter || null,
    team: data.team || [],
    badges: data.badges || [],
    money: data.money ?? 3000,
    mapaActual: data.mapaActual || 'new-bark-town',
    posX: data.posX ?? 5,
    posY: data.posY ?? 5,
    inventario: data.inventario || [],
    loading: false,
  }),

  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error, loading: false }),

  // Iniciar nueva partida
  iniciarNuevaPartida: (nombre) => {
    const fechaActual = new Date();
    set({
      // Jugador
      nombreJugador: nombre,
      starter: null,
      team: [],
      badges: [],
      money: 3000,
      
      // Mundo
      mapaActual: 'player-room',
      posX: 5,
      posY: 7,
      reloj: {
        hora: fechaActual.getHours(),
        minutos: fechaActual.getMinutes(),
        diaSemana: fechaActual.getDay(),
      },
      
      // Inventario
      inventario: [],
      
      // Narrativa
      narrativa: {
        esNuevaPartida: true,
        pokegearEntregado: false,
        starterElegido: false,
        pocionEntregada: false,
        visitoElmLab: false,
        derrotoPrimerRival: false,
        llegoCiudadViolet: false,
      },
    });
  },

  clearNuevaPartida: () => set((state) => ({
    narrativa: { ...state.narrativa, esNuevaPartida: false },
  })),

  // Reset completo
  resetJuego: () => {
    const state = get();
    state.resetJugador();
    state.resetMundo();
    state.resetInventario();
    state.resetNarrativa();
    set({ loading: true, error: null, playerState: null });
  },

  // Compatibilidad con código antiguo (deprecated)
  esNuevaPartida: false,
  pokegearEntregado: false,
  starterElegido: false,
  pocionEntregada: false,
  
  setNuevaPartida: (nombre) => {
    console.warn('[DEPRECATED] Usar iniciarNuevaPartida() en su lugar');
    get().iniciarNuevaPartida(nombre);
  },
  
  addInventario: (item) => {
    console.warn('[DEPRECATED] Usar addItem() en su lugar');
    get().addItem(item);
  },
}));

// Selector helpers para mejor performance
export const useJugador = () => usarJuegoStore((state) => ({
  nombreJugador: state.nombreJugador,
  starter: state.starter,
  team: state.team,
  badges: state.badges,
  money: state.money,
}));

export const useMundo = () => usarJuegoStore((state) => ({
  mapaActual: state.mapaActual,
  posX: state.posX,
  posY: state.posY,
  reloj: state.reloj,
}));

export const useInventario = () => usarJuegoStore((state) => ({
  inventario: state.inventario,
  addItem: state.addItem,
  removeItem: state.removeItem,
  tieneItem: state.tieneItem,
}));

export const useNarrativa = () => usarJuegoStore((state) => ({
  narrativa: state.narrativa,
  setFlag: state.setFlag,
  getFlag: state.getFlag,
}));
