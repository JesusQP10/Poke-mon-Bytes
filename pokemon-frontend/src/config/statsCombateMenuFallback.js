/**
 * Valores de combate Nv.5 coherentes con el starter offline (EscenaOverworld).
 * Sirven de respaldo en el menú si el objeto Pokémon no trae AT.ESP. / DEF.ESP. / VEL.
 */
export const STATS_MENU_FALLBACK_POR_POKEDEX = {
  152: {
    ataque: 11,
    defensa: 12,
    ataqueEspecial: 12,
    defensaEspecial: 13,
    velocidad: 10,
  },
  155: {
    ataque: 12,
    defensa: 10,
    ataqueEspecial: 13,
    defensaEspecial: 11,
    velocidad: 15,
  },
  158: {
    ataque: 13,
    defensa: 11,
    ataqueEspecial: 11,
    defensaEspecial: 11,
    velocidad: 9,
  },
};

/**
 * @param {Record<string, unknown> | null | undefined} p
 * @param {'ataque'|'defensa'|'ataqueEspecial'|'defensaEspecial'|'velocidad'} campo
 */
export function statCombateMenu(p, campo) {
  const direct = p?.[campo];
  if (direct != null && direct !== "") return direct;
  const stat = campo === "ataqueEspecial"
    ? p?.ataqueEspecialStat
    : campo === "defensaEspecial"
      ? p?.defensaEspecialStat
      : campo === "velocidad"
        ? p?.velocidadStat
        : campo === "ataque"
          ? p?.ataqueStat
          : p?.defensaStat;
  if (stat != null && stat !== "") return stat;
  const id = Number(p?.id);
  if (!Number.isFinite(id)) return null;
  const fb = STATS_MENU_FALLBACK_POR_POKEDEX[id];
  return fb?.[campo] ?? null;
}
