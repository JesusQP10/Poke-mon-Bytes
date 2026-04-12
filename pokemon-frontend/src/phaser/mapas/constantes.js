/** Tamaño de tile del overworld (coincide con Tiled / WarpSystem). */
export const TAM_TILE = 16;

/**
 * Resuelve la clave de textura Phaser para un tileset del JSON de Tiled.
 * Si el nombre no coincide exactamente (mayúsculas, espacios, renombre en Tiled).
 *
 * @param {Record<string, string>|null|undefined} texturaPorNombre
 * @param {string} nombreTilesetTiled
 * @param {string} tilesetKeyUnico
 * @returns {string}
 */
export function resolverTexturaPorNombreTileset(texturaPorNombre, nombreTilesetTiled, tilesetKeyUnico) {
  if (!texturaPorNombre || typeof texturaPorNombre !== 'object') return tilesetKeyUnico;
  const raw = String(nombreTilesetTiled ?? '').trim();
  if (!raw) return tilesetKeyUnico;
  if (Object.prototype.hasOwnProperty.call(texturaPorNombre, raw)) {
    return texturaPorNombre[raw];
  }
  const lower = raw.toLowerCase();
  for (const k of Object.keys(texturaPorNombre)) {
    if (k.trim().toLowerCase() === lower) {
      return texturaPorNombre[k];
    }
  }
  if (/\bdebugger\b/i.test(raw)) {
    const k = Object.keys(texturaPorNombre).find((key) => key.trim().toLowerCase() === 'debugger_room');
    if (k) return texturaPorNombre[k];
    return 'debugger_room';
  }
  if (/new\s*bark/i.test(raw)) {
    const k = Object.keys(texturaPorNombre).find((key) => /new\s*bark/i.test(key));
    if (k) return texturaPorNombre[k];
    return 'new_bark_town';
  }
  return tilesetKeyUnico;
}
