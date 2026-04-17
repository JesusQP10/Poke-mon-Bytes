/**
 * Clasificación de líneas de inventario para la mochila de combate.
 * Backend: `efecto` en ítem (HEAL_*, CAPTURE_*, CURE_*…).
 *
 * @param {{ nombre?: string, efecto?: string } | null | undefined} linea
 * @returns {'curativo' | 'ball' | null}
 */
export function clasificarLineaInventarioBatalla(linea) {
  if (!linea || typeof linea !== "object") return null;
  const efecto = String(linea.efecto ?? "")
    .trim()
    .toUpperCase();
  if (efecto.startsWith("CAPTURE_")) return "ball";
  if (efecto.startsWith("HEAL_") || efecto.startsWith("CURE_")) return "curativo";

  const n = String(linea.nombre ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (/(ball|poke|ultra|great|master|safari|mazo)/i.test(n)) return "ball";
  if (/(poci|potion|revive|reviv|antidot|antidote|curar|ether|elixir|miel|medic|full)/i.test(n))
    return "curativo";

  return null;
}
