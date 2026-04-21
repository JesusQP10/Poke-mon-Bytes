import { useEffect, useMemo, useState } from "react";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaArriba,
} from "../../config/controlesJuego";
import "./BattleBag.css";
import iconPocion from "../../assets/ui/menu/icon_pocion.png";
import { urlIconoItemPorNombre } from "../../config/iconosItems";

/**
 * Mochila de combate: CURATIVOS y BALLS (mismo marco que el menú de batalla).
 *
 * @param {{
 *   mensaje?: string,
 *   curativos: { nombre?: string, cantidad?: number }[],
 *   balls: { nombre?: string, cantidad?: number }[],
 *   onPick: (linea: { nombre?: string, cantidad?: number }) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function BattleBag({
  mensaje = "MOCHILA",
  curativos = [],
  balls = [],
  onPick,
  onCancel,
}) {
  const curas = useMemo(
    () => (Array.isArray(curativos) ? curativos : []).filter((l) => l && Number(l.cantidad) > 0),
    [curativos],
  );
  const bals = useMemo(
    () => (Array.isArray(balls) ? balls : []).filter((l) => l && Number(l.cantidad) > 0),
    [balls],
  );

  const entradas = useMemo(() => {
    /** @type {{ seccion: 'curativo'|'ball', linea: object }[]} */
    const out = [];
    curas.forEach((linea) => out.push({ seccion: "curativo", linea }));
    bals.forEach((linea) => out.push({ seccion: "ball", linea }));
    return out;
  }, [curas, bals]);

  const [sel, setSel] = useState(0);

  useEffect(() => {
    setSel(0);
  }, [entradas.length]);

  useEffect(() => {
    const manejar = (e) => {
      if (entradas.length === 0) {
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
        setSel((i) => Math.min(entradas.length - 1, i + 1));
      } else if (esTeclaAceptar(e.code)) {
        e.preventDefault();
        const row = entradas[sel];
        if (row) onPick?.(row.linea);
      } else if (esTeclaAtras(e.code)) {
        e.preventDefault();
        onCancel?.();
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [entradas, onCancel, onPick, sel]);

  const vacio = entradas.length === 0;

  const renderFila = (linea, flatIdx, key) => (
    <div
      key={key}
      className={`battle-bag-fila${flatIdx === sel ? " battle-bag-fila--sel" : ""}`}
    >
      <span className="battle-bag-cur">{flatIdx === sel ? "▶" : ""}</span>
      <span className="battle-bag-icon-wrap" aria-hidden>
        <img
          className="battle-bag-icon"
          src={urlIconoItemPorNombre(linea.nombre) || iconPocion}
          alt=""
          width={12}
          height={12}
          draggable={false}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = iconPocion; }}
        />
      </span>
      <span className="battle-bag-nombre">{linea.nombre ?? "?"}</span>
      <span className="battle-bag-cant">×{linea.cantidad}</span>
    </div>
  );

  return (
    <div className="battle-bag-root" role="presentation">
      <div className="battle-bag-frame">
        <div className="battle-bag-inner">
          <div className="battle-bag-left">
            <div className="battle-bag-msg">{mensaje}</div>
          </div>
          <div className="battle-bag-right">
            <div className="battle-bag-scroll">
              <div className="battle-bag-seccion-tit">CURATIVOS</div>
              {curas.length === 0
                ? <div className="battle-bag-vacio">—</div>
                : curas.map((linea, idx) => renderFila(linea, idx, `c-${idx}`))
              }
              <div className="battle-bag-seccion-tit battle-bag-seccion-tit--2">BALLS</div>
              {bals.length === 0
                ? <div className="battle-bag-vacio">—</div>
                : bals.map((linea, idx) => renderFila(linea, curas.length + idx, `b-${idx}`))
              }
              {vacio && <div className="battle-bag-vacio-todo">Nada útil en combate.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
