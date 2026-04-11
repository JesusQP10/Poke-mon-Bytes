import { usarJuegoStore } from '../../store/usarJuegoStore';
import { dibujarInteriorGenerico } from './placeholders';
import { TAM_TILE } from './constantes';

export const MAPAS_LAB_ELM = ['elm-lab', 'elm_lab'];

export const TILESET_POR_MAPA = {
  'elm-lab': 'new_bark_town',
};

export const CONFIG_MAPAS = {
  'elm-lab': { esInterior: true, posXInicio: 6, posYInicio: 11, bgm: 'bgm-elm-lab' },
  'elm_lab': { esInterior: true, posXInicio: 6, posYInicio: 11, bgm: 'bgm-elm-lab' },
};

export function esMapaLaboratorioElm(mapaKey) {
  return MAPAS_LAB_ELM.includes(mapaKey);
}

/**
 * Placeholder si no hay JSON del lab.
 * @param {Phaser.Scene} scene
 */
export function dibujarPlaceholderLab(scene) {
  dibujarInteriorGenerico(scene);
}

/**
 * Si aplica, encadena la escena del ayudante antes de ejecutar el warp.
 * @returns {boolean} true si se interceptó el warp .
 */
export function intentarWarpConSecuenciaAyudante(store, scene, ejecutarWarp) {
  if (store.mapaActual === 'elm-lab' && store.starterElegido && !store.pocionEntregada) {
    ejecutarSecuenciaAyudante(scene, ejecutarWarp);
    return true;
  }
  return false;
}

/**
 * @param {Phaser.Scene} scene
 * @param {() => void} onFin
 */
export function ejecutarSecuenciaAyudante(scene, onFin) {
  const lineas = [
    '¡Espera! El Prof. Elm me\npidió que te diera esto.',
    '¡Has recibido una POCIÓN!',
  ];

  scene._secuencias.ejecutar(
    [
      scene._secuencias.pasoDialogo(scene._dialogo, lineas, { hablante: 'AYUDANTE' }),
      scene._secuencias.pasoStore(() => {
        const st = usarJuegoStore.getState();
        st.setPocionEntregada();
        st.addInventario({ id: 'pocion', nombre: 'Poción', cantidad: 1 });
      }),
    ],
    onFin
  );
}

/**
 * @param {Phaser.Scene} scene
 */
export function ejecutarSecuenciaElm(scene) {
  const store = usarJuegoStore.getState();
  const nombre = store.nombreJugador || 'Tú';

  const elmX = 6 * TAM_TILE + TAM_TILE / 2;
  const elmY = 3 * TAM_TILE + TAM_TILE;
  const targetX = elmX;
  const targetY = elmY + TAM_TILE * 2;

  const lineasElm = [
    `¡${nombre}! Justo a tiempo.`,
    'Estoy investigando los Pokémon\nde la región Johto.',
    '¿Me harías un favor?\nNecesito que lleves uno\nde mis Pokémon.',
    'Están en la mesa. Elige el que más te guste.',
  ];

  scene._secuencias.ejecutar(
    [
      scene._secuencias.pasoTween(scene._jugador, { x: targetX, y: targetY }, 800),
      scene._secuencias.pasoDialogo(scene._dialogo, lineasElm, { hablante: 'PROF. ELM' }),
    ],
    () => {
      usarJuegoStore.getState().setElmCharlaEleccionStarter();
      try {
        usarJuegoStore.getState().guardarPartidaLocal();
      } catch {
        /* caché opcional */
      }
    },
  );
}

/**
 * Zona `tipo: trigger_elm` en la capa eventos del tilemap.
 * @param {Phaser.Scene} scene
 * @param {Phaser.Types.Tilemaps.ObjectConfig} obj
 * @param {import('../sistemas/WarpSystem').default} warpSystem
 */
export function crearZonaTriggerElm(scene, obj, warpSystem) {
  const width = obj.width ?? TAM_TILE;
  const height = obj.height ?? TAM_TILE;
  const centroX = obj.x + width / 2;
  const centroY = obj.y + height / 2;

  const zona = scene.add.zone(centroX, centroY, width, height);
  scene.physics.add.existing(zona, true);

  const estado = {
    estabaEnZona: scene.physics.overlap(scene._jugador, zona),
    yaActivado: false,
  };

  scene.physics.add.overlap(scene._jugador, zona, () => {
    if (estado.estabaEnZona || estado.yaActivado || scene._introActiva || scene._secuencias?.activo || scene._cambiandoMapa) return;

    const store = usarJuegoStore.getState();
    if (store.starterElegido || store.elmCharlaEleccionStarter) return;

    estado.yaActivado = true;
    ejecutarSecuenciaElm(scene);
  });

  warpSystem.agregarZonaParaWorldstep(zona, estado);
}
