import { useEffect, useState } from "react";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaArriba,
} from "../../config/controlesJuego";
import "./BattleMoves.css";
import "./BattleLearnMove.css";

/**
 * Diálogo de aprendizaje de movimiento (estilo Gen II).
 *
 * Fases:
 *  1. "pregunta" — ¿Aprende [Movimiento]? SI/NO
 *  2. "olvidar"  — Elige cuál de los 4 movimientos actuales olvidar (o "No aprender")
 *
 * @param {{
 *   pokemonNombre: string,
 *   movimientoNuevo: { moveId: number, nombre: string, tipo: string, pp: number, potencia: number },
 *   movimientosActuales: { moveId: number, nombre: string, tipo: string, pp: number }[],
 *   onAprender: (moveIdAOlvidar: number | null) => void,
 *   onRechazar: () => void,
 * }} props
 */
export default function BattleLearnMove({
  pokemonNombre,
  movimientoNuevo,
  movimientosActuales,
  onAprender,
  onRechazar,
}) {
  const [fase, setFase] = useState("pregunta");
  const [selSiNo, setSelSiNo] = useState(0); // 0 = Sí, 1 = No
  const [selMov, setSelMov] = useState(0);   // índice en movimientosActuales (0-3) o 4 = "No aprender"

  const movActuales = Array.isArray(movimientosActuales) ? movimientosActuales.slice(0, 4) : [];
  const totalOpciones = movActuales.length + 1; // + "No aprender"

  useEffect(() => {
    setFase("pregunta");
    setSelSiNo(0);
    setSelMov(0);
  }, [movimientoNuevo]);

  useEffect(() => {
    const manejar = (e) => {
      if (fase === "pregunta") {
        if (esTeclaArriba(e.code) || esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelSiNo((s) => (s === 0 ? 1 : 0));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          if (selSiNo === 0) {
            if (movActuales.length < 4) {
              onAprender?.(null);
            } else {
              setFase("olvidar");
            }
          } else {
            onRechazar?.();
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          onRechazar?.();
        }
      } else if (fase === "olvidar") {
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelMov((s) => Math.max(0, s - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelMov((s) => Math.min(totalOpciones - 1, s + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          if (selMov === movActuales.length) {
            onRechazar?.();
          } else {
            onAprender?.(movActuales[selMov]?.moveId ?? null);
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          setFase("pregunta");
        }
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [fase, selSiNo, selMov, movActuales, totalOpciones, onAprender, onRechazar]);

  const nombreNuevo = movimientoNuevo?.nombre ?? "???";

  return (
    <div className="battle-moves-root" role="dialog">
      {fase === "pregunta" && (
        <div className="battle-moves-frame">
          <div className="battle-learnmove-inner">
            <div className="battle-learnmove-msg">
              {`¿${pokemonNombre}\naprende\n${nombreNuevo}?`}
            </div>
            <div className="battle-learnmove-sino">
              <div className={`battle-learnmove-opcion${selSiNo === 0 ? " active" : ""}`}>
                <span className="battle-move-cursor">{selSiNo === 0 ? "▶" : ""}</span>Sí
              </div>
              <div className={`battle-learnmove-opcion${selSiNo === 1 ? " active" : ""}`}>
                <span className="battle-move-cursor">{selSiNo === 1 ? "▶" : ""}</span>No
              </div>
            </div>
          </div>
        </div>
      )}

      {fase === "olvidar" && (
        <div className="battle-moves-frame">
          <div className="battle-learnmove-inner">
            <div className="battle-learnmove-msg">
              {`¿Cuál olvidar\npara aprender\n${nombreNuevo}?`}
            </div>
            <div className="battle-learnmove-lista">
              {movActuales.map((m, i) => (
                <div
                  key={m.moveId ?? i}
                  className={`battle-learnmove-fila${selMov === i ? " active" : ""}`}
                >
                  <span className="battle-move-cursor">{selMov === i ? "▶" : ""}</span>
                  <span className="battle-learnmove-nombre">{m.nombre}</span>
                </div>
              ))}
              <div className={`battle-learnmove-fila${selMov === movActuales.length ? " active" : ""}`}>
                <span className="battle-move-cursor">{selMov === movActuales.length ? "▶" : ""}</span>
                <span className="battle-learnmove-nombre">No aprender</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
