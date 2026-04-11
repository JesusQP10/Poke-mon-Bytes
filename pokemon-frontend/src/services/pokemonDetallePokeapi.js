import { PORTRAIT_URL_INICIAL } from "../assets/pokemon/starters/portraitUrls";

const POKEAPI_POKEMON = "https://pokeapi.co/api/v2/pokemon";

/** @type {Record<string, string>} */
const TIPO_EN_A_ES = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

/**
 * GIF Crystal local solo para los tres iniciales de Johto.
 * @param {number | string | null | undefined} pokedexId
 * @returns {string | null}
 */
export function urlGifCrystalStarter(pokedexId) {
  const n = Number(pokedexId);
  if (n === 152) return PORTRAIT_URL_INICIAL.chikorita;
  if (n === 155) return PORTRAIT_URL_INICIAL.cyndaquil;
  if (n === 158) return PORTRAIT_URL_INICIAL.totodile;
  return null;
}

/**
 * Sprite animado de PokéAPI (Gen V B/W) o alternativas.
 * @param {Record<string, unknown> | null | undefined} sprites
 * @returns {string | null}
 */
export function spriteAnimadoPreferido(sprites) {
  if (!sprites || typeof sprites !== "object") return null;
  const bw = sprites.versions?.["generation-v"]?.["black-white"];
  const anim = bw?.animated?.front_default;
  if (anim) return anim;
  if (sprites.other?.showdown?.front_default) return sprites.other.showdown.front_default;
  if (sprites.front_default) return sprites.front_default;
  return null;
}

/** @param {unknown} data */
function statBase(data, nombreStat) {
  if (!data || typeof data !== "object" || !Array.isArray(data.stats)) return null;
  const s = data.stats.find((x) => x?.stat?.name === nombreStat);
  return typeof s?.base_stat === "number" ? s.base_stat : null;
}

/**
 * Datos públicos de PokéAPI.
 * @param {number | string} idONombre Número Pokedex nacional o nombre en inglés.
 */
export async function fetchResumenPokemonPokeapi(idONombre) {
  const q = encodeURIComponent(String(idONombre));
  const res = await fetch(`${POKEAPI_POKEMON}/${q}`);
  if (!res.ok) throw new Error(`pokeapi ${res.status}`);
  const data = await res.json();
  const tiposOrdenados = [...(data.types || [])].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  const tiposEs = tiposOrdenados.map(
    (t) => TIPO_EN_A_ES[String(t?.type?.name || "").toLowerCase()] || t?.type?.name || "?",
  );
  return {
    nombreEspecieEn: data.name,
    spriteUrl: spriteAnimadoPreferido(data.sprites),
    tiposEs,
    statsBase: {
      ps: statBase(data, "hp"),
      ataque: statBase(data, "attack"),
      defensa: statBase(data, "defense"),
      ataqueEsp: statBase(data, "special-attack"),
      defensaEsp: statBase(data, "special-defense"),
      velocidad: statBase(data, "speed"),
    },
  };
}

/**
 * Etiqueta en español para código de tipo en inglés.
 * @param {string | null | undefined} codigo
 */
export function etiquetaTipoEspanol(codigo) {
  if (!codigo) return "";
  return TIPO_EN_A_ES[String(codigo).toLowerCase()] || codigo;
}
