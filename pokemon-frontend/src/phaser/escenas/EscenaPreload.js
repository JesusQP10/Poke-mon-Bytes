import Phaser from 'phaser';

// Assets de audio 
import bgmOverworld from '../../assets/game/audio/bgm/an_adventure_begins.mp3';
import bgmBatallaSalvaje from '../../assets/game/audio/bgm/battle_salvaje.mp3';
import bgmBatallaEntrenador from '../../assets/game/audio/bgm/battle_trainer.mp3';
import sfxObtainedPokemon from '../../assets/game/audio/sfx/obtained_pokemon.mp3';
import sfxLevelUp from '../../assets/game/audio/sfx/level_up.mp3';
import fondoBatallaHierba from '../../assets/battle/batalla-fondo-hierba.jpg';

/**
 * EscenaPreload — carga todos los assets antes de iniciar el juego.
 *
 * Assets opcionales (el juego funciona en modo placeholder si no existen):
 * - Spritesheet del jugador
 * - Tileset de exteriores
 * - Tilemap de New Bark Town
 * - Fondo de batalla
 *
 * Assets requeridos (siempre disponibles):
 * - Audio BGM (en src/assets, importados como URL)
 * - Tabla de encuentros (en public/)
 */
export default class EscenaPreload extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaPreload' });
  }

  preload() {
    this._mostrarBarraCarga();

    // ── Audio ────────────────────────────────────────────────────────────
    this.load.audio('bgm-overworld', bgmOverworld);
    this.load.audio('bgm-batalla-salvaje', bgmBatallaSalvaje);
    this.load.audio('bgm-batalla-entrenador', bgmBatallaEntrenador);
    this.load.audio('sfx-obtained-pokemon', sfxObtainedPokemon);
    this.load.audio('sfx-level-up', sfxLevelUp);
    this.load.audio('bgm-new-bark-town', '/assets/game/audio/new_bark_town.mp3');
    this.load.audio('bgm-elm-lab', '/assets/game/audio/elm_lab.mp3');
    this.load.audio('sfx-obtener-starter', '/assets/game/audio/obtener_starter.mp3');

    // ── Tilesets (solo los que existen) ──────────────────────────────────
    this.load.image('new_bark_town', '/assets/game/overworld/tiles/sheets/new_bark_town.png');
    this.load.image('debugger_room', '/assets/game/overworld/tiles/sheets/debugger_room.png');

    // Spritesheet del jugador (32x32 respetando el padding de tus assets)
    this.load.spritesheet('jugador', '/assets/game/overworld/sprites/player/overworld_player_walk_sheet.png', { frameWidth: 32, frameHeight: 32 });

    // Items
    this.load.image('pokeball', '/assets/game/overworld/sprites/items/poke-ball.png');

    // NPCs
    this.load.spritesheet('aldeano', '/assets/game/overworld/sprites/npcs/aldeano.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('cientifico', '/assets/game/overworld/sprites/npcs/cientifico.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('elm', '/assets/game/overworld/sprites/npcs/elm.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('madre', '/assets/game/overworld/sprites/npcs/madre.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('nino', '/assets/game/overworld/sprites/npcs/nino.png', { frameWidth: 32, frameHeight: 32 });

    // NPCs sala debugger (sprites 16×16, un frame por hoja)
    const npc16 = { frameWidth: 16, frameHeight: 16 };
    this.load.spritesheet('npc_chap', '/assets/game/overworld/sprites/npcs/npc_chap.png', npc16);
    this.load.spritesheet('npc_clerk', '/assets/game/overworld/sprites/npcs/npc_clerk.png', npc16);
    this.load.spritesheet('npc_courtney', '/assets/game/overworld/sprites/npcs/npc_courtney.png', npc16);
    this.load.spritesheet('npc_ishihara', '/assets/game/overworld/sprites/npcs/npc_ishihara.png', npc16);
    this.load.spritesheet('npc_mint', '/assets/game/overworld/sprites/npcs/npc_mint.png', npc16);
    this.load.spritesheet('npc_imakuni', '/assets/game/overworld/sprites/npcs/npc_imakuni.png', npc16);
    this.load.spritesheet('npc_jes', '/assets/game/overworld/sprites/npcs/npc_jes.png', npc16);
    this.load.spritesheet('npc_jack', '/assets/game/overworld/sprites/npcs/npc_jack.png', npc16);
    this.load.spritesheet('npc_jonathan', '/assets/game/overworld/sprites/npcs/npc_jonathan.png', npc16);
    this.load.spritesheet('npc_kristin', '/assets/game/overworld/sprites/npcs/npc_kristin.png', npc16);
    this.load.spritesheet('npc_pawn', '/assets/game/overworld/sprites/npcs/npc_pawn.png', npc16);
    this.load.spritesheet('npc_rick', '/assets/game/overworld/sprites/npcs/npc_rick.png', npc16);
    this.load.spritesheet('npc_yosuke', '/assets/game/overworld/sprites/npcs/npc_yosuke.png', npc16);

    // ── Tilemaps (JSON exportados desde Tiled) ──────────────────────────
    this.load.tilemapTiledJSON('player-room', '/assets/game/overworld/tiles/exports/player_room.json');
    this.load.tilemapTiledJSON('player-house', '/assets/game/overworld/tiles/exports/player_house.json');
    this.load.tilemapTiledJSON('new-bark-town', '/assets/game/overworld/tiles/exports/new_bark_town.json');
    this.load.tilemapTiledJSON('elm-lab', '/assets/game/overworld/tiles/exports/elm_lab.json');
    this.load.tilemapTiledJSON('debugger-room', '/assets/game/overworld/tiles/exports/debugger_room.json');

    // ── Tabla de encuentros (clave = `encuentros-${mapaKey}` en EscenaOverworld) ──
    this.load.json('encuentros-new-bark-town', '/assets/game/overworld/tiles/events/encuentros_new_bark_town.json');

    // ── Batalla ──────────────────────────────────────────────────────────
    this.load.image('batalla-fondo-hierba', fondoBatallaHierba);

    this.load.on('loaderror', (file) => {
      console.error(`[Preload] ❌ Error cargando asset: ${file.key} - ${file.src}`);
    });
  }
  
  create() {
    if (!this.textures.exists('jugador')) {
      console.warn('[Preload] Spritesheet jugador no encontrado; usando placeholder 32×32.');
      this._generarSpritesheetJugador();
    }

    this.cameras.main.fadeOut(500, 0, 0, 0); 
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('EscenaOverworld');
    });
  }

  /**
   * Crea celdas de 32x32 (96x128 total) pero dibuja el arte de 16x16 
   * centrado en la parte inferior de la celda. Así funciona como drop-in 
   * replacement perfecto si falla el asset original.
   */
  _generarSpritesheetJugador() {
    const FW = 32, FH = 32; 
    const COLS = 3, ROWS = 4;
    const W = FW * COLS; // 96
    const H = FH * ROWS; // 128

    const rt = this.add.renderTexture(0, 0, W, H).setVisible(false);
    const g = this.add.graphics().setVisible(false);

    // Paleta
    const SKIN  = 0xf8c880;
    const HAIR  = 0x402000;
    const SHIRT = 0xe04040; // rojo
    const PANTS = 0x2040c0; // azul
    const SHOES = 0x301808;

    // Dibuja un frame del personaje 
    const dibujarFrame = (fx, fy, dir, paso) => {
      g.clear();

      // CALCULAMOS EL OFFSET PARA EL PADDING:
      // El sprite visual es de 16x16, pero el frame es de 32x32.
      // Centramos horizontalmente (+8px) y alineado abajo (+16px).
      const offsetX = fx + 8;
      const offsetY = fy + 16;

      // Piernas (animación de paso)
      const pierna1X = offsetX + (paso === 1 ? 4 : 5);
      const pierna2X = offsetX + (paso === 1 ? 9 : 8);
      g.fillStyle(PANTS);
      g.fillRect(pierna1X, offsetY + 10, 3, 4);
      g.fillRect(pierna2X, offsetY + 10, 3, 4);
      
      // Zapatos
      g.fillStyle(SHOES);
      g.fillRect(pierna1X, offsetY + 14, 3, 2);
      g.fillRect(pierna2X, offsetY + 14, 3, 2);

      // Cuerpo (camisa)
      g.fillStyle(SHIRT);
      g.fillRect(offsetX + 4, offsetY + 6, 8, 5);

      // Cabeza
      g.fillStyle(SKIN);
      g.fillRect(offsetX + 5, offsetY + 2, 6, 5);

      // Pelo
      g.fillStyle(HAIR);
      g.fillRect(offsetX + 5, offsetY + 1, 6, 2);
      g.fillRect(offsetX + 4, offsetY + 2, 1, 2);
      g.fillRect(offsetX + 11, offsetY + 2, 1, 2);

      // Ojos según dirección
      if (dir === 'abajo') {
        g.fillStyle(0x000000);
        g.fillRect(offsetX + 6, offsetY + 5, 1, 1);
        g.fillRect(offsetX + 9, offsetY + 5, 1, 1);
      } else if (dir === 'arriba') {
        g.fillStyle(HAIR);
        g.fillRect(offsetX + 5, offsetY + 2, 6, 4);
      } else if (dir === 'izquierda') {
        g.fillStyle(0x000000);
        g.fillRect(offsetX + 6, offsetY + 5, 1, 1);
      } else if (dir === 'derecha') {
        g.fillStyle(0x000000);
        g.fillRect(offsetX + 9, offsetY + 5, 1, 1);
      }

      // Brazos
      g.fillStyle(SKIN);
      g.fillRect(offsetX + 3, offsetY + 6, 2, 4);
      g.fillRect(offsetX + 11, offsetY + 6, 2, 4);

      rt.draw(g, 0, 0);
    };

    const dirs = ['abajo', 'arriba', 'izquierda', 'derecha'];
    const pasos = [0, 1, 0]; // idle, paso, idle

    dirs.forEach((dir, fila) => {
      pasos.forEach((paso, col) => {
        dibujarFrame(col * FW, fila * FH, dir, paso);
      });
    });

    rt.saveTexture('jugador');
    g.destroy();
    rt.destroy();

    this.textures.get('jugador').add('__BASE', 0, 0, 0, W, H);

    const tex = this.textures.get('jugador');
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const frameIdx = row * COLS + col;
        tex.add(frameIdx, 0, col * FW, row * FH, FW, FH);
      }
    }

  }

  _mostrarBarraCarga() {
    const cx = 80;
    const cy = 72;

    const fondoCarga = this.add.rectangle(cx, cy, 160, 144, 0x000000);

    const textoTitulo = this.add.text(cx, cy - 20, 'CARGANDO...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    
    const textoArchivo = this.add.text(cx, cy + 15, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '4px',
      fill: '#aaaaaa',
    }).setOrigin(0.5);

    const contornoBarra = this.add.rectangle(cx, cy, 100, 8).setStrokeStyle(1, 0xffffff);
    const barra = this.add.rectangle(cx - 49, cy, 0, 6, 0xffffff).setOrigin(0, 0.5);

    this.load.on('progress', (valor) => {
      barra.width = Math.floor(98 * valor);
    });

    this.load.on('fileprogress', (file) => {
      textoArchivo.setText(`Descargando: ${file.key}`);
    });

    // Evitamos fugas de memoria limpiando la pantalla de carga al terminar
    this.load.on('complete', () => {
      fondoCarga.destroy();
      textoTitulo.destroy();
      textoArchivo.destroy();
      contornoBarra.destroy();
      barra.destroy();
    });
  }
}