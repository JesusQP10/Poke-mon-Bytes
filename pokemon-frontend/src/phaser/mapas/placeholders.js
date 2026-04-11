import { TAM_TILE } from './constantes';

/**
 * Fondo placeholder cuando no hay tilemap (interior genérico).
 * @param {Phaser.Scene} scene
 */
export function dibujarInteriorGenerico(scene) {
  scene.add.rectangle(80, 72, 160, 144, 0xc8a050).setOrigin(0.5);
  scene.add.rectangle(80, 8, 160, 16, 0x806838).setOrigin(0.5);
  scene.add.rectangle(4, 72, 8, 144, 0x806838).setOrigin(0.5);
  scene.add.rectangle(156, 72, 8, 144, 0x806838).setOrigin(0.5);
  scene.add.text(80, 72, 'INTERIOR', { fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#80500a' }).setOrigin(0.5).setAlpha(0.4);
}

/**
 * Placeholder de la habitación del jugador.
 * @param {Phaser.Scene} scene
 */
export function dibujarHabitacionJugador(scene) {
  scene.add.rectangle(80, 72, 160, 144, 0xc8a050).setOrigin(0.5);
  scene.add.rectangle(80, 8, 160, 16, 0x806838).setOrigin(0.5);
  scene.add.rectangle(4, 72, 8, 144, 0x806838).setOrigin(0.5);
  scene.add.rectangle(156, 72, 8, 144, 0x806838).setOrigin(0.5);
  scene.add.rectangle(136, 28, 24, 28, 0xe04040).setOrigin(0.5);
  scene.add.rectangle(136, 16, 24, 8, 0xffffff).setOrigin(0.5);
  scene.add.rectangle(28, 24, 20, 20, 0x8888cc).setOrigin(0.5);
  scene.add.rectangle(28, 36, 14, 6, 0x555588).setOrigin(0.5);
  scene.add.rectangle(80, 18, 28, 14, 0x333333).setOrigin(0.5);
  scene.add.rectangle(80, 136, 20, 12, 0x885520).setOrigin(0.5);
  scene.add.text(80, 136, '▼', { fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#fff' }).setOrigin(0.5);
  scene.add.text(80, 72, 'HABITACIÓN', { fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#80500a' }).setOrigin(0.5).setAlpha(0.4);
}

/**
 * Exterior placeholder (rutas / pueblo sin JSON).
 * @param {Phaser.Scene} scene
 * @param {string} mapaKey
 */
export function dibujarExteriorPlaceholder(scene, mapaKey) {
  scene.add.rectangle(80, 72, 160, 144, 0x78c850).setOrigin(0.5);
  const graficos = scene.add.graphics();
  graficos.lineStyle(0.5, 0x5aaa3a, 0.4);
  for (let x = 0; x <= 160; x += TAM_TILE) graficos.lineBetween(x, 0, x, 144);
  for (let y = 0; y <= 144; y += TAM_TILE) graficos.lineBetween(0, y, 160, y);
  const nombre = mapaKey.replace(/-/g, ' ').toUpperCase();
  scene.add.text(80, 40, nombre, { fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#1a6010', align: 'center' }).setOrigin(0.5);
}
