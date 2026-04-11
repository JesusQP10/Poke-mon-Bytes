/**
 * Retratos GIF (Crystal) de los tres iniciales.
 * Un solo módulo para Phaser, React y cualquier otra vista
 */
import chikorita from '../../ui/sprites/crystal/Chikorita_cristal.gif';
import cyndaquil from '../../ui/sprites/crystal/Cyndaquil_cristal.gif';
import totodile from '../../ui/sprites/crystal/Totodile_cristal.gif';

export const PORTRAIT_URL_INICIAL = {
  chikorita,
  cyndaquil,
  totodile,
};

/** @param {string} clave `chikorita` | `cyndaquil` | `totodile` */
export function urlPortraitInicial(clave) {
  return PORTRAIT_URL_INICIAL[clave] ?? chikorita;
}
