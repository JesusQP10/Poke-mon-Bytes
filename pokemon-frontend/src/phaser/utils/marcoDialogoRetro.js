/** Borde exterior estilo menú in-game (Phaser Graphics). */
const COL_BORDE = 0x141820;
const COL_RELLENO = 0xeae8e4;
const COL_SUTILEZA = 0xb8b4b0;

/**
 * Redibuja el marco (misma apariencia que `crearMarcoDialogoRetro`) sobre un Graphics existente.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} w
 * @param {number} h
 */
export function redibujaMarcoDialogoRetro(g, w, h) {
  g.clear();
  g.fillStyle(0x06080c, 0.55);
  g.fillRect(3, 3, w, h);
  g.fillStyle(COL_BORDE, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(COL_RELLENO, 1);
  g.fillRect(2, 2, w - 4, h - 4);
  g.fillStyle(0xd8d6d2, 1);
  g.fillRect(2, Math.floor(h / 2), w - 4, Math.ceil(h / 2) - 2);
  g.fillStyle(0xffffff, 0.1);
  g.fillRect(3, 3, w - 6, Math.max(2, Math.floor((h - 6) * 0.24)));
  g.lineStyle(1, COL_SUTILEZA, 1);
  g.strokeRect(2.5, 2.5, w - 5, h - 5);
  g.lineStyle(1, 0xffffff, 0.42);
  g.beginPath();
  g.moveTo(3, 3);
  g.lineTo(w - 3, 3);
  g.strokePath();
  g.lineStyle(1, 0x000000, 0.12);
  g.beginPath();
  g.moveTo(3, h - 3);
  g.lineTo(w - 3, h - 3);
  g.strokePath();
}

/**
 * Marco doble con relieve suave, alineado con el menú React.
 * @param {Phaser.Scene} scene
 * @param {number} x Origen X (contenedor local).
 * @param {number} y Origen Y.
 * @param {number} w Ancho total.
 * @param {number} h Alto total.
 * @returns {Phaser.GameObjects.Graphics}
 */
export function crearMarcoDialogoRetro(scene, x, y, w, h) {
  const g = scene.add.graphics({ x, y });
  redibujaMarcoDialogoRetro(g, w, h);
  return g;
}

/** Estilo de texto legible en cajas retro (coincide con menú). */
export const estiloTextoDialogoRetro = (wordWrapWidth) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '6px',
  fill: '#1a222c',
  wordWrap: { width: wordWrapWidth },
  lineSpacing: 6,
});

/** Nombre del hablante (línea superior tipo GBC). */
export const estiloNombreHablanteDialogoRetro = () => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '5px',
  fill: '#a01828',
  letterSpacing: 0.5,
});
