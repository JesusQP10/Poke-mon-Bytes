import { battleCampoSpriteUrl } from "../../config/battleStatusArt";
import "./BattleStatusSprite.css";

/**
 * Ilustración sobre la sombra del rival: captura (Porygon) o arte por estado alterado.
 *
 * @param {{ spriteEstadoClave?: string, esDebugCaptura?: boolean }} props
 */
export default function BattleStatusSprite({
  spriteEstadoClave = "normal",
  esDebugCaptura = false,
}) {
  const src = battleCampoSpriteUrl(esDebugCaptura, spriteEstadoClave);
  return (
    <div className="battle-status-sprite-wrap" aria-hidden>
      <img className="battle-status-sprite-img" src={src} alt="" decoding="async" />
    </div>
  );
}
