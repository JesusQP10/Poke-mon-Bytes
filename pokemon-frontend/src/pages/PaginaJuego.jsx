import { useEffect, useState } from "react";
import PantallaJuego from "../components/game/PantallaJuego";
import EscenaApertura from "../components/game/EscenaApertura";

// Manejar PaginaJuego.
const PaginaJuego = () => {
  const [scale, setScale] = useState(3);
  const [scene, setScene] = useState("title");

  useEffect(() => {
    // Si el jugador pulsa algo, lo gestiono aquí.
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
        {scene === "title" ? (
          <PantallaJuego onStart={() => setScene("opening")} />
        ) : (
          <EscenaApertura onContinue={() => setScene("title")} />
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

