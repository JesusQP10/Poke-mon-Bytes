import "./BattlePlayerBackSprite.css";

/**
 * Espalda del Pokémon del jugador sobre la sombra inferior izquierda (~50,76).
 *
 * @param {{ src: string }} props
 */
export default function BattlePlayerBackSprite({ src }) {
  if (!src) return null;
  return (
    <div className="battle-player-back-wrap" aria-hidden>
      <img className="battle-player-back-img" src={src} alt="" decoding="async" />
    </div>
  );
}
