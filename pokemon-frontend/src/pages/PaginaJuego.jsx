import { useEffect, useLayoutEffect, useRef, useState } from "react";
import PantallaJuego from "../components/game/PantallaJuego";
import EscenaApertura from "../components/game/EscenaApertura";
import CanvasPhaser from "../components/game/CanvasPhaser";
import MenuIngameReact from "../components/game/MenuIngameReact";
import BattleMenu from "../components/game/BattleMenu";
import BattleMoves from "../components/game/BattleMoves";
import BattleBag from "../components/game/BattleBag";
import BattleParty from "../components/game/BattleParty";
import BattleHud from "../components/game/BattleHud";
import BattleStatusSprite from "../components/game/BattleStatusSprite";
import BattlePlayerBackSprite from "../components/game/BattlePlayerBackSprite";
import {
  SAVE_STORAGE_KEY,
  hayGuardadoLocalContinuable,
  usarJuegoStore,
} from "../store/usarJuegoStore";
import { usarAutenticacionStore } from "../store/usarAutenticacionStore";
import PuenteApi from "../phaser/puentes/PuenteApi";
import "../components/game/DialogoRetro.css";

function PanelTextoEstaticoReact({ lineas, onCerrar }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const manejar = (e) => {
      if (e.code === "Escape") {
        e.preventDefault();
        onCerrar();
        return;
      }
      if (
        e.code !== "KeyZ" &&
        e.code !== "Enter" &&
        e.code !== "NumpadEnter"
      ) {
        return;
      }
      e.preventDefault();
      if (indice < lineas.length - 1) {
        setIndice((i) => i + 1);
      } else {
        onCerrar();
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [onCerrar, lineas.length, indice]);

  const texto = lineas[indice] ?? "";
  const hayMas = indice < lineas.length - 1;

  return (
    <div className="dialogo-retro-capas" role="dialog" aria-modal="true">
      <div className="dialogo-retro-caja dialogo-retro-caja--panel">
        <p className="dialogo-retro-parrafo">{texto}</p>
      </div>
      <div className="dialogo-retro-hint">
        {hayMas ? "Z / Enter · siguiente" : "Z / Enter · cerrar"}
        {" · Esc"}
      </div>
    </div>
  );
}

// Manejar PaginaJuego.
const PaginaJuego = () => {
  const [scale, setScale] = useState(3);
  const [scene, setScene] = useState("title");
  const [textoEstaticoReact, setTextoEstaticoReact] = useState(null);
  const [menuIngame, setMenuIngame] = useState(null);
  const [battleUi, setBattleUi] = useState(null);
  const [combateActivo, setCombateActivo] = useState(false);
  const gameCallbacksRef = useRef({});
  const textoEstaticoSeqRef = useRef(0);

  useLayoutEffect(() => {
    gameCallbacksRef.current = {
      onCambioPantalla: setScene,
      onTextoEstatico: ({ lineas, onCerrar }) => {
        textoEstaticoSeqRef.current += 1;
        setTextoEstaticoReact({
          lineas,
          onCerrar,
          id: textoEstaticoSeqRef.current,
        });
      },
      onAbrirMenuIngame: ({ resumePhaser }) => {
        setMenuIngame((cur) => (cur ? cur : { resumePhaser }));
      },
      onBatallaUi: (payload) => {
        if (payload == null) {
          setBattleUi(null);
          return;
        }
        setBattleUi((prev) => {
          if (prev && typeof prev === "object") {
            return { ...prev, ...payload };
          }
          return payload;
        });
      },
      onCombateActivo: setCombateActivo,
    };
  }, [setScene, setTextoEstaticoReact, setMenuIngame]);

  useEffect(() => {
    // Si el jugador pulsa algo
    const manejarRedimension = () => {
      const maxScaleW = window.innerWidth / 160;
      const maxScaleH = window.innerHeight / 144;
      const bestScale = Math.floor(Math.min(maxScaleW, maxScaleH));
      setScale(bestScale > 0 ? bestScale : 1);
    };

    window.addEventListener("resize", manejarRedimension);
    manejarRedimension();
    return () => window.removeEventListener("resize", manejarRedimension);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#101010",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 160,
          height: 144,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          boxShadow: "0 0 20px rgba(0,0,0,0.5)",
          backgroundColor: "#000",
          position: "relative",
          overflow: "visible",
        }}
      >
        {scene === "title" && (
          <PantallaJuego
            onStart={() => setScene("opening")}
            onContinue={async () => {
              if (!hayGuardadoLocalContinuable()) return;
              if (!usarJuegoStore.getState().cargarPartidaLocal()) return;
              if (usarAutenticacionStore.getState().token) {
                try {
                  await PuenteApi.sincronizarEstadoDesdeServidor({
                    preservarEstadoJugableLocal: true,
                  });
                  await PuenteApi.guardarJuegoEnServidor(
                    usarJuegoStore.getState().construirPayloadGuardado(),
                    { skipSincronizarTrasGuardar: true },
                  );
                } catch (e) {
                  console.warn("[continuar] sincronizar o guardar blob", e);
                }
              }
              setScene("overworld");
            }}
          />
        )}
        {scene === "opening" && (
          <EscenaApertura
            onContinue={async (nombreJugador) => {
              const nombre = typeof nombreJugador === "string" ? nombreJugador : "";
              if (usarAutenticacionStore.getState().token) {
                try {
                  await PuenteApi.reiniciarPartidaEnServidor();
                } catch (e) {
                  console.error("[nueva partida] reiniciar servidor", e);
                  window.alert(
                    "No se pudo reiniciar la partida en el servidor (inventario, equipo, etc.). " +
                      "Revisa la conexión o vuelve a iniciar sesión. No se ha iniciado la nueva partida.",
                  );
                  return;
                }
              }
              usarJuegoStore.getState().setNuevaPartida(nombre);
              try {
                window.localStorage?.removeItem(SAVE_STORAGE_KEY);
              } catch {
                /* no-op */
              }
              setScene("overworld");
            }}
          />
        )}
        {scene === "overworld" && (
          <div
            style={{
              position: "relative",
              width: 160,
              height: 144,
              overflow: "visible",
            }}
          >
            <CanvasPhaser callbacksRef={gameCallbacksRef} />
            {battleUi && (
              <>
                <BattleStatusSprite
                  spriteEstadoClave={battleUi.spriteEstadoClave ?? "normal"}
                  esDebugCaptura={Boolean(battleUi.esDebugCaptura)}
                />
                <BattlePlayerBackSprite src={battleUi.spriteJugadorCampoUrl} />
                <BattleHud jugador={battleUi.jugador} enemigo={battleUi.enemigo} />
                {battleUi.equipoPicker ? (
                  <BattleParty
                    equipo={battleUi.equipoPicker.equipo}
                    starter={battleUi.equipoPicker.starter}
                    onPick={battleUi.equipoPicker.onPick}
                    onCancel={battleUi.equipoPicker.onCancel}
                  />
                ) : battleUi.mochilaPicker ? (
                  <BattleBag
                    mensaje={battleUi.mensaje}
                    curativos={battleUi.mochilaPicker.curativos}
                    balls={battleUi.mochilaPicker.balls}
                    onPick={battleUi.mochilaPicker.onPick}
                    onCancel={battleUi.mochilaPicker.onCancel}
                  />
                ) : battleUi.movimientosPicker ? (
                  <BattleMoves
                    mensaje={battleUi.mensaje}
                    slots={battleUi.movimientosPicker.slots}
                    onPick={battleUi.movimientosPicker.onPick}
                    onCancel={battleUi.movimientosPicker.onCancel}
                  />
                ) : (
                  <BattleMenu
                    mensaje={battleUi.mensaje}
                    opciones={battleUi.opciones}
                    seleccion={battleUi.seleccion}
                    menuVisible={battleUi.menuVisible}
                    onSeleccion={battleUi.onSeleccion}
                  />
                )}
              </>
            )}
            {textoEstaticoReact && (
              <PanelTextoEstaticoReact
                key={textoEstaticoReact.id}
                lineas={textoEstaticoReact.lineas}
                onCerrar={() => {
                  setTextoEstaticoReact((cur) => {
                    cur?.onCerrar?.();
                    return null;
                  });
                }}
              />
            )}
            {menuIngame && (
              <MenuIngameReact
                onClose={() => {
                  menuIngame.resumePhaser?.();
                  setMenuIngame(null);
                }}
              />
            )}
          </div>
        )}
      </div>

      {!combateActivo && (
        <div
          style={{
            position: "absolute",
            left: 18,
            top: 18,
            zIndex: 20,
            width: "min(42vw, 420px)",
            minWidth: 280,
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid rgba(180, 190, 205, 0.25)",
            background: "rgba(6, 10, 16, 0.58)",
            color: "#a7b4c6",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            lineHeight: 1.95,
            letterSpacing: "0.03em",
            textAlign: "left",
            backdropFilter: "blur(2px)",
            pointerEvents: "none",
          }}
        >
          <div style={{ color: "#d8e0eb", marginBottom: 8 }}>CONTROLES</div>
          <div>ACEPTAR: Z o Enter</div>
          <div>ATRAS: X o Escape</div>
          <div>ARRIBA: W o Flecha Arriba</div>
          <div>IZQUIERDA: A o Flecha Izquierda</div>
          <div>DERECHA: D o Flecha Derecha</div>
          <div>ABAJO: S o Flecha Abajo</div>
        </div>
      )}
    </div>
  );
};

export default PaginaJuego;

