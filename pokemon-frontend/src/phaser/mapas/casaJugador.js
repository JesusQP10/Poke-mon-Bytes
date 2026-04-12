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
    try {
      store.guardarPartidaLocal();
    } catch {
      /* caché opcional */
    }
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

  const madrePx = { x: 5 * 16 + 8, y: 3 * 16 + 8 };
  const spriteMadre = scene.add.rectangle(madrePx.x, madrePx.y, 12, 16, 0xff88aa).setDepth(5);

  const lineas = [
    `¡${nombre}!`,
    'Nuestro vecino, el PROF. ELM,\nte estaba buscando.',
    'Dijo que quería pedirte\nun favor.',
    '¡Ah! Casi lo olvido.',
    'Tu POKÉGEAR ha vuelto\ndel taller de reparaciones.',
    '¡Aquí tienes!',
  ];

  scene._secuencias.ejecutar(
    [
      scene._secuencias.pasoTween(spriteMadre, { x: scene._jugador.x, y: scene._jugador.y - 16 }, 800),
      scene._secuencias.pasoDialogo(scene._dialogo, lineas, { hablante: 'MAMÁ' }),
      scene._secuencias.pasoStore(() => usarJuegoStore.getState().setPokegearEntregado()),
    ],
    () => {
      spriteMadre.destroy();
    }
  );
}
