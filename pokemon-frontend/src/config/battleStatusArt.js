/**
 * Ilustraciones centrales del combate según estado alterado (debug Tiled / futuro motor).
 * Assets en `src/assets/battle/status/`.
 */
import gardevoir from "../assets/battle/status/gardevoir.gif";
import toxtricityAmped from "../assets/battle/status/toxtricity-amped.png";
import pikachuCap from "../assets/battle/status/pikachu-original-cap.png";
import charizard from "../assets/battle/status/charizard.gif";
import psyduck from "../assets/battle/status/pysduck.gif";
import glaceon from "../assets/battle/status/glaceon.gif";
import gengar from "../assets/battle/status/gengar.gif";
import porygonCaptura from "../assets/battle/captura/porygon.gif";

/** @type {Record<string, string>} */
const URL_POR_CLAVE = {
  normal: gardevoir,
  veneno: toxtricityAmped,
  paralisis: pikachuCap,
  quemado: charizard,
  confuso: psyduck,
  congelado: glaceon,
  dormido: gengar,
};

const CLAVES = new Set(Object.keys(URL_POR_CLAVE).filter((k) => k !== "normal"));

/**
 * @param {unknown} estadoJugadorDebug
 * @param {unknown} estadoSalvajeDebug
 * @returns {keyof typeof URL_POR_CLAVE}
 */
export function battleStatusClaveParaIlustracion(estadoJugadorDebug, estadoSalvajeDebug) {
  const raw = estadoJugadorDebug ?? estadoSalvajeDebug ?? "";
  const k = String(raw).trim().toLowerCase();
  if (CLAVES.has(k)) return /** @type {keyof typeof URL_POR_CLAVE} */ (k);
  return "normal";
}

/**
 * @param {string} [clave]
 * @returns {string}
 */
export function battleStatusUrlDesdeClave(clave) {
  const k = String(clave ?? "normal").trim().toLowerCase();
  return URL_POR_CLAVE[CLAVES.has(k) ? k : "normal"] ?? URL_POR_CLAVE.normal;
}

/** Combate de prueba de captura (NPC / zona `captura`): siempre Porygon en el campo. */
export function battleCampoSpriteUrl(esDebugCaptura, claveEstadoVisual) {
  if (esDebugCaptura) return porygonCaptura;
  return battleStatusUrlDesdeClave(
    typeof claveEstadoVisual === "string" ? claveEstadoVisual : "normal",
  );
}

/** Pares [textureKey, viteUrl] para EscenaPreload. */
export const BATTLE_STATUS_PHASER_LOAD = [
  ["battle-art-normal", gardevoir],
  ["battle-art-veneno", toxtricityAmped],
  ["battle-art-paralisis", pikachuCap],
  ["battle-art-quemado", charizard],
  ["battle-art-confuso", psyduck],
  ["battle-art-congelado", glaceon],
  ["battle-art-dormido", gengar],
];

/**
 * @param {unknown} estadoJugadorDebug
 * @param {unknown} estadoSalvajeDebug
 * @returns {string}
 */
export function battleStatusTextureKeyPhaser(estadoJugadorDebug, estadoSalvajeDebug) {
  const c = battleStatusClaveParaIlustracion(estadoJugadorDebug, estadoSalvajeDebug);
  return `battle-art-${c}`;
}
