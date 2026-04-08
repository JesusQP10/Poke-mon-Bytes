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

    // ── Tilesets (generados de pokegold, tiles de 16×16) ─────────────────
    // Interiores
    this.load.image('players_room',       '/assets/game/overworld/tiles/sheets/interiors/players_room.png');
    this.load.image('players_house',      '/assets/game/overworld/tiles/sheets/interiors/players_house.png');
    this.load.image('house',              '/assets/game/overworld/tiles/sheets/interiors/house.png');
    this.load.image('lab',                '/assets/game/overworld/tiles/sheets/interiors/lab.png');
    this.load.image('pokecenter',         '/assets/game/overworld/tiles/sheets/interiors/pokecenter.png');
    this.load.image('mart',               '/assets/game/overworld/tiles/sheets/interiors/mart.png');
    this.load.image('traditional_house',  '/assets/game/overworld/tiles/sheets/interiors/traditional_house.png');
    this.load.image('gate',               '/assets/game/overworld/tiles/sheets/interiors/gate.png');
    // Exteriores
    this.load.image('johto',              '/assets/game/overworld/tiles/sheets/overworld/johto.png');
    this.load.image('johto_modern',       '/assets/game/overworld/tiles/sheets/overworld/johto_modern.png');
    this.load.image('forest',             '/assets/game/overworld/tiles/sheets/overworld/forest.png');
    this.load.image('cave',               '/assets/game/overworld/tiles/sheets/overworld/cave.png');

    // ── Spritesheet del jugador ───────────────────────────────────────────
    // 12 frames de 16×16 en un sheet 48×48 (fila 0: abajo, 1: izq, 2: der, 3: arriba)
    // Colocar en: public/assets/game/overworld/sprites/player/overworld_player_walk_sheet.png
    this.load.spritesheet(
      'jugador',
      '/assets/game/overworld/sprites/player/overworld_player_walk_sheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // ── Tilemaps (JSON exportados desde Tiled) ────────────────────────────
    // Habitación del jugador
    this.load.tilemapTiledJSON(
      'player-house',
      '/assets/game/overworld/tiles/exports/player_house.json'
    );
    // New Bark Town (exterior)
    this.load.tilemapTiledJSON(
      'new-bark-town',
      '/assets/game/overworld/tiles/exports/new_bark_town.json'
    );
    // Lab del Prof. Elm
    this.load.tilemapTiledJSON(
      'elm-lab',
      '/assets/game/overworld/tiles/exports/elm_lab.json'
    );

    // ── Fondo de batalla ──────────────────────────────────────────────────
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
