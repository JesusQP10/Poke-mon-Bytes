import { usarJuegoStore } from '../../store/usarJuegoStore';
import { dibujarHabitacionJugador, dibujarInteriorGenerico } from './placeholders';

/** Claves de mapa: habitación + planta baja de la casa del jugador. */
export const MAPAS_CASA_JUGADOR = ['player-room', 'player-house'];

export const TILESET_POR_MAPA = {
  'player-room': 'new_bark_town',
  'player-house': 'new_bark_town',
};

export const CONFIG_MAPAS = {
  'player-room': { esInterior: true, posXInicio: 5, posYInicio: 7, bgm: 'bgm-new-bark-town' },
  'player-house': { esInterior: true, posXInicio: 5, posYInicio: 5, bgm: 'bgm-new-bark-town' },
};

export function esMapaCasaJugador(mapaKey) {
  return MAPAS_CASA_JUGADOR.includes(mapaKey);
}

/**
 * Fondo placeholder para interiores de la casa.
 * @param {Phaser.Scene} scene
 * @param {string} mapaKey
 */
export function dibujarPlaceholderCasa(scene, mapaKey) {
  if (mapaKey === 'player-room') dibujarHabitacionJugador(scene);
  else dibujarInteriorGenerico(scene);
}

/**
 * Tras cargar tilemap: secuencia de la madre / Pokégear en planta baja.
 * @param {Phaser.Scene} scene — EscenaOverworld (usa _dialogo, _secuencias, _jugador)
 * @param {string} mapaKey
 */
export function comprobarNarrativaInicio(scene, mapaKey) {
  if (mapaKey !== 'player-house') return;
  const store = usarJuegoStore.getState();
  const tienePokemon =
    store.starterElegido || (Array.isArray(store.team) && store.team.length > 0);
  if (tienePokemon && !store.pokegearEntregado) {
    store.setPokegearEntregado();
    return;
  }
  if (!store.pokegearEntregado) {
    ejecutarSecuenciaMadre(scene);
  }
}

/**
 * @param {Phaser.Scene} scene
 */
export function ejecutarSecuenciaMadre(scene) {
  const store = usarJuegoStore.getState();
  const nombre = store.nombreJugador || 'Tú';

  const lineas = [
    `¡${nombre}!`,
    'Nuestro vecino, el PROF. ELM,\nte estaba buscando.',
    'Dijo que quería pedirte\nun favor.',
  ];

  scene._secuencias.ejecutar(
    [
      scene._secuencias.pasoDialogo(scene._dialogo, lineas, { hablante: 'MAMÁ' }),
      scene._secuencias.pasoStore(() => usarJuegoStore.getState().setPokegearEntregado()),
    ],
    () => {}
  );
}
