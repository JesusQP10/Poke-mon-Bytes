import { PORTRAIT_URL_INICIAL } from "../assets/pokemon/starters/portraitUrls";

const POKEAPI_POKEMON = "https://pokeapi.co/api/v2/pokemon";
const POKEAPI_MOVE = "https://pokeapi.co/api/v2/move";

/** Grupos de versión para aprendizaje por nivel (Johto / Crystal primero). */
const VERSION_GROUP_LEVEL_UP_PREF = ["crystal", "gold-silver"];

/**
 * @typedef {{ nombre: string, tipoCodigo: string, tipoEs: string, pp: number | null }} DetalleMovimiento
 */

/** @type {Map<string, DetalleMovimiento>} */
const cacheDetalleMovimiento = new Map();

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
 * URL directa del sprite B/W animado sin necesidad de fetch a PokéAPI.
 * Mismo orden de preferencia que `spriteAnimadoPreferido` pero construido estáticamente.
 * @param {number | string | null | undefined} pokedexId
 * @returns {{ principal: string, fallback: string }}
 */
export function urlSpriteDirectoPorId(pokedexId) {
  const n = Number(pokedexId);
  return {
    principal: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${n}.gif`,
    fallback:  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/${n}.png`,
  };
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
 * Movimientos aprendidos por subida de nivel hasta `nivelMax` (incl.).
 * Usa Crystal / Oro-Plata si existen.
 * @param {Record<string, unknown>} data JSON de /pokemon/{id}
 * @param {number} nivelMax
 * @returns {{ slugEn: string, nivelAprende: number }[]}
 */
function extraerMovimientosPorNivel(data, nivelMax) {
  const n = Math.max(1, Math.min(100, Math.floor(Number(nivelMax)) || 1));
  const moves = data?.moves;
  if (!Array.isArray(moves)) return [];

  /** @type {{ slugEn: string, nivelAprende: number }[]} */
  const out = [];
  for (const entry of moves) {
    const slug = String(entry?.move?.name || "");
    if (!slug) continue;
    const details = entry?.version_group_details;
    if (!Array.isArray(details)) continue;

    const levelUps = details.filter(
      (d) =>
        d?.move_learn_method?.name === "level-up" &&
        typeof d.level_learned_at === "number" &&
        d.level_learned_at >= 1 &&
        d.level_learned_at <= n,
    );
    if (!levelUps.length) continue;

    let chosen = null;
    for (const vg of VERSION_GROUP_LEVEL_UP_PREF) {
      const hit = levelUps.find((d) => d?.version_group?.name === vg);
      if (hit) {
        chosen = hit;
        break;
      }
    }
    if (!chosen) {
      chosen = levelUps.reduce((a, b) =>
        a.level_learned_at <= b.level_learned_at ? a : b,
      );
    }
    out.push({ slugEn: slug, nivelAprende: chosen.level_learned_at });
  }

  out.sort((a, b) => {
    if (a.nivelAprende !== b.nivelAprende) return a.nivelAprende - b.nivelAprende;
    return a.slugEn.localeCompare(b.slugEn);
  });
  return out;
}

/**
 * Nombre, tipo y PP del movimiento (PokéAPI). Cache en memoria por sesión.
 * @param {string} slugEn kebab-case inglés
 * @returns {Promise<DetalleMovimiento>}
 */
async function fetchDetalleMovimiento(slugEn) {
  const key = String(slugEn || "").toLowerCase();
  if (!key) {
    return { nombre: "???", tipoCodigo: "normal", tipoEs: "Normal", pp: null };
  }
  const cached = cacheDetalleMovimiento.get(key);
  if (cached) return cached;
  const res = await fetch(`${POKEAPI_MOVE}/${encodeURIComponent(key)}`);
  if (!res.ok) {
    const fallback = {
      nombre: key.replace(/-/g, " "),
      tipoCodigo: "normal",
      tipoEs: "Normal",
      pp: null,
    };
    cacheDetalleMovimiento.set(key, fallback);
    return fallback;
  }
  const data = await res.json();
  const names = Array.isArray(data.names) ? data.names : [];
  const nombre =
    names.find((x) => x?.language?.name === "es")?.name ||
    names.find((x) => x?.language?.name === "en")?.name ||
    key.replace(/-/g, " ");
  const tipoCodigo = String(data?.type?.name || "normal").toLowerCase();
  const tipoEs = TIPO_EN_A_ES[tipoCodigo] || tipoCodigo;
  const ppRaw = data?.pp;
  const pp = typeof ppRaw === "number" && ppRaw >= 0 ? ppRaw : null;
  const detalle = { nombre, tipoCodigo, tipoEs, pp };
  cacheDetalleMovimiento.set(key, detalle);
  return detalle;
}

/**
 * Datos públicos de PokéAPI.
 * @param {number | string} idONombre Número Pokedex nacional o nombre en inglés.
 * @param {number | null | undefined} nivelPokemon Incluye movimientos aprendidos por nivel hasta ese nivel.
 */
export async function fetchResumenPokemonPokeapi(idONombre, nivelPokemon) {
  const q = encodeURIComponent(String(idONombre));
  const res = await fetch(`${POKEAPI_POKEMON}/${q}`);
  if (!res.ok) throw new Error(`pokeapi ${res.status}`);
  const data = await res.json();
  const tiposOrdenados = [...(data.types || [])].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  const tiposEs = tiposOrdenados.map(
    (t) => TIPO_EN_A_ES[String(t?.type?.name || "").toLowerCase()] || t?.type?.name || "?",
  );
  const base = {
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

  const nv =
    nivelPokemon != null && Number.isFinite(Number(nivelPokemon))
      ? Math.max(1, Math.min(100, Math.floor(Number(nivelPokemon))))
      : null;
  if (nv == null) return base;

  const raw = extraerMovimientosPorNivel(data, nv);
  const detalles = await Promise.all(raw.map((m) => fetchDetalleMovimiento(m.slugEn)));
  const movimientosPorNivel = raw.map((m, i) => {
    const d = detalles[i];
    return {
      slugEn: m.slugEn,
      nivelAprende: m.nivelAprende,
      nombre: d?.nombre || m.slugEn,
      tipoCodigo: d?.tipoCodigo || "normal",
      tipoEs: d?.tipoEs || "Normal",
      pp: d?.pp ?? null,
    };
  });

  return { ...base, movimientosPorNivel, nivelMovimientos: nv };
}

/**
 * Etiqueta en español para código de tipo en inglés.
 * @param {string | null | undefined} codigo
 */
export function etiquetaTipoEspanol(codigo) {
  if (!codigo) return "";
  return TIPO_EN_A_ES[String(codigo).toLowerCase()] || codigo;
}
