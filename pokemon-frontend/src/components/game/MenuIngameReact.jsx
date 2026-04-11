import { useCallback, useEffect, useMemo, useState } from "react";
import { usarJuegoStore } from "../../store/usarJuegoStore";
import { usarAutenticacionStore } from "../../store/usarAutenticacionStore";
import PuenteApi from "../../phaser/puentes/PuenteApi";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaArriba,
  esTeclaIzquierda,
  esTeclaDerecha,
} from "../../config/controlesJuego";
import {
  leerOpcionesCliente,
  escribirOpcionesCliente,
  PASOS_VOLUMEN_BGM,
} from "../../config/opcionesCliente";
import "./MenuIngameReact.css";
import "./DialogoRetro.css";

const OPCIONES = ["POKÉMON", "MOCHILA", "GUARDAR", "OPCIONES", "SALIR"];

/** @returns {{ clave: string, nombre: string, cantidad: number }[]} */
function agregarInventarioAgrupado(inventario) {
  const conteo = new Map();
  for (const it of inventario ?? []) {
    const clave = it.id || it.nombre || "?";
    const n = Number.isFinite(Number(it.cantidad)) ? Number(it.cantidad) : 1;
    conteo.set(clave, (conteo.get(clave) || 0) + n);
  }
  const lineas = [];
  conteo.forEach((cant, clave) => {
    const muestra = inventario.find((x) => (x.id || x.nombre) === clave);
    const nombre = muestra?.nombre || clave;
    lineas.push({ clave, nombre, cantidad: cant });
  });
  lineas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return lineas;
}

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

function pasoBgmPercent(actual, dir) {
  const steps = PASOS_VOLUMEN_BGM;
  let i = steps.indexOf(actual);
  if (i < 0) i = steps.indexOf(100);
  if (i < 0) i = steps.length - 1;
  const ni = Math.max(0, Math.min(steps.length - 1, i + dir));
  return steps[ni];
}

/**
 * Menú in-game (tecla X) en React.
 *
 * @param {{ onClose: () => void }} props
 */
const MenuIngameReact = ({ onClose }) => {
  const [vista, setVista] = useState("principal");
  const [selPrincipal, setSelPrincipal] = useState(0);
  const [selEquipo, setSelEquipo] = useState(0);
  const [selMochila, setSelMochila] = useState(0);
  const [selOpciones, setSelOpciones] = useState(0);
  const [prefs, setPrefs] = useState(() => leerOpcionesCliente());
  const [dialogo, setDialogo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const inventario = usarJuegoStore((s) => s.inventario);
  const team = usarJuegoStore((s) => s.team);
  const token = usarAutenticacionStore((s) => s.token);

  const lineasMochila = useMemo(() => agregarInventarioAgrupado(inventario), [inventario]);
  const equipo = useMemo(() => (Array.isArray(team) ? team : []), [team]);

  const pokemonActivo = equipo[selEquipo] ?? null;

  const selMochilaSafe = useMemo(
    () =>
      lineasMochila.length ? Math.min(Math.max(0, selMochila), lineasMochila.length - 1) : 0,
    [selMochila, lineasMochila],
  );

  const cerrarTodo = useCallback(() => {
    onClose();
  }, [onClose]);

  const volverPrincipal = useCallback(() => {
    setVista("principal");
    setDialogo(null);
    setSelOpciones(0);
  }, []);

  const abrirDialogo = useCallback((texto) => {
    setDialogo(texto);
  }, []);

  const ejecutarGuardar = useCallback(async () => {
    setGuardando(true);
    setDialogo(null);
    try {
      usarJuegoStore.getState().guardarPartidaLocal();
    } catch {
      setGuardando(false);
      abrirDialogo("No se pudo guardar\nen el navegador.");
      return;
    }

    const payload = usarJuegoStore.getState().construirPayloadGuardado();
    let servidorOk = false;
    if (token) {
      try {
        await PuenteApi.guardarJuegoEnServidor(payload);
        servidorOk = true;
      } catch {
        /* red o 401 */
      }
    }

    setGuardando(false);
    const msg = servidorOk
      ? "¡Partida guardada!\n(En el ordenador\ny en el servidor.)"
      : "¡Partida guardada!\n(Solo en este ordenador.)";
    abrirDialogo(msg);
  }, [abrirDialogo, token]);

  const accionPrincipal = useCallback(
    (indice) => {
      const op = OPCIONES[indice];
      if (op === "POKÉMON") {
        if (!equipo.length) {
          abrirDialogo("Sin Pokémon en\nel equipo.");
          return;
        }
        setSelEquipo(0);
        setVista("equipo");
        return;
      }
      if (op === "MOCHILA") {
        if (!lineasMochila.length) {
          abrirDialogo("La mochila está vacía.");
          return;
        }
        setSelMochila(0);
        setVista("mochila");
        return;
      }
      if (op === "GUARDAR") {
        void ejecutarGuardar();
        return;
      }
      if (op === "OPCIONES") {
        setSelOpciones(0);
        setPrefs(leerOpcionesCliente());
        setVista("opciones");
        return;
      }
      if (op === "SALIR") {
        cerrarTodo();
      }
    },
    [abrirDialogo, cerrarTodo, equipo.length, ejecutarGuardar, lineasMochila.length],
  );

  useEffect(() => {
    const manejar = (e) => {
      if (guardando) return;

      if (dialogo) {
        if (esTeclaAceptar(e.code) || esTeclaAtras(e.code)) {
          e.preventDefault();
          setDialogo(null);
        }
        return;
      }

      if (vista === "principal") {
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelPrincipal((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelPrincipal((i) => Math.min(OPCIONES.length - 1, i + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          accionPrincipal(selPrincipal);
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          cerrarTodo();
        }
        return;
      }

      if (vista === "mochila") {
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelMochila((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelMochila((i) => Math.min(lineasMochila.length - 1, i + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          const it = lineasMochila[selMochilaSafe];
          if (it) {
            abrirDialogo(`${it.nombre}\n\nCantidad: ${it.cantidad}\n\n(Usar en combate\npróximamente.)`);
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          volverPrincipal();
        }
        return;
      }

      if (vista === "opciones") {
        const filas = 3;
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelOpciones((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelOpciones((i) => Math.min(filas - 1, i + 1));
        } else if (esTeclaIzquierda(e.code) || esTeclaDerecha(e.code)) {
          e.preventDefault();
          const dir = esTeclaDerecha(e.code) ? 1 : -1;
          if (selOpciones === 0) {
            const next = pasoBgmPercent(prefs.bgmPercent, dir);
            setPrefs(escribirOpcionesCliente({ bgmPercent: next }));
          } else if (selOpciones === 1) {
            if (dir !== 0) {
              setPrefs(escribirOpcionesCliente({ sfxOn: !prefs.sfxOn }));
            }
          } else if (selOpciones === 2) {
            if (dir !== 0) {
              setPrefs(escribirOpcionesCliente({ textoRapido: !prefs.textoRapido }));
            }
          }
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          if (selOpciones === 0) {
            const next = pasoBgmPercent(prefs.bgmPercent, 1);
            setPrefs(escribirOpcionesCliente({ bgmPercent: next }));
          } else if (selOpciones === 1) {
            setPrefs(escribirOpcionesCliente({ sfxOn: !prefs.sfxOn }));
          } else if (selOpciones === 2) {
            setPrefs(escribirOpcionesCliente({ textoRapido: !prefs.textoRapido }));
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          volverPrincipal();
        }
        return;
      }

      if (vista === "equipo") {
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelEquipo((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelEquipo((i) => Math.min(equipo.length - 1, i + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          const p = equipo[selEquipo];
          if (p) {
            const nom = p.nombre || "???";
            const apo = p.nombreApodo && p.nombreApodo !== nom ? p.nombreApodo : null;
            abrirDialogo(
              `${apo ? `${apo} (${nom})` : nom}\nNv.${p.nivel || 5}\nHP ${p.hpActual ?? p.hpMax ?? 20}/${p.hpMax ?? 20}\n\nResumen completo\npróximamente.`,
            );
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          volverPrincipal();
        }
      }
    };

    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [
    accionPrincipal,
    cerrarTodo,
    dialogo,
    equipo,
    guardando,
    lineasMochila,
    prefs,
    selEquipo,
    selMochilaSafe,
    selOpciones,
    selPrincipal,
    vista,
    volverPrincipal,
    abrirDialogo,
  ]);

  const hint = (() => {
    if (dialogo || guardando) return "Z / Enter / X · continuar";
    if (vista === "principal") return "↑↓ · Z aceptar · X cerrar";
    if (vista === "equipo") return "↑↓ · Z resumen · X menú";
    if (vista === "mochila") return "↑↓ · Z detalle · X menú";
    if (vista === "opciones") return "↑↓ · ←→ o Z · X menú";
    return "";
  })();

  return (
    <div className="menu-ingame-root" role="dialog" aria-modal="true">
      <div className="menu-ingame-backdrop" aria-hidden />

      {vista === "principal" && (
        <div className="menu-ingame-panel">
          <div className="menu-ingame-title">MENÚ</div>
          {OPCIONES.map((label, i) => (
            <div
              key={label}
              className={`menu-ingame-row${i === selPrincipal ? " menu-ingame-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{i === selPrincipal ? "▶" : ""}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {vista === "mochila" && (
        <div className="menu-ingame-full menu-ingame-full--bag">
          <div className="menu-ingame-full-title">MOCHILA</div>
          <div className="menu-ingame-scroll menu-ingame-scroll--bag">
            {lineasMochila.map((l, i) => (
              <div
                key={l.clave}
                className={`menu-ingame-mochila-row${i === selMochilaSafe ? " menu-ingame-mochila-row--active" : ""}`}
              >
                <span className="menu-ingame-cursor">{i === selMochilaSafe ? "▶" : ""}</span>
                <span className="menu-ingame-mochila-nombre">{l.nombre}</span>
                <span className="menu-ingame-mochila-cant">×{l.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vista === "equipo" && (
        <div className="menu-ingame-full menu-ingame-full--team">
          <div className="menu-ingame-full-title">POKÉMON</div>
          <div className="menu-ingame-team-list">
            {equipo.map((p, i) => {
              const nombreEspecie = p.nombre || "???";
              const apodo = p.nombreApodo && p.nombreApodo !== nombreEspecie ? p.nombreApodo : null;
              const etiqueta = apodo || nombreEspecie;
              const nv = p.nivel || 5;
              const hpA = p.hpActual ?? p.hpMax ?? 20;
              const hpM = p.hpMax ?? 20;
              const ratio = hpRatio(hpA, hpM);
              return (
                <div
                  key={`slot-${i}`}
                  className={`menu-ingame-team-slot${i === selEquipo ? " menu-ingame-team-slot--active" : ""}`}
                >
                  <div className="menu-ingame-team-slot-head">
                    <span className="menu-ingame-cursor">{i === selEquipo ? "▶" : ""}</span>
                    <span className="menu-ingame-team-slot-num">{i + 1}</span>
                    <div className="menu-ingame-team-slot-names">
                      <div className="menu-ingame-team-etiqueta">{etiqueta}</div>
                      {apodo && (
                        <div className="menu-ingame-team-sub">{nombreEspecie}</div>
                      )}
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
          {pokemonActivo && (
            <div className="menu-ingame-detail menu-ingame-detail--team">
              {pokemonActivo.tipo1 && (
                <div className="menu-ingame-detail-line">
                  <span className="menu-ingame-detail-k">Tipo</span>
                  <span>
                    {pokemonActivo.tipo1}
                    {pokemonActivo.tipo2 ? ` / ${pokemonActivo.tipo2}` : ""}
                  </span>
                </div>
              )}
              <div className="menu-ingame-detail-line">
                <span className="menu-ingame-detail-k">Ataque</span>
                <span>{pokemonActivo.ataque ?? 12}</span>
                <span className="menu-ingame-detail-k">Defensa</span>
                <span>{pokemonActivo.defensa ?? 10}</span>
              </div>
              <div className="menu-ingame-detail-line">
                <span className="menu-ingame-detail-k">Veloc.</span>
                <span>{pokemonActivo.velocidad ?? 8}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {vista === "opciones" && (
        <div className="menu-ingame-full menu-ingame-full--opts">
          <div className="menu-ingame-full-title">OPCIONES</div>
          <div className="menu-ingame-opciones-list">
            <div
              className={`menu-ingame-opcion-row${selOpciones === 0 ? " menu-ingame-opcion-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{selOpciones === 0 ? "▶" : ""}</span>
              <span className="menu-ingame-opcion-label">Música</span>
              <span className="menu-ingame-opcion-valor">{prefs.bgmPercent}%</span>
            </div>
            <div
              className={`menu-ingame-opcion-row${selOpciones === 1 ? " menu-ingame-opcion-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{selOpciones === 1 ? "▶" : ""}</span>
              <span className="menu-ingame-opcion-label">Sonidos</span>
              <span className="menu-ingame-opcion-valor">{prefs.sfxOn ? "SÍ" : "NO"}</span>
            </div>
            <div
              className={`menu-ingame-opcion-row${selOpciones === 2 ? " menu-ingame-opcion-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{selOpciones === 2 ? "▶" : ""}</span>
              <span className="menu-ingame-opcion-label">Texto</span>
              <span className="menu-ingame-opcion-valor">{prefs.textoRapido ? "RÁPIDO" : "NORMAL"}</span>
            </div>
          </div>
          <p className="menu-ingame-opciones-nota">← → o Z en la fila</p>
        </div>
      )}

      {guardando && (
        <div className="dialogo-retro-caja dialogo-retro-caja--flotante dialogo-retro-caja--menuOverlay menu-ingame-saving">
          Guardando…
        </div>
      )}

      {dialogo && !guardando && (
        <div className="dialogo-retro-caja dialogo-retro-caja--flotante dialogo-retro-caja--menuOverlay">
          {dialogo}
        </div>
      )}

      <div className="menu-ingame-hint">{hint}</div>
    </div>
  );
};

export default MenuIngameReact;
