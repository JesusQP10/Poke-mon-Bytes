/**
 * Espaldas de combate (starters Johto). Assets: `src/assets/battle/player/*_back.gif`.
 */
import chikoritaBack from "../assets/battle/player/chikorita_back.gif";
import cyndaquilBack from "../assets/battle/player/cyndaquil_back.gif";
import totodileBack from "../assets/battle/player/totodile_back.gif";

/** National Dex Johto iniciales */
const URL_POR_DEX = {
  152: chikoritaBack,
  155: cyndaquilBack,
  158: totodileBack,
};

/**
 * @param {object | null | undefined} pokemon Pokémon activo (slot 0) — `id` / `pokedexId` o nombre.
 * @returns {string} URL Vite del GIF de espalda.
 */
export function urlEspaldaJugadorCampo(pokemon) {
  if (!pokemon || typeof pokemon !== "object") return totodileBack;
  const dex = Number(pokemon.id ?? pokemon.pokedexId ?? pokemon.idPokedex);
  if (Number.isFinite(dex) && URL_POR_DEX[dex]) return URL_POR_DEX[dex];
  const raw = String(pokemon.nombre ?? pokemon.nombreApodo ?? "").toLowerCase();
  if (raw.includes("chikorita")) return chikoritaBack;
  if (raw.includes("cyndaquil")) return cyndaquilBack;
  if (raw.includes("totodile")) return totodileBack;
  return totodileBack;
}
