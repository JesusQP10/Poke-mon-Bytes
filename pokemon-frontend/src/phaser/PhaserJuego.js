import Phaser from 'phaser';
import EscenaPreload from './escenas/EscenaPreload';
import EscenaOverworld from './escenas/EscenaOverworld';
import EscenaBatalla from './escenas/EscenaBatalla';
import EscenaMenu from './escenas/EscenaMenu';
import EscenaTransicion from './escenas/EscenaTransicion';

/**
 * Configuración global del juego Phaser.
 * El canvas siempre mide 160×144 px.
 * El escalado pixel-perfect lo gestiona PaginaJuego.jsx con CSS transform.
 *
 * @param {HTMLElement} parent - Elemento DOM donde se monta el canvas.
 * @param {Object} callbacks - React ↔ Phaser.
 *   `onTextoEstatico({ lineas, onCerrar })` — texto estático fuera del canvas.
 *   `onAbrirMenuIngame({ resumePhaser })` — menú in-game en React; al terminar llamar `resumePhaser()`.
 */
export function crearJuegoPhaser(parent, callbacks = {}) {
  const config = {
    type: Phaser.AUTO,
    width: 160,
    height: 144,
    parent,
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: [
      EscenaPreload,
      EscenaOverworld,
      EscenaBatalla,
      EscenaMenu,
      EscenaTransicion,
    ],
    callbacks: {
      // Pasar callbacks de React al registry
      preBoot: (game) => {
        game.registry.set('callbacks', callbacks);
      },
    },
    scale: {
      mode: Phaser.Scale.NONE, // React gestiona el escalado, Phaser NO
    },
    audio: {
      disableWebAudio: false,
    },
  };

  return new Phaser.Game(config);
}
