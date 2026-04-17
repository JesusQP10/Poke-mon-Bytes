import { useEffect, useMemo, useState } from "react";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaArriba,
  esTeclaIzquierda,
  esTeclaDerecha,
} from "../../config/controlesJuego";
import "./BattleMoves.css";

/**
 * Selección de movimientos (4 cajitas 2×2): nombre + PP.
 *
 * @param {{
 *   mensaje?: string,
 *   slots: { nombre: string, pp: string, usable: boolean }[],
 *   onPick: (slotIndex: number) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function BattleMoves({ mensaje = "Elige un\nmovimiento.", slots, onPick, onCancel }) {
  const list = useMemo(() => {
    const arr = Array.isArray(slots) ? slots.slice(0, 4) : [];
    while (arr.length < 4) {
      arr.push({ nombre: "—", pp: "--/--", usable: false });
    }
    return arr;
  }, [slots]);

  const totalMovs = useMemo(() => list.filter((s) => s.usable).length, [list]);

  const [sel, setSel] = useState(0);

  useEffect(() => {
    const first = list.findIndex((s) => s.usable);
    setSel(first >= 0 ? first : 0);
  }, [list]);

  useEffect(() => {
    const manejar = (e) => {
      if (totalMovs <= 0) return;

      const step = (code) => {
        setSel((prev) => {
          let next = prev;
          switch (code) {
            case "up":
              if (next >= 2) next -= 2;
              break;
            case "down":
              if (next + 2 < totalMovs) next += 2;
              break;
            case "left":
              if (next % 2 === 1) next -= 1;
              break;
            case "right":
              if (next % 2 === 0 && next + 1 < totalMovs) next += 1;
              break;
            default:
              break;
          }
          return next;
        });
      };

      if (esTeclaArriba(e.code)) {
        e.preventDefault();
        step("up");
      } else if (esTeclaAbajo(e.code)) {
        e.preventDefault();
        step("down");
      } else if (esTeclaIzquierda(e.code)) {
        e.preventDefault();
        step("left");
      } else if (esTeclaDerecha(e.code)) {
        e.preventDefault();
        step("right");
      } else if (esTeclaAceptar(e.code)) {
        e.preventDefault();
        if (list[sel]?.usable) onPick?.(sel);
      } else if (esTeclaAtras(e.code)) {
        e.preventDefault();
        onCancel?.();
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [list, onCancel, onPick, sel, totalMovs]);

  return (
    <div className="battle-moves-root" role="presentation">
      <div className="battle-moves-frame">
        <div className="battle-moves-inner">
          <div className="battle-moves-left">
            <div className="battle-moves-msg">{mensaje}</div>
          </div>
          <div className="battle-moves-right">
            <div className="battle-moves-grid">
              {list.map((s, i) => (
                <div
                  key={`mv-${i}`}
                  className={`battle-move-slot${!s.usable ? " battle-move-slot--empty" : ""}${s.usable && i === sel ? " battle-move-slot--active" : ""}`}
                >
                  <span className="battle-move-cursor" aria-hidden>
                    {s.usable && i === sel ? "▶" : ""}
                  </span>
                  <div className="battle-move-body">
                    <div className="battle-move-name">{s.nombre}</div>
                    <div className="battle-move-pp">{s.pp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
