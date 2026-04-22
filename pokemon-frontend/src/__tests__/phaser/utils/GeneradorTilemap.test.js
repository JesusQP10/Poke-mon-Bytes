import { describe, it, expect } from 'vitest';
import GeneradorTilemap from '../../../phaser/utils/GeneradorTilemap.js';

// ── Helpers de validación ────────────────────────────────────────────────────

function capasTiles(mapa) {
  return mapa.layers.filter((l) => l.type === 'tilelayer');
}

function capasObjetos(mapa) {
  return mapa.layers.filter((l) => l.type === 'objectgroup');
}

function warpsDeEventos(mapa) {
  const eventos = mapa.layers.find((l) => l.name === 'eventos');
  return eventos?.objects ?? [];
}

function npcsDeMapa(mapa) {
  const capa = mapa.layers.find((l) => l.name === 'npcs');
  return capa?.objects ?? [];
}

// ── Estructura común ─────────────────────────────────────────────────────────

function testEstructuraBase(mapa, ancho, alto, numCapasTiles, numCapasObjetos) {
  it('tiene dimensiones correctas', () => {
    expect(mapa.width).toBe(ancho);
    expect(mapa.height).toBe(alto);
  });

  it('tilewidth y tileheight son 16', () => {
    expect(mapa.tilewidth).toBe(16);
    expect(mapa.tileheight).toBe(16);
  });

  it('contiene capas de tiles esperadas', () => {
    expect(capasTiles(mapa)).toHaveLength(numCapasTiles);
  });

  it('contiene capas de objetos esperadas', () => {
    expect(capasObjetos(mapa)).toHaveLength(numCapasObjetos);
  });

  it('cada capa de tiles tiene el número correcto de datos', () => {
    capasTiles(mapa).forEach((c) => {
      expect(c.data).toHaveLength(ancho * alto);
    });
  });

  it('tiene clave type = map', () => expect(mapa.type).toBe('map'));
  it('version es string', () => expect(typeof mapa.version).toBe('string'));
}

// ── generarPlayerRoom ────────────────────────────────────────────────────────

describe('GeneradorTilemap.generarPlayerRoom', () => {
  const mapa = GeneradorTilemap.generarPlayerRoom();

  testEstructuraBase(mapa, 10, 9, 4, 2);

  it('tiene capa suelo', () => {
    expect(capasTiles(mapa).some((c) => c.name === 'suelo')).toBe(true);
  });

  it('tiene capa colisiones', () => {
    expect(capasTiles(mapa).some((c) => c.name === 'colisiones')).toBe(true);
  });

  it('tiene capa npcs y capa eventos', () => {
    const nombres = capasObjetos(mapa).map((c) => c.name);
    expect(nombres).toContain('npcs');
    expect(nombres).toContain('eventos');
  });

  it('el warp de salida apunta a player-house', () => {
    const warps = warpsDeEventos(mapa);
    const destinos = warps.flatMap((w) =>
      (w.properties ?? []).filter((p) => p.name === 'destino').map((p) => p.value)
    );
    expect(destinos).toContain('player-house');
  });
});

// ── generarPlayerHouse ───────────────────────────────────────────────────────

describe('GeneradorTilemap.generarPlayerHouse', () => {
  const mapa = GeneradorTilemap.generarPlayerHouse();

  testEstructuraBase(mapa, 10, 9, 4, 2);

  it('el NPC es la mamá', () => {
    const npcs = npcsDeMapa(mapa);
    expect(npcs.some((n) => n.name === 'mama')).toBe(true);
  });

  it('tiene warp a player-room y a new-bark-town', () => {
    const warps = warpsDeEventos(mapa);
    const destinos = warps.flatMap((w) =>
      (w.properties ?? []).filter((p) => p.name === 'destino').map((p) => p.value)
    );
    expect(destinos).toContain('player-room');
    expect(destinos).toContain('new-bark-town');
  });
});

// ── generarNewBarkTown ───────────────────────────────────────────────────────

describe('GeneradorTilemap.generarNewBarkTown', () => {
  const mapa = GeneradorTilemap.generarNewBarkTown();

  testEstructuraBase(mapa, 20, 18, 5, 2);

  it('tiene capa hierba_alta', () => {
    expect(capasTiles(mapa).some((c) => c.name === 'hierba_alta')).toBe(true);
  });

  it('no tiene warp a ruta-29 (eliminado)', () => {
    const warps = warpsDeEventos(mapa);
    const destinos = warps.flatMap((w) =>
      (w.properties ?? []).filter((p) => p.name === 'destino').map((p) => p.value)
    );
    expect(destinos).not.toContain('ruta-29');
  });

  it('tiene warp a elm-lab', () => {
    const warps = warpsDeEventos(mapa);
    const destinos = warps.flatMap((w) =>
      (w.properties ?? []).filter((p) => p.name === 'destino').map((p) => p.value)
    );
    expect(destinos).toContain('elm-lab');
  });

  it('tiene warp a player-house', () => {
    const warps = warpsDeEventos(mapa);
    const destinos = warps.flatMap((w) =>
      (w.properties ?? []).filter((p) => p.name === 'destino').map((p) => p.value)
    );
    expect(destinos).toContain('player-house');
  });

  it('utiliza 3 tilesets (johto, johto_modern, house)', () => {
    expect(mapa.tilesets).toHaveLength(3);
  });
});

// ── generarElmLab ────────────────────────────────────────────────────────────

describe('GeneradorTilemap.generarElmLab', () => {
  const mapa = GeneradorTilemap.generarElmLab();

  testEstructuraBase(mapa, 10, 10, 4, 2);

  it('el NPC es Elm', () => {
    const npcs = npcsDeMapa(mapa);
    expect(npcs.some((n) => n.name === 'elm')).toBe(true);
  });

  it('el warp de salida apunta a new-bark-town', () => {
    const warps = warpsDeEventos(mapa);
    const destinos = warps.flatMap((w) =>
      (w.properties ?? []).filter((p) => p.name === 'destino').map((p) => p.value)
    );
    expect(destinos).toContain('new-bark-town');
  });
});

// ── helpers internos ─────────────────────────────────────────────────────────

describe('GeneradorTilemap helpers internos', () => {
  it('_datosVacios devuelve array de ceros con tamaño ancho×alto', () => {
    const datos = GeneradorTilemap._datosVacios(5, 3);
    expect(datos).toHaveLength(15);
    expect(datos.every((v) => v === 0)).toBe(true);
  });

  it('_rellenarBorde pone valor en toda la frontera y deja el interior a 0', () => {
    const datos = GeneradorTilemap._datosVacios(4, 4);
    GeneradorTilemap._rellenarBorde(datos, 4, 4, 1);
    // Esquinas deben ser 1
    expect(datos[0]).toBe(1);
    expect(datos[3]).toBe(1);
    expect(datos[12]).toBe(1);
    expect(datos[15]).toBe(1);
    // Interior (tile en posición fila 1, col 1) debe ser 0
    expect(datos[4 + 1]).toBe(0);
    expect(datos[4 + 2]).toBe(0);
  });

  it('_tileset devuelve estructura con name y firstgid', () => {
    const ts = GeneradorTilemap._tileset(1, 'johto');
    expect(ts.name).toBe('johto');
    expect(ts.firstgid).toBe(1);
  });
});
