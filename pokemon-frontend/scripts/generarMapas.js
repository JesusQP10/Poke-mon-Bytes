// scripts/generarMapas.js
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import GeneradorTilemap from '../src/phaser/utils/GeneradorTilemap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '../public/assets/game/overworld/tiles/exports');

mkdirSync(outputDir, { recursive: true });

const mapas = [
  ['player_room.json',   GeneradorTilemap.generarPlayerRoom()],
  ['player_house.json',  GeneradorTilemap.generarPlayerHouse()],
  ['new_bark_town.json', GeneradorTilemap.generarNewBarkTown()],
  ['elm_lab.json',       GeneradorTilemap.generarElmLab()],
  ['ruta_29.json',       GeneradorTilemap.generarRuta29()],
];

for (const [nombre, datos] of mapas) {
  const ruta = join(outputDir, nombre);
  writeFileSync(ruta, JSON.stringify(datos, null, 2), 'utf-8');
  console.log(`✓ Generado: ${nombre}`);
}
