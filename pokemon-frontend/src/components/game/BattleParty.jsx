import { useEffect, useMemo, useState } from "react";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaArriba,
} from "../../config/controlesJuego";
import iconSlotParty from "../../assets/ui/menu/icon_slot_party.png";
import { urlMiniMenuInicialPorPokedexId } from "../../assets/pokemon/starters/portraitUrls";
import "./MenuIngameReact.css";

function colorHp(hpActual, hpMax) {
  if (hpMax <= 0) return "menu-ingame-hp-ok";
  const r = hpActual / hpMax;
  if (r > 0.5) return "menu-ingame-hp-ok";
  if (r > 0.2) return "menu-ingame-hp-warn";
  return "menu-ingame-hp-bad";
}

function hpRatio(hpActual, hpMax) {
  if (!hpMax || hpMax <= 0) return 0;
  return Math.max(0, Math.min(1, hpActual / hpMax));
}

function esMismoPokemonQueStarter(p, starter) {
  if (!p || !starter) return false;
  const sid = starter.pokemonUsuarioId;
  const pid = p.pokemonUsuarioId;
  if (sid != null && pid != null) return sid === pid;
  return Number(p.id) === Number(starter.id ?? starter.pokedexId);
}

/**
 * Lista de equipo en combate: mismo aspecto que el menú in-game (POKÉMON).
 *
 * @param {{
 *   equipo: object[],
 *   starter?: object | null,
 *   onPick: (p: object) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function BattleParty({ equipo = [], starter = null, onPick, onCancel }) {
  const lista = useMemo(() => (Array.isArray(equipo) ? equipo : []), [equipo]);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    setSel(0);
  }, [lista.length]);

  useEffect(() => {
    const manejar = (e) => {
      if (lista.length === 0) {
        if (esTeclaAtras(e.code) || esTeclaAceptar(e.code)) {
          e.preventDefault();
          onCancel?.();
        }
        return;
      }
      if (esTeclaArriba(e.code)) {
        e.preventDefault();
        setSel((i) => Math.max(0, i - 1));
      } else if (esTeclaAbajo(e.code)) {
        e.preventDefault();
        setSel((i) => Math.min(lista.length - 1, i + 1));
      } else if (esTeclaAceptar(e.code)) {
        e.preventDefault();
        const p = lista[sel];
        if (p) onPick?.(p);
      } else if (esTeclaAtras(e.code)) {
        e.preventDefault();
        onCancel?.();
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [lista, onCancel, onPick, sel]);

  return (
    <div className="menu-ingame-root" role="dialog" aria-modal="true">
      <div className="menu-ingame-full menu-ingame-full--team">
        <div className="menu-ingame-full-title">POKÉMON</div>
        <div className="menu-ingame-team-list">
          {lista.map((p, i) => {
            const nombreEspecie = p.nombre || "???";
            const apodo = p.nombreApodo && p.nombreApodo !== nombreEspecie ? p.nombreApodo : null;
            const etiqueta = apodo || nombreEspecie;
            const nv = p.nivel || 5;
            const hpA = p.hpActual ?? p.hpMax ?? 20;
            const hpM = p.hpMax ?? 20;
            const ratio = hpRatio(hpA, hpM);
            const miniStarter =
              esMismoPokemonQueStarter(p, starter) &&
              urlMiniMenuInicialPorPokedexId(p.id ?? starter?.id ?? starter?.pokedexId);
            return (
              <div
                key={`battle-slot-${i}`}
                className={`menu-ingame-team-slot${i === sel ? " menu-ingame-team-slot--active" : ""}`}
              >
                <div className="menu-ingame-team-slot-head">
                  <span className="menu-ingame-cursor">{i === sel ? "▶" : ""}</span>
                  {miniStarter ? (
                    <img
                      className="menu-ingame-team-slot-mini"
                      src={miniStarter}
                      alt=""
                      width={14}
                      height={14}
                      draggable={false}
                    />
                  ) : i === 0 ? (
                    <img
                      className="menu-ingame-team-slot-icon"
                      src={iconSlotParty}
                      alt=""
                      width={14}
                      height={14}
                      draggable={false}
                    />
                  ) : (
                    <span className="menu-ingame-team-slot-num">{i + 1}</span>
                  )}
                  <div className="menu-ingame-team-slot-names">
                    <div className="menu-ingame-team-etiqueta">{etiqueta}</div>
                    {apodo && <div className="menu-ingame-team-sub">{nombreEspecie}</div>}
                  </div>
                  <span className="menu-ingame-team-nv">Nv.{nv}</span>
                </div>
                <div className="menu-ingame-hp-row">
                  <div className="menu-ingame-hpbar">
                    <div
                      className={`menu-ingame-hpbar-fill ${colorHp(hpA, hpM)}`}
                      style={{ width: `${Math.round(ratio * 100)}%` }}
                    />
                  </div>
                  <span className={`menu-ingame-hpnums ${colorHp(hpA, hpM)}`}>
                    {hpA}/{hpM}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
