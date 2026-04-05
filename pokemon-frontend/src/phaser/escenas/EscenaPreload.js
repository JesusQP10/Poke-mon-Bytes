import Phaser from 'phaser';

// Assets de audio que ya existen (importados como URL via Vite)
import bgmOverworld from '../../assets/game/audio/bgm/an_adventure_begins.mp3';
import bgmBatalla from '../../assets/game/audio/bgm/title_screen_gold_silver.mp3'; // placeholder

/**
 * EscenaPreload — carga todos los assets antes de iniciar el juego.
 *
 * Assets opcionales (el juego funciona en modo placeholder si no existen):
 *   - Spritesheet del jugador
 *   - Tileset de exteriores
 *   - Tilemap de New Bark Town
 *   - Fondo de batalla
 *
 * Assets requeridos (siempre disponibles):
 *   - Audio BGM (en src/assets, importados como URL)
 *   - Tabla de encuentros (en public/)
 */
export default class EscenaPreload extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaPreload' });
  }

  preload() {
    this._mostrarBarraCarga();

    // ── Audio (existen, importados via Vite) ──────────────────────────────
    this.load.audio('bgm-overworld', bgmOverworld);
    this.load.audio('bgm-batalla-salvaje', bgmBatalla);

    // ── Tabla de encuentros (en public/) ──────────────────────────────────
    this.load.json(
      'encuentros-new-bark-town',
      '/assets/game/overworld/tiles/events/encuentros_new_bark_town.json'
    );

    // ── Assets opcionales (cargados desde public/ cuando existan) ─────────
    // El overworld funcionará en modo placeholder hasta que se añadan.

    // Spritesheet del jugador: 12 frames de 16×16 en un sheet 48×48
    // Colocar en: public/assets/game/overworld/sprites/player/overworld_player_walk_sheet.png
    this.load.spritesheet(
      'jugador',
      '/assets/game/overworld/sprites/player/overworld_player_walk_sheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // Tileset exterior de Johto (tiles de 16×16)
    // Colocar en: public/assets/game/overworld/tiles/sheets/overworld/johto_exterior.png
    this.load.image(
      'johto-exterior',
      '/assets/game/overworld/tiles/sheets/overworld/johto_exterior.png'
    );

    // Tileset interiores
    // Colocar en: public/assets/game/overworld/tiles/sheets/interiors/johto_interior.png
    this.load.image(
      'johto-interior',
      '/assets/game/overworld/tiles/sheets/interiors/johto_interior.png'
    );

    // Tilemap de New Bark Town (JSON exportado desde Tiled)
    // Colocar en: public/assets/game/overworld/tiles/exports/new_bark_town.json
    this.load.tilemapTiledJSON(
      'new-bark-town',
      '/assets/game/overworld/tiles/exports/new_bark_town.json'
    );

    // Fondo de batalla (exterior/hierba)
    // Colocar en: public/assets/game/battle/backgrounds/battle_bg_grass.png
    this.load.image(
      'batalla-fondo-hierba',
      '/assets/game/battle/backgrounds/battle_bg_grass.png'
    );

    // Ignorar errores de carga de assets opcionales
    this.load.on('loaderror', (file) => {
      console.warn(`[Preload] Asset no encontrado (se usará placeholder): ${file.key}`);
    });
  }

  create() {
    this.scene.start('EscenaOverworld');
  }

  _mostrarBarraCarga() {
    const cx = 80;
    const cy = 72;

    this.add.rectangle(cx, cy, 160, 144, 0x000000);

    this.add.text(cx, cy - 20, 'CARGANDO...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    this.add.rectangle(cx, cy, 100, 8).setStrokeStyle(1, 0xffffff);
    const barra = this.add.rectangle(cx - 49, cy, 0, 6, 0xffffff).setOrigin(0, 0.5);

    this.load.on('progress', (valor) => {
      barra.width = Math.floor(98 * valor);
    });
  }
}
