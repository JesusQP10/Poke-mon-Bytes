import { useEffect, useState } from "react";
import { SPRITES_FRENTE_LOCAL } from "../../config/spritesFrentePokemon";
import { urlSpriteDirectoPorId } from "../../services/pokemonDetallePokeapi";
import "./BattleStatusSprite.css";

/**
 * Sprite frontal del Pokémon rival en batalla.
 * Prioridad: sprite local → Gen V B/W animado → Crystal gen-II.
 *
 * @param {{ pokedexId?: number | null }} props
 */
export default function BattleStatusSprite({ pokedexId = null }) {
  const id = pokedexId ?? null;

  const getPrincipal = (id) => {
    if (id == null) return null;
    if (SPRITES_FRENTE_LOCAL[id]) return SPRITES_FRENTE_LOCAL[id];
    return urlSpriteDirectoPorId(id).principal;
  };

  const [src, setSrc] = useState(() => getPrincipal(id));

  useEffect(() => {
    setSrc(getPrincipal(id));
  }, [id]);

  if (!src) return null;

  const fallback = id != null ? urlSpriteDirectoPorId(id).fallback : null;

  return (
    <div className="battle-status-sprite-wrap" aria-hidden>
      <img
        className="battle-status-sprite-img"
        src={src}
        alt=""
        decoding="async"
        onError={() => {
          if (fallback && src !== fallback) setSrc(fallback);
        }}
      />
    </div>
  );
}
