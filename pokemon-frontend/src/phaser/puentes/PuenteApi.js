import api from '../../services/api';
import { usarAutenticacionStore } from '../../store/usarAutenticacionStore';
import { usarJuegoStore } from '../../store/usarJuegoStore';

/**
 * PuenteApi — llamadas al backend Spring Boot desde las escenas Phaser.
 * Usa la instancia de Axios del interceptor JWT configurado.
 */
const PuenteApi = {
  // ── Juego ──────────────────────────────────────────────────────────────

  async getEstadoJugador() {
    const res = await api.get('/api/v1/juego/estado');
    return res.data;
  },

  async getEquipo() {
    const res = await api.get('/api/v1/juego/equipo');
    return res.data;
  },

  /**
   * Guarda partida en servidor (posición, mapa + JSON `estadoCliente`).
   * Dinero e inventario viven en tablas servidor; no se sobrescribe desde el cliente.
   *
   * @param {object} payload
   * @param {{ actualizarCacheLocal?: boolean, skipSincronizarTrasGuardar?: boolean }} [opts]
   *   `actualizarCacheLocal`: solo con GUARDAR menú y sincronizar de nuevo el disco.
   *   `skipSincronizarTrasGuardar`: no hace GET /estado tras POST (p. ej. tras «Continuar» ya hidratado).
   */
  async guardarJuegoEnServidor(payload, opts = {}) {
    const actualizarCacheLocal = opts.actualizarCacheLocal === true;
    const skipSync = opts.skipSincronizarTrasGuardar === true;
    const res = await api.post('/api/v1/juego/guardar', payload);
    if (payload?.posX != null && payload?.mapaActual != null) {
      usarJuegoStore.getState().setPosition(payload.posX, payload.posY, payload.mapaActual);
    }
    if (usarAutenticacionStore.getState().token && !skipSync) {
      try {
        await this.sincronizarEstadoDesdeServidor();
      } catch (e) {
        console.warn('[guardar] sincronizar tras guardar', e);
      }
      if (actualizarCacheLocal) {
        try {
          usarJuegoStore.getState().guardarPartidaLocal({ desdeGuardadoMenu: true });
        } catch (e) {
          console.warn('[guardar] caché local tras sincronizar', e);
        }
      }
    }
    return res.data;
  },

  /**
   * Alinea PS en BD con el último `teamCliente` guardado en servidor (blob).
   * Solo debe llamarse al **cargar partida** (p. ej. Continuar en el título), no en cada sync:
   * si se hace tras un combate sin guardar, revertiría los PS persistidos en BD por los turnos.
   */
  async restaurarHpCheckpointDesdeBlob() {
    if (!usarAutenticacionStore.getState().token) return;
    await api.post("/api/v1/juego/restaurar-hp-checkpoint");
  },

  /**
   * GET /estado y aplica al store.
   * @param {{ preservarEstadoJugableLocal?: boolean }} [opts] Tras cargar un guardado de menú desde disco.
   */
  async sincronizarEstadoDesdeServidor(opts = {}) {
    const data = await this.getEstadoJugador();
    usarJuegoStore.getState().setPlayerState(data, opts);
    return data;
  },

  /** POST /juego/reiniciar — nueva partida en servidor (equipo, inventario, JSON, posición). */
  async reiniciarPartidaEnServidor() {
    const res = await api.post('/api/v1/juego/reiniciar');
    const data = res.data;
    usarJuegoStore.getState().setPlayerState(data);
    return data;
  },

  /** Centro Pokémon: PS máx. y sin estado en el equipo activo. Alinea `teamCliente` para no pisar la curación. */
  async curarEquipoCentro() {
    await api.post('/api/v1/juego/centro/curar');
    const data = await this.getEstadoJugador();
    if (data?.estadoCliente && typeof data.estadoCliente === 'object' && Array.isArray(data.team)) {
      data.estadoCliente = { ...data.estadoCliente, teamCliente: data.team };
    }
    usarJuegoStore.getState().setPlayerState(data);
    return data;
  },

  // ── Batalla ────────────────────────────────────────────────────────────

  async getMovimientos(pokemonUsuarioId) {
    const res = await api.get(`/api/v1/batalla/movimientos/${pokemonUsuarioId}`);
    return res.data;
  },

  async ejecutarTurno(solicitud) {
    const res = await api.post('/api/v1/batalla/turno', solicitud);
    return res.data;
  },

  /** Huir de combate salvaje (probabilidad en servidor; requiere JWT). */
  async intentarHuir({ jugadorPokemonId, salvajePokemonId, intento = 1 }) {
    const res = await api.post('/api/v1/batalla/huir', {
      jugadorPokemonId,
      salvajePokemonId,
      intento,
    });
    return res.data;
  },

  async intentarCaptura(defensorId, nombreBall) {
    const res = await api.post('/api/v1/batalla/captura', { defensorId, nombreBall });
    return res.data;
  },

  /** Crea instancia salvaje en BD. Liberar al salir del combate si no hubo captura. */
  async prepararSalvajePokemon({
    pokedexId,
    nivel,
    ataquesMoveset,
    ataqueDemostracionId,
    ataqueDemostracionNombre,
  } = {}) {
    const body = {};
    if (pokedexId != null) body.pokedexId = pokedexId;
    if (nivel != null) body.nivel = nivel;
    if (Array.isArray(ataquesMoveset) && ataquesMoveset.length) body.ataquesMoveset = ataquesMoveset;
    if (ataqueDemostracionId != null) body.ataqueDemostracionId = ataqueDemostracionId;
    if (ataqueDemostracionNombre) body.ataqueDemostracionNombre = ataqueDemostracionNombre;
    const res = await api.post('/api/v1/batalla/salvaje/preparar', body);
    return res.data;
  },

  async liberarSalvajePokemon(pokemonUsuarioId) {
    await api.post('/api/v1/batalla/salvaje/liberar', { pokemonUsuarioId });
  },

  /** POST /juego/starter — persiste el inicial en BD (requiere JWT). */
  async elegirStarterServidor(starterId) {
    const res = await api.post('/api/v1/juego/starter', { starterId });
    return res.data;
  },

  // ── Tienda ─────────────────────────────────────────────────────────────

  /** GET /tienda/catalogo — ítems de la BD (requiere JWT). */
  async getCatalogoTienda() {
    const res = await api.get('/api/v1/tienda/catalogo');
    return res.data;
  },

  async comprarItem(itemId, cantidad) {
    const res = await api.post('/api/v1/tienda/comprar', { itemId, cantidad });
    const { inventario, money } = res.data ?? {};
    if (Array.isArray(inventario) || Number.isFinite(money)) {
      usarJuegoStore.getState().setInventarioYMonto(
        Array.isArray(inventario) ? inventario : undefined,
        Number.isFinite(money) ? money : undefined,
      );
    }
    return res.data;
  },

  /** POST /juego/inventario/anadir — requiere JWT. `itemId` o `nombreItem` (p. ej. "Potion"). */
  async anadirInventarioServidor({ itemId, nombreItem, cantidad = 1 } = {}) {
    const body = { cantidad };
    if (itemId != null) body.itemId = itemId;
    if (nombreItem) body.nombreItem = nombreItem;
    const res = await api.post('/api/v1/juego/inventario/anadir', body);
    const inv = res.data?.inventario;
    if (Array.isArray(inv)) {
      usarJuegoStore.getState().setInventarioYMonto(inv, undefined);
    }
    return res.data;
  },

  /** POST /juego/inventario/tirar — descarta unidades de la mochila. */
  async tirarInventario({ itemId, nombreItem, cantidad = 1 } = {}) {
    const body = { cantidad };
    if (itemId != null) body.itemId = itemId;
    if (nombreItem) body.nombreItem = nombreItem;
    const res = await api.post('/api/v1/juego/inventario/tirar', body);
    const inv = res.data?.inventario;
    if (Array.isArray(inv)) {
      usarJuegoStore.getState().setInventarioYMonto(inv, undefined);
    }
    return res.data;
  },

  /** POST /juego/inventario/usar — usa un ítem sobre un Pokémon del equipo fuera de combate. */
  async usarItemInventario({ itemId, nombreItem, pokemonObjetivoId } = {}) {
    const body = {};
    if (itemId != null) body.itemId = itemId;
    if (nombreItem) body.nombreItem = nombreItem;
    if (pokemonObjetivoId != null) body.pokemonObjetivoId = pokemonObjetivoId;
    const res = await api.post('/api/v1/juego/inventario/usar', body);
    const { inventario, team } = res.data ?? {};
    const store = usarJuegoStore.getState();
    if (Array.isArray(inventario)) store.setInventarioYMonto(inventario, undefined);
    if (Array.isArray(team)) store.patchEquipoLocal(team);
    return res.data;
  },
};

export default PuenteApi;
