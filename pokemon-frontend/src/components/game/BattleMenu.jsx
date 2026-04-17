import { useEffect, useMemo, useState } from "react";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaArriba,
  esTeclaIzquierda,
  esTeclaDerecha,
} from "../../config/controlesJuego";
import "./BattleMenu.css";

/**
 * UI de combate estilo GBA: caja mensaje + caja acciones.
 *
 * @param {{
 *   mensaje?: string,
 *   opciones?: string[],
 *   seleccion?: number,
 *   menuVisible?: boolean,
 *   onSeleccion?: (i: number) => void
 * }} props
 */
export default function BattleMenu({
  mensaje = "",
  opciones = ["LUCHAR", "MOCHILA", "POKÉMON", "HUIR"],
  seleccion = 0,
  menuVisible = true,
  onSeleccion,
}) {
  const opts = useMemo(() => {
    const arr = Array.isArray(opciones) ? opciones.slice(0, 4) : [];
    while (arr.length < 4) arr.push("—");
    return arr;
  }, [opciones]);

  const [sel, setSel] = useState(() => (Number.isFinite(seleccion) ? seleccion : 0));

  useEffect(() => {
    setSel(Number.isFinite(seleccion) ? seleccion : 0);
  }, [seleccion]);

  useEffect(() => {
    if (!menuVisible) return;
    const manejar = (e) => {
      if (!menuVisible) return;
      if (esTeclaArriba(e.code)) {
        e.preventDefault();
        setSel((i) => (i >= 2 ? i - 2 : i));
      } else if (esTeclaAbajo(e.code)) {
        e.preventDefault();
        setSel((i) => (i < 2 ? i + 2 : i));
      } else if (esTeclaIzquierda(e.code)) {
        e.preventDefault();
        setSel((i) => (i % 2 === 1 ? i - 1 : i));
      } else if (esTeclaDerecha(e.code)) {
        e.preventDefault();
        setSel((i) => (i % 2 === 0 ? i + 1 : i));
      } else if (esTeclaAceptar(e.code)) {
        e.preventDefault();
        onSeleccion?.(sel);
      } else if (esTeclaAtras(e.code)) {
        // En combate, X suele cerrar submenús; aquí no hacemos nada por defecto.
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [menuVisible, onSeleccion, sel]);

  return (
    <div className="battle-ui-root" role="presentation" aria-hidden={false}>
      <div className="battle-ui-frame">
        <div className="battle-ui-inner">
          <div className="battle-ui-left">
            <div className="battle-ui-text">{mensaje}</div>
          </div>
          <div className="battle-ui-right" aria-hidden={!menuVisible}>
            <div className="battle-ui-grid">
              {opts.map((t, i) => (
                <div key={`${t}-${i}`} className="battle-ui-opt">
                  <span className="battle-ui-cursor">{menuVisible && i === sel ? "▶" : ""}</span>
                  <span className="battle-ui-label">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

