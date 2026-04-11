/**
 * Retratos GIF (Crystal) de los tres iniciales.
 * Un solo módulo para Phaser, React y cualquier otra vista
 */
import chikorita from '../../ui/sprites/crystal/Chikorita_cristal.gif';
import cyndaquil from '../../ui/sprites/crystal/Cyndaquil_cristal.gif';
import totodile from '../../ui/sprites/crystal/Totodile_cristal.gif';
import miniChikorita from './mini_chikorita.gif';
import miniCyndaquil from './mini_cyndaquil.gif';
import miniTotodile from './mini_totodile.gif';

export const PORTRAIT_URL_INICIAL = {
  chikorita,
  cyndaquil,
  totodile,
};

/** @param {string} clave `chikorita` | `cyndaquil` | `totodile` */
export function urlPortraitInicial(clave) {
  return PORTRAIT_URL_INICIAL[clave] ?? chikorita;
}

/**
 * Sprite pequeño del menú Pokémon (lista de equipo) para iniciales de Johto.
 * @param {number | string | null | undefined} pokedexId
 * @returns {string | null}
 */
export function urlMiniMenuInicialPorPokedexId(pokedexId) {
  const n = Number(pokedexId);
  if (n === 152) return miniChikorita;
  if (n === 155) return miniCyndaquil;
  if (n === 158) return miniTotodile;
  return null;
}
