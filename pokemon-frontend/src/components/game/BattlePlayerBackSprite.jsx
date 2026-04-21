import { useEffect, useState } from "react";
import "./BattlePlayerBackSprite.css";

/**
 * Espalda del Pokémon del jugador sobre la sombra inferior izquierda.
 * Prioridad: principal (Gen V B/W animado o local) → fallback (Crystal gen-II).
 *
 * @param {{ principal?: string, fallback?: string }} props
 */
export default function BattlePlayerBackSprite({ principal, fallback }) {
  const [src, setSrc] = useState(principal ?? null);

  useEffect(() => {
    setSrc(principal ?? null);
  }, [principal]);

  if (!src) return null;

  return (
    <div className="battle-player-back-wrap" aria-hidden>
      <img
        className="battle-player-back-img"
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
