import { useEffect, useRef, useState } from "react";
import PantallaJuego from "../components/game/PantallaJuego";
import EscenaApertura from "../components/game/EscenaApertura";
import CanvasPhaser from "../components/game/CanvasPhaser";
import { usarJuegoStore } from "../store/usarJuegoStore";
import { usarAutenticacionStore } from "../store/usarAutenticacionStore";
import PuenteApi from "../phaser/puentes/PuenteApi";

function PanelTextoEstaticoReact({ lineas, onCerrar }) {
  useEffect(() => {
    const manejar = (e) => {
      if (
        e.code === "KeyZ" ||
        e.code === "Enter" ||
        e.code === "NumpadEnter" ||
        e.code === "Escape"
      ) {
        e.preventDefault();
        onCerrar();
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "6px 4px 8px",
        background: "linear-gradient(transparent 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.55) 100%)",
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 8,
        lineHeight: 1.65,
        color: "#f8f8f8",
        textShadow: "1px 1px 0 #000",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          background: "rgba(248,248,248,0.95)",
          color: "#101010",
          textShadow: "none",
          border: "2px solid #101010",
          padding: "8px 8px 10px",
          maxHeight: 88,
          overflowY: "auto",
        }}
      >
        {lineas.map((t, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "10px 0 0" }}>
            {t}
          </p>
        ))}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 6,
          color: "#e8ecf2",
          textAlign: "right",
        }}
      >
        Z / Enter · cerrar
      </div>
    </div>
  );
}

// Manejar PaginaJuego.
const PaginaJuego = () => {
  const [scale, setScale] = useState(3);
  const [scene, setScene] = useState("title");
  const [textoEstaticoReact, setTextoEstaticoReact] = useState(null);
  const gameCallbacksRef = useRef({});

  gameCallbacksRef.current = {
    onCambioPantalla: setScene,
    onTextoEstatico: ({ lineas, onCerrar }) => {
      setTextoEstaticoReact({ lineas, onCerrar });
    },
  };

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
          overflow: "hidden",
        }}
      >
        {scene === "title" && (
          <PantallaJuego
            onStart={() => setScene("opening")}
            onContinue={async () => {
              if (usarAutenticacionStore.getState().token) {
                try {
                  await PuenteApi.sincronizarEstadoDesdeServidor();
                  try {
                    usarJuegoStore.getState().guardarPartidaLocal();
                  } catch {
                    /* caché local opcional */
                  }
                  setScene("overworld");
                  return;
                } catch {
                  /* cae al guardado local */
                }
              }
              if (usarJuegoStore.getState().cargarPartidaLocal()) {
                setScene("overworld");
              }
            }}
          />
        )}
        {scene === "opening" && (
          <EscenaApertura onContinue={() => setScene("overworld")} />
        )}
        {scene === "overworld" && (
          <div
            style={{
              position: "relative",
              width: 160,
              height: 144,
            }}
          >
            <CanvasPhaser callbacksRef={gameCallbacksRef} />
            {textoEstaticoReact && (
              <PanelTextoEstaticoReact
                lineas={textoEstaticoReact.lineas}
                onCerrar={() => {
                  setTextoEstaticoReact((cur) => {
                    cur?.onCerrar?.();
                    return null;
                  });
                }}
              />
            )}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default PaginaJuego;

