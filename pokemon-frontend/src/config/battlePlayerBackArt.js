/**
 * Espaldas de combate. Starters Johto usan assets locales; el resto va a PokéAPI Gen V B/W.
 */
import chikoritaBack from "../assets/battle/player/chikorita_back.gif";
import cyndaquilBack from "../assets/battle/player/cyndaquil_back.gif";
import totodileBack from "../assets/battle/player/totodile_back.gif";

const LOCAL_POR_DEX = {
  152: chikoritaBack,
  155: cyndaquilBack,
  158: totodileBack,
};

function _dex(pokemon) {
  if (!pokemon || typeof pokemon !== "object") return null;
  const n = Number(pokemon.id ?? pokemon.pokedexId ?? pokemon.idPokedex);
  if (Number.isFinite(n) && n > 0) return n;
  const raw = String(pokemon.nombre ?? pokemon.nombreApodo ?? "").toLowerCase();
  if (raw.includes("chikorita")) return 152;
  if (raw.includes("cyndaquil")) return 155;
  if (raw.includes("totodile")) return 158;
  return null;
}

/**
 * URLs del sprite de espalda para el Pokémon activo del jugador.
 * @param {object | null | undefined} pokemon
 * @returns {{ principal: string, fallback: string }}
 */
export function urlsEspaldaJugadorCampo(pokemon) {
  const dex = _dex(pokemon);
  if (dex != null && LOCAL_POR_DEX[dex]) {
    return { principal: LOCAL_POR_DEX[dex], fallback: LOCAL_POR_DEX[dex] };
  }
  const id = dex ?? 158;
  return {
    principal: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/back/${id}.gif`,
    fallback: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/back/${id}.png`,
  };
}

/** @deprecated Usa urlsEspaldaJugadorCampo */
export function urlEspaldaJugadorCampo(pokemon) {
  return urlsEspaldaJugadorCampo(pokemon).principal;
}
