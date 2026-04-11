/** Borde exterior estilo menú in-game (Phaser Graphics). */
const COL_BORDE = 0x141820;
const COL_RELLENO = 0xeae8e4;
const COL_SUTILEZA = 0xb8b4b0;

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
  g.fillStyle(COL_BORDE, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(COL_RELLENO, 1);
  g.fillRect(2, 2, w - 4, h - 4);
  g.lineStyle(1, COL_SUTILEZA, 1);
  g.strokeRect(2.5, 2.5, w - 5, h - 5);
  g.lineStyle(1, 0xffffff, 0.4);
  g.beginPath();
  g.moveTo(3, 3);
  g.lineTo(w - 3, 3);
  g.strokePath();
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
