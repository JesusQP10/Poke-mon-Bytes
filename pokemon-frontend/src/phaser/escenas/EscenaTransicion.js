import Phaser from 'phaser';

/**
 * EscenaTransicion — fade negro entre overworld y batalla (y viceversa).
 *
 * Se lanza con:
 *   this.scene.launch('EscenaTransicion', {
 *     siguiente: 'EscenaBatalla',
 *     datos: { pokemonSalvaje: { id, nombre, nivel } }
 *   });
 */
export default class EscenaTransicion extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaTransicion' });
  }

  init(data) {
    this._siguiente = data.siguiente;
    this._datos = data.datos ?? {};
  }

  create() {
    // Flash blanco rápido (3 frames, estilo Gen II)
    const flash = this.add.rectangle(0, 0, 160, 144, 0xffffff, 1).setOrigin(0).setDepth(200);

    this.tweens.add({
      targets: flash,
      alpha: { from: 1, to: 0 },
      duration: 80,
      repeat: 2,
      yoyo: true,
      onComplete: () => {
        // Fade a negro
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(this._siguiente, this._datos);
        });
      },
    });
  }
}
