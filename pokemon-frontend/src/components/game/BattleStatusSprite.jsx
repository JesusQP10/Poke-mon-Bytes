import { SPRITES_FRENTE_LOCAL } from "../../config/spritesFrentePokemon";
import "./BattleStatusSprite.css";

/**
 * Sprite frontal del Pokémon rival en batalla.
 * Prioridad: sprite local (SPRITES_FRENTE_LOCAL) → PokéAPI Crystal gen-II → PokéAPI default.
 *
 * @param {{ pokedexId?: number | null, esDebugCaptura?: boolean }} props
 */
export default function BattleStatusSprite({ pokedexId = null, esDebugCaptura = false }) {
  const id = esDebugCaptura ? 137 : (pokedexId ?? null);

  let src;
  if (id != null && SPRITES_FRENTE_LOCAL[id]) {
    src = SPRITES_FRENTE_LOCAL[id];
  } else if (id != null) {
    src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/${id}.png`;
  } else {
    src = null;
  }

  if (!src) return null;

  return (
    <div className="battle-status-sprite-wrap" aria-hidden>
      <img className="battle-status-sprite-img" src={src} alt="" decoding="async" />
    </div>
  );
}
