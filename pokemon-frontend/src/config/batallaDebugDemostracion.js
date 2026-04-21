/**
 * Config completa de NPCs de batalla en la sala debug.
 * `ataquesMoveset`: 1–4 nombres en kebab-case tal como están en la BD (`ATAQUES`).
 * El servidor los usa directamente; si no caben 4 entradas el learnset no rellena.
 */
const POOL_CAPTURA_JOHTO = [
  { pokedexId: 161, nombre: 'Sentret',   ataquesMoveset: ['tackle', 'defense-curl'] },
  { pokedexId: 165, nombre: 'Ledyba',    ataquesMoveset: ['tackle', 'supersonic'] },
  { pokedexId: 167, nombre: 'Spinarak',  ataquesMoveset: ['poison-sting', 'string-shot'] },
  { pokedexId: 170, nombre: 'Chinchou',  ataquesMoveset: ['bubble', 'thunder-wave'] },
  { pokedexId: 179, nombre: 'Mareep',    ataquesMoveset: ['tackle', 'thundershock'] },
  { pokedexId: 183, nombre: 'Marill',    ataquesMoveset: ['tackle', 'bubble'] },
  { pokedexId: 187, nombre: 'Hoppip',    ataquesMoveset: ['tackle', 'synthesis'] },
  { pokedexId: 194, nombre: 'Wooper',    ataquesMoveset: ['water-gun', 'mud-sport'] },
  { pokedexId: 204, nombre: 'Pineco',    ataquesMoveset: ['tackle', 'protect'] },
  { pokedexId: 206, nombre: 'Dunsparce', ataquesMoveset: ['rage', 'defense-curl'] },
];

export function generarPokemonAleatorioCaptura() {
  const base = POOL_CAPTURA_JOHTO[Math.floor(Math.random() * POOL_CAPTURA_JOHTO.length)];
  const nivel = 2 + Math.floor(Math.random() * 4);
  return { ...base, nivel };
}

export const CONFIG_NPC_BATALLA_DEBUG = {
  npc_captura: null,
  npc_battle_normal: {
    pokedexId: 163,
    nivel: 6,
    nombre: 'Hoothoot',
    ataquesMoveset: ['peck', 'tackle', 'growl', 'foresight'],
  },
  npc_battle_confuso: {
    pokedexId: 79,
    nivel: 5,
    nombre: 'Slowpoke',
    ataquesMoveset: ['water-gun', 'confusion', 'growl', 'supersonic'],
  },
  npc_battle_dormido: {
    pokedexId: 39,
    nivel: 5,
    nombre: 'Jigglypuff',
    ataquesMoveset: ['pound', 'double-slap', 'growl', 'hypnosis'],
  },
  npc_battle_quemado: {
    pokedexId: 58,
    nivel: 5,
    nombre: 'Growlithe',
    ataquesMoveset: ['bite', 'roar', 'flame-wheel', 'ember'],
  },
  npc_battle_veneno: {
    pokedexId: 23,
    nivel: 5,
    nombre: 'Ekans',
    ataquesMoveset: ['wrap', 'leer', 'poison-sting', 'sludge'],
  },
  npc_battle_paralisis: {
    pokedexId: 179,
    nivel: 5,
    nombre: 'Mareep',
    ataquesMoveset: ['tackle', 'growl', 'thundershock', 'thunder-wave'],
  },
  npc_battle_congelado: {
    pokedexId: 86,
    nivel: 5,
    nombre: 'Seel',
    ataquesMoveset: ['headbutt', 'growl', 'aurora-beam', 'ice-beam'],
  },
};

/**
 * @param {string | null | undefined} claveEstado sufijo tras `battle_` / `npc_battle_` (p. ej. paralisis)
 * @returns {string | null} nombre del ataque de estado en BD o null
 */
export function nombreAtaqueDemostracionPorEstadoDebug(claveEstado) {
  const c = String(claveEstado ?? '').trim().toLowerCase();
  const cfg = Object.values(CONFIG_NPC_BATALLA_DEBUG).find((_, i) =>
    Object.keys(CONFIG_NPC_BATALLA_DEBUG)[i].endsWith(c),
  );
  if (cfg?.ataquesMoveset?.length) {
    return cfg.ataquesMoveset[cfg.ataquesMoveset.length - 1] ?? null;
  }
  const fallback = {
    confuso: 'supersonic',
    dormido: 'hypnosis',
    quemado: 'ember',
    veneno: 'sludge',
    paralisis: 'thunder-wave',
    congelado: 'ice-beam',
  };
  return fallback[c] ?? null;
}
