import { create } from 'zustand';

/** Clave única para partida guardada en el navegador (misma que usa el título). */
export const SAVE_STORAGE_KEY = 'pokemon_bytes_save_v1';
const SAVE_VERSION = 1;

export const usarJuegoStore = create((set, get) => ({
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

  // Flujo de juego (overworld)
  gameStep: 'PLAYING',
  /** Espejo legible de si ya tiene starter (también `starterElegido`). */
  hasStarter: false,
  /** Habitación: poción del PC ya retirada al inventario. */
  pcPocionRetirada: false,

  // Flags de estado narrativo
  pokegearEntregado: false,
  starterElegido: false,
  /** Tras la escena del trigger en elm-lab (hablar con Elm antes de tocar Poké Balls). */
  elmCharlaEleccionStarter: false,
  pocionEntregada: false,

  // Inventario
  inventario: [],

  /**
   * Hidrata desde GET /juego/estado: equipo en BD + `estadoCliente` (JSON guardado).
   * Si no hay Pokémon en BD pero sí `teamCliente` en el JSON, usa ese equipo (modo solo-cliente).
   *
   * Si `estadoCliente` no trae clave `inventario` / `teamCliente`, no se pisan los valores
   * que ya hubiera en memoria.
   */
  setPlayerState: (data) => {
    set((state) => {
      const ec = data?.estadoCliente && typeof data.estadoCliente === 'object'
        ? data.estadoCliente
        : {};
      let teamRaw = Array.isArray(data?.team) ? data.team : [];
      if (!teamRaw.length && Array.isArray(ec.teamCliente) && ec.teamCliente.length) {
        teamRaw = ec.teamCliente;
      }
      if (
        !teamRaw.length
        && !('teamCliente' in ec)
        && Array.isArray(state.team)
        && state.team.length > 0
      ) {
        teamRaw = state.team;
      }
      const team = teamRaw.map((p) => ({
        ...p,
        nombre: p.nombre ?? p.name ?? p.nombreApodo ?? '???',
        nombreApodo: p.nombreApodo ?? p.nombre ?? p.name,
        id: p.id ?? p.pokedexId,
        pokemonUsuarioId: p.pokemonUsuarioId,
        nivel: p.nivel ?? p.level ?? 5,
        hpActual: p.hpActual ?? p.hp ?? 20,
        hpMax: p.hpMax ?? 20,
        ataque: p.ataque ?? p.attack ?? p.ataqueStat,
        defensa: p.defensa ?? p.defense ?? p.defensaStat,
        ataqueEspecial: p.ataqueEspecial ?? p.ataqueEspecialStat,
        defensaEspecial: p.defensaEspecial ?? p.defensaEspecialStat,
        velocidad: p.velocidad ?? p.velocidadStat,
        tipo1: p.tipo1 ?? p.type,
        tipo2: p.tipo2 ?? null,
      }));
      let starter = data?.starter ?? ec.starterCliente ?? (team[0] ?? null);
      if (starter) {
        starter = {
          ...starter,
          nombre: starter.nombre ?? starter.name ?? '???',
          id: starter.id ?? starter.pokedexId,
          pokemonUsuarioId: starter.pokemonUsuarioId,
        };
      }
      const inventario = 'inventario' in ec
        ? (Array.isArray(ec.inventario) ? ec.inventario : [])
        : (Array.isArray(state.inventario) ? state.inventario : []);
      return {
        playerState: data,
        starter,
        team,
        badges: Array.isArray(ec.badges) ? ec.badges : (data.badges || []),
        money: data.money ?? ec.money ?? 3000,
        mapaActual: data.mapaActual || ec.mapaActual || 'new-bark-town',
        posX: data.posX ?? ec.posX ?? 5,
        posY: data.posY ?? ec.posY ?? 5,
        loading: false,
        gameStep: ec.gameStep ?? 'PLAYING',
        hasStarter: Boolean(ec.hasStarter ?? data.starter ?? team.length > 0),
        pcPocionRetirada: Boolean(ec.pcPocionRetirada),
        nombreJugador: ec.nombreJugador ?? '',
        inventario,
        pokegearEntregado: Boolean(ec.pokegearEntregado),
        starterElegido: Boolean(ec.starterElegido ?? team.length > 0),
        elmCharlaEleccionStarter: Boolean(
          ec.elmCharlaEleccionStarter ?? ec.starterElegido ?? team.length > 0,
        ),
        pocionEntregada: Boolean(ec.pocionEntregada),
        esNuevaPartida: ec.esNuevaPartida === true,
        reloj: ec.reloj && typeof ec.reloj === 'object'
          ? {
              hora: ec.reloj.hora ?? 12,
              minutos: ec.reloj.minutos ?? 0,
              diaSemana: ec.reloj.diaSemana ?? 0,
            }
          : { hora: 12, minutos: 0, diaSemana: 0 },
      };
    });
  },

  /**
   * Si equipo o mochila están vacíos en RAM pero hay guardado en localStorage,
   * restaura solo esos arrays.
   */
  rellenarEquipoYmochilaDesdeGuardadoLocal: () => {
    set((state) => {
      const tieneTeam = Array.isArray(state.team) && state.team.length > 0;
      const tieneInv = Array.isArray(state.inventario) && state.inventario.length > 0;
      if (tieneTeam && tieneInv) return {};
      let raw;
      try {
        raw = localStorage.getItem(SAVE_STORAGE_KEY);
      } catch {
        return {};
      }
      if (!raw || !raw.trim()) return {};
      let disk;
      try {
        disk = JSON.parse(raw);
      } catch {
        return {};
      }
      if (!disk || disk.v !== SAVE_VERSION) return {};
      const teamDisk = Array.isArray(disk.team) ? disk.team : [];
      const invDisk = Array.isArray(disk.inventario) ? disk.inventario : [];
      const next = {};
      if (!tieneTeam && teamDisk.length) next.team = teamDisk;
      if (!tieneInv && invDisk.length) next.inventario = invDisk;
      if (!Object.keys(next).length) return {};
      if (!state.starter && disk.starter) next.starter = disk.starter;
      if (!state.starterElegido && disk.starterElegido) next.starterElegido = true;
      if (!state.hasStarter && (disk.hasStarter || disk.starterElegido || teamDisk.length)) {
        next.hasStarter = true;
      }
      return next;
    });
  },

  /** Cuerpo para POST /juego/guardar (servidor + caché local). */
  construirPayloadGuardado: () => {
    const s = get();
    const estadoCliente = {
      v: SAVE_VERSION,
      nombreJugador: s.nombreJugador,
      inventario: s.inventario,
      pokegearEntregado: s.pokegearEntregado,
      pocionEntregada: s.pocionEntregada,
      pcPocionRetirada: s.pcPocionRetirada,
      hasStarter: s.hasStarter,
      starterElegido: s.starterElegido,
      elmCharlaEleccionStarter: s.elmCharlaEleccionStarter,
      gameStep: s.gameStep,
      badges: s.badges,
      reloj: s.reloj,
      esNuevaPartida: s.esNuevaPartida,
      teamCliente: s.team,
      starterCliente: s.starter,
    };
    return {
      posX: s.posX,
      posY: s.posY,
      mapaActual: s.mapaActual,
      money: s.money,
      estadoCliente,
    };
  },

  // Setters narrativos
  setPokegearEntregado: () => set({ pokegearEntregado: true }),
  setStarterElegido: (starter) => set({
    starterElegido: true,
    elmCharlaEleccionStarter: true,
    hasStarter: true,
    starter,
    team: [starter],
  }),
  setPocionEntregada: () => set({ pocionEntregada: true }),
  setElmCharlaEleccionStarter: () => set({ elmCharlaEleccionStarter: true }),
  setPcPocionRetirada: () => set({ pcPocionRetirada: true }),
  setGameStep: (gameStep) => set({ gameStep }),
  addInventario: (item) => set((state) => ({
    inventario: [...state.inventario, item],
  })),

  /** Sincroniza HP (p. ej. tras batalla) sin sustituir el objeto Pokémon entero. */
  setPokemonHpEnEquipo: (indice, hpActual) => set((state) => {
    if (!state.team[indice]) return {};
    const team = state.team.map((p, i) =>
      i === indice ? { ...p, hpActual } : p
    );
    return { team };
  }),

  // Actualizar posición (llamado desde Phaser al moverse o guardar)
  setPosition: (posX, posY, mapaActual) => set({ posX, posY, mapaActual }),

  // Activar/desactivar flag de nueva partida
  setNuevaPartida: (nombre) => {
    const fechaActual = new Date();
    set({
      esNuevaPartida: true,
      nombreJugador: nombre,
      gameStep: 'PLAYING',
      hasStarter: false,
      starterElegido: false,
      elmCharlaEleccionStarter: false,
      starter: null,
      team: [],
      inventario: [],
      pokegearEntregado: false,
      pocionEntregada: false,
      pcPocionRetirada: false,
      badges: [],
      mapaActual: 'player-room',
      posX: 5,
      posY: 7,
      reloj: {
        hora: fechaActual.getHours(),
        minutos: fechaActual.getMinutes(),
        diaSemana: fechaActual.getDay(),
      },
    });
  },
  clearNuevaPartida: () => set({ esNuevaPartida: false }),

  // Estados de carga/error
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  /** Serializa estado jugable en localStorage (sin JWT ni playerState del backend). */
  guardarPartidaLocal: () => {
    const s = get();
    const payload = {
      v: SAVE_VERSION,
      nombreJugador: s.nombreJugador,
      mapaActual: s.mapaActual,
      posX: s.posX,
      posY: s.posY,
      starterElegido: s.starterElegido,
      elmCharlaEleccionStarter: s.elmCharlaEleccionStarter,
      starter: s.starter,
      team: s.team,
      inventario: s.inventario,
      pokegearEntregado: s.pokegearEntregado,
      pocionEntregada: s.pocionEntregada,
      pcPocionRetirada: s.pcPocionRetirada,
      hasStarter: s.hasStarter,
      gameStep: s.gameStep,
      money: s.money,
      badges: s.badges,
      reloj: s.reloj,
      esNuevaPartida: false,
    };
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[guardarPartidaLocal]', e);
      throw e;
    }
  },

  /**
   * Restaura desde localStorage. Devuelve false si no hay datos válidos.
   * No sustituye playerState del backend; deja loading en false para modo offline.
   */
  cargarPartidaLocal: () => {
    let raw;
    try {
      raw = localStorage.getItem(SAVE_STORAGE_KEY);
    } catch {
      return false;
    }
    if (!raw || !raw.trim()) return false;
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return false;
    }
    if (!data || data.v !== SAVE_VERSION) return false;

    set({
      loading: false,
      error: null,
      esNuevaPartida: false,
      nombreJugador: data.nombreJugador ?? '',
      mapaActual: data.mapaActual ?? 'player-room',
      posX: Number.isFinite(data.posX) ? data.posX : 5,
      posY: Number.isFinite(data.posY) ? data.posY : 7,
      starterElegido: Boolean(data.starterElegido),
      elmCharlaEleccionStarter: Boolean(
        data.elmCharlaEleccionStarter ?? data.starterElegido,
      ),
      starter: data.starter ?? null,
      team: Array.isArray(data.team) ? data.team : [],
      inventario: Array.isArray(data.inventario) ? data.inventario : [],
      pokegearEntregado: Boolean(data.pokegearEntregado),
      pocionEntregada: Boolean(data.pocionEntregada),
      pcPocionRetirada: Boolean(data.pcPocionRetirada),
      hasStarter: Boolean(data.hasStarter ?? data.starterElegido),
      gameStep: data.gameStep ?? 'PLAYING',
      money: Number.isFinite(data.money) ? data.money : 3000,
      badges: Array.isArray(data.badges) ? data.badges : [],
      reloj: data.reloj && typeof data.reloj === 'object'
        ? {
            hora: data.reloj.hora ?? 12,
            minutos: data.reloj.minutos ?? 0,
            diaSemana: data.reloj.diaSemana ?? 0,
          }
        : { hora: 12, minutos: 0, diaSemana: 0 },
    });
    return true;
  },
}));

/** ¿Hay partida en localStorage? (para el menú del título). */
export function existePartidaGuardadaLocal() {
  if (typeof window === 'undefined') return false;
  try {
    const v = window.localStorage.getItem(SAVE_STORAGE_KEY);
    return Boolean(v && v.trim().length > 0);
  } catch {
    return false;
  }
}

