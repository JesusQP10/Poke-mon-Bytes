/**
 * Iconos de ítems del catálogo (misma convención que slugs PokéAPI / nombres en BD).
 * Archivos en `public/assets/game/overworld/sprites/items/{slug}.png`.
 *
 * @param {string | null | undefined} nombreMostrable p. ej. "Poke-ball", "Super-potion"
 * @returns {string} URL pública bajo `/assets/...`
 */
export function urlIconoItemPorNombre(nombreMostrable) {
  const slug = String(nombreMostrable ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "-");
  if (!slug) return "";
  return `/assets/game/overworld/sprites/items/${slug}.png`;
}
