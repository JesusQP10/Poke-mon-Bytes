import { create } from 'zustand';

/**
 * Une líneas del mismo ítem (id numérico de BD o nombre tipo poción/potion).
 * Evita cantidades infladas si hubo filas duplicadas o mezcla JSON antiguo + servidor.
 * @param {unknown[]} lineas
 */
function normalizarListaInventario(lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) return [];
  const map = new Map();
  for (const it of lineas) {
    if (!it || typeof it !== 'object') continue;
    const rawId = it.itemId ?? it.id;
    const numId = Number(rawId);
    const clave =
      Number.isFinite(numId) && numId > 0 ? `i:${numId}` : `n:${nombreClaveFusionInv(it.nombre)}`;
    const q = Number.isFinite(Number(it.cantidad)) ? Math.max(0, Math.floor(Number(it.cantidad))) : 1;
    const prev = map.get(clave);
    if (prev) {
      prev.cantidad = (Number(prev.cantidad) || 0) + q;
    } else {
      map.set(clave, { ...it, cantidad: q });
    }
  }
  return [...map.values()];
}

function nombreClaveFusionInv(nombre) {
  const s = String(nombre ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  if (!s) return '_';
  if (s.includes('pocion') || s.includes('potion')) return 'potion';
  return s;
}

/** IDs Pokédex nacionales presentes en el equipo (sin duplicados). */
function idsPokedexDesdeEquipo(team) {
  if (!Array.isArray(team)) return [];
  const out = new Set();
  for (const p of team) {
    const n = Number(p?.id ?? p?.pokedexId);
    if (Number.isFinite(n) && n > 0) out.add(n);
  }
  return [...out];
}

/** Une lista guardada + especies del equipo, orden numérico. */
function fusionarPokedexRegistrados(prev, team) {
  const s = new Set();
  if (Array.isArray(prev)) {
    for (const x of prev) {
      const n = Number(x);
      if (Number.isFinite(n) && n > 0) s.add(n);
    }
  }
  for (const n of idsPokedexDesdeEquipo(team)) s.add(n);
  return [...s].sort((a, b) => a - b);
}

function generarIdEntrenadorCincoDigitos() {
  const n = Math.floor(Math.random() * 100000);
  return String(n).padStart(5, '0');
}

/** ID estable para guardados antiguos sin `idEntrenadorPublico`. */
function idEntrenadorDesdeSemilla(semilla) {
  let h = 2166136261;
  const str = String(semilla ?? '');
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return String(Math.abs(h) % 100000).padStart(5, '0');
}

function normalizarIdEntrenador5(raw) {
  if (raw == null) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return digits.slice(-5).padStart(5, '0');
}

/**
 * Inventario de la tabla servidor: nunca mezclar con `estadoCliente.inventario` del JSON
 * (clientes viejos guardaban mochila ahí y al hidratar se duplicaba con la BD).
 * @param {Record<string, unknown> | null | undefined} data
 * @param {{ inventario?: unknown[] }} state
 */
function inventarioParaStore(data, state) {
  if (data != null && Object.prototype.hasOwnProperty.call(data, 'inventario')) {
    const raw = data.inventario;
    if (Array.isArray(raw)) return normalizarListaInventario(raw);
    return [];
  }
  const prev = Array.isArray(state.inventario) ? state.inventario : [];
  return normalizarListaInventario(prev);
}

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
  /** N.º ID visible (5 dígitos), estable por partida. */
  idEntrenadorPublico: '',
  /** Segundos de juego en overworld (no cuenta menú React ni escena pausada). */
  tiempoJuegoSegundos: 0,
  /** Especies registradas en Pokédex (n.º nacional); se fusiona con el equipo al hidratar. */
  pokedexRegistrados: [],
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
   * Hidrata desde GET /juego/estado: equipo en BD + inventario/dinero en BD + `estadoCliente` (JSON).
   * Si no hay Pokémon en BD pero sí `teamCliente` en el JSON, usa ese equipo (modo solo-cliente).
   * Inventario y dinero del JSON del cliente no sustituyen a los del servidor.
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
      let team = teamRaw.map((p) => ({
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
      if (team.length > 0 && !team.some((p) => p.esStarter) && team[0].pokemonUsuarioId != null) {
        team = team.map((p, i) => (i === 0 ? { ...p, esStarter: true } : p));
      }
      let starter = data?.starter ?? ec.starterCliente ?? (team[0] ?? null);
      if (starter) {
        starter = {
          ...starter,
          nombre: starter.nombre ?? starter.name ?? '???',
          id: starter.id ?? starter.pokedexId,
          pokemonUsuarioId: starter.pokemonUsuarioId,
          esStarter: starter.esStarter ?? team[0]?.esStarter ?? false,
        };
      }
      const inventario = inventarioParaStore(data, state);
      const moneyServidor = data != null && Object.prototype.hasOwnProperty.call(data, 'money');
      const money = moneyServidor && Number.isFinite(Number(data.money))
        ? Number(data.money)
        : (Number.isFinite(Number(ec.money)) ? Number(ec.money) : (Number.isFinite(state.money) ? state.money : 3000));
      const prevDex = 'pokedexRegistrados' in ec ? ec.pokedexRegistrados : state.pokedexRegistrados;
      const pokedexRegistrados = fusionarPokedexRegistrados(prevDex, team);
      const idEc = normalizarIdEntrenador5(ec.idEntrenadorPublico);
      const idPrev = normalizarIdEntrenador5(state.idEntrenadorPublico);
      const idEntrenadorPublico = idEc || idPrev || '';
      const tiempoEc =
        'tiempoJuegoSegundos' in ec && ec.tiempoJuegoSegundos != null
          ? Number(ec.tiempoJuegoSegundos)
          : NaN;
      const tiempoJuegoSegundos = Number.isFinite(tiempoEc) && tiempoEc >= 0
        ? Math.floor(tiempoEc)
        : (Number.isFinite(state.tiempoJuegoSegundos) ? state.tiempoJuegoSegundos : 0);
      return {
        playerState: data,
        starter,
        team,
        badges: Array.isArray(ec.badges) ? ec.badges : (data.badges || []),
        money,
        pokedexRegistrados,
        idEntrenadorPublico,
        tiempoJuegoSegundos,
        mapaActual: data.mapaActual || ec.mapaActual || 'new-bark-town',
        posX: data.posX ?? ec.posX ?? 5,
        posY: data.posY ?? ec.posY ?? 5,
        loading: false,
        gameStep: 'gameStep' in ec ? ec.gameStep : state.gameStep,
        hasStarter: Boolean(ec.hasStarter ?? data.starter ?? team.length > 0),
        // Si el servidor aún no devuelve `estadoCliente` (JSON null), no forzar false: borraba flags
        // locales y repetía recompensas (ayudante + PC) en cada sincronización.
        pcPocionRetirada: 'pcPocionRetirada' in ec ? Boolean(ec.pcPocionRetirada) : state.pcPocionRetirada,
        nombreJugador: 'nombreJugador' in ec ? String(ec.nombreJugador ?? '') : (state.nombreJugador ?? ''),
        inventario,
        pokegearEntregado: 'pokegearEntregado' in ec ? Boolean(ec.pokegearEntregado) : state.pokegearEntregado,
        starterElegido: Boolean(ec.starterElegido ?? team.length > 0),
        elmCharlaEleccionStarter: Boolean(
          ec.elmCharlaEleccionStarter ?? ec.starterElegido ?? team.length > 0,
        ),
        pocionEntregada: 'pocionEntregada' in ec ? Boolean(ec.pocionEntregada) : state.pocionEntregada,
        esNuevaPartida: 'esNuevaPartida' in ec ? ec.esNuevaPartida === true : state.esNuevaPartida,
        reloj:
          ec.reloj && typeof ec.reloj === 'object'
            ? {
                hora: ec.reloj.hora ?? 12,
                minutos: ec.reloj.minutos ?? 0,
                diaSemana: ec.reloj.diaSemana ?? 0,
              }
            : (state.reloj ?? { hora: 12, minutos: 0, diaSemana: 0 }),
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
      if (tieneTeam) return {};
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
      const next = {};
      if (!tieneTeam && teamDisk.length) {
        next.team = teamDisk;
        next.pokedexRegistrados = fusionarPokedexRegistrados(
          state.pokedexRegistrados,
          teamDisk,
        );
      }
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
      money: s.money,
      idEntrenadorPublico: s.idEntrenadorPublico,
      tiempoJuegoSegundos: s.tiempoJuegoSegundos,
      pokedexRegistrados: s.pokedexRegistrados,
    };
    return {
      posX: s.posX,
      posY: s.posY,
      mapaActual: s.mapaActual,
      estadoCliente,
    };
  },

  // Setters narrativos
  setPokegearEntregado: () => set({ pokegearEntregado: true }),
  setStarterElegido: (starter) => set((state) => ({
    starterElegido: true,
    elmCharlaEleccionStarter: true,
    hasStarter: true,
    starter,
    team: [starter],
    pokedexRegistrados: fusionarPokedexRegistrados(state.pokedexRegistrados, [starter]),
  })),
  setPocionEntregada: () => set({ pocionEntregada: true }),
  setElmCharlaEleccionStarter: () => set({ elmCharlaEleccionStarter: true }),
  setPcPocionRetirada: () => set({ pcPocionRetirada: true }),
  setGameStep: (gameStep) => set({ gameStep }),
  /** Solo modo sin sesión servidor; con login usar `PuenteApi.anadirInventarioServidor`. */
  addInventario: (item) => set((state) => ({
    inventario: [...state.inventario, item],
  })),

  setInventarioYMonto: (inventario, money) => set({
    ...(Array.isArray(inventario) ? { inventario: normalizarListaInventario(inventario) } : {}),
    ...(Number.isFinite(money) ? { money } : {}),
  }),

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
      idEntrenadorPublico: generarIdEntrenadorCincoDigitos(),
      tiempoJuegoSegundos: 0,
      pokedexRegistrados: [],
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

  /** Suma tiempo de juego (p. ej. desde Phaser en bloques de segundos). */
  acumularTiempoJuego: (segundos) => {
    const dt = Number(segundos);
    if (!Number.isFinite(dt) || dt <= 0) return;
    set((s) => ({
      tiempoJuegoSegundos: Math.max(0, Math.floor((s.tiempoJuegoSegundos || 0) + dt)),
    }));
  },

  /**
   * Garantiza N.º ID de 5 dígitos (nuevas partidas ya lo tienen; guardados antiguos no).
   * @param {{ nombreJugador?: string, mapaActual?: string, posX?: number, posY?: number }} ctx
   */
  asegurarIdEntrenadorPublico: (ctx) => {
    set((s) => {
      if (s.idEntrenadorPublico && String(s.idEntrenadorPublico).trim() !== '') return {};
      const nombre = ctx?.nombreJugador ?? s.nombreJugador ?? '';
      const mapa = ctx?.mapaActual ?? s.mapaActual ?? '';
      const x = ctx?.posX ?? s.posX ?? 0;
      const y = ctx?.posY ?? s.posY ?? 0;
      const id = idEntrenadorDesdeSemilla(`${nombre}|${mapa}|${x}|${y}`);
      return { idEntrenadorPublico: id };
    });
  },

  /** Registra una especie en la Pokédex (p. ej. al capturar). */
  registrarPokedexId: (pokedexId) => {
    const n = Number(pokedexId);
    if (!Number.isFinite(n) || n <= 0) return;
    set((s) => {
      const prev = fusionarPokedexRegistrados(s.pokedexRegistrados, s.team);
      if (prev.includes(n)) return {};
      return { pokedexRegistrados: [...prev, n].sort((a, b) => a - b) };
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
      idEntrenadorPublico: s.idEntrenadorPublico,
      tiempoJuegoSegundos: s.tiempoJuegoSegundos,
      pokedexRegistrados: s.pokedexRegistrados,
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
      idEntrenadorPublico: normalizarIdEntrenador5(data.idEntrenadorPublico),
      tiempoJuegoSegundos: Number.isFinite(data.tiempoJuegoSegundos) && data.tiempoJuegoSegundos >= 0
        ? Math.floor(data.tiempoJuegoSegundos)
        : 0,
      pokedexRegistrados: Array.isArray(data.pokedexRegistrados)
        ? fusionarPokedexRegistrados(data.pokedexRegistrados, Array.isArray(data.team) ? data.team : [])
        : fusionarPokedexRegistrados([], Array.isArray(data.team) ? data.team : []),
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

