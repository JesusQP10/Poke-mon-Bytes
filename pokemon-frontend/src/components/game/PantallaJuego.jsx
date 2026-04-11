import { useEffect, useMemo, useRef, useState } from "react";
import hoOhSprite from "../../assets/game/title/raw/title_ho_oh_fly.gif";
import titleTheme from "../../assets/game/audio/bgm/title_screen_gold_silver.mp3";
import menuFrameImg from "../../assets/game/title/menu/title_menu_frame_01.png";
import menuCursorImg from "../../assets/game/title/menu/title_menu_cursor_01.png";
import menuHighlightImg from "../../assets/game/title/menu/title_menu_highlight_01.png";
import menuTexts from "../../assets/game/title/texts/menu_texts.es.json";
import logoPokemonSvg from "../../assets/game/title/pokemon_logo.svg";
import { existePartidaGuardadaLocal } from "../../store/usarJuegoStore";
import { usarAutenticacionStore } from "../../store/usarAutenticacionStore";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaIzquierda,
  esTeclaDerecha,
  esTeclaArriba,
} from "../../config/controlesJuego";
import "./PantallaJuego.css";

// Manejar PantallaJuego.
const PantallaJuego = ({ onStart, onContinue }) => {
  // Referencias para controlar la música del título.
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  const [audioStarted, setAudioStarted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [panelOpcionesTitulo, setPanelOpcionesTitulo] = useState(false);

  const token = usarAutenticacionStore((s) => s.token);
  // Partida local o sesión iniciada (el servidor puede tener progreso aunque no haya caché).
  const hasSave = useMemo(
    () => existePartidaGuardadaLocal() || Boolean(token),
    [token],
  );

  const menuOptions = hasSave ? menuTexts.with_save : menuTexts.no_save;

  useEffect(() => {
    // música y el desbloqueo por interacción del usuario.
    const audio = new Audio(titleTheme);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.8;
    audio.muted = false;
    audioRef.current = audio;

    // Manejar quitarEscuchasDesbloqueo.
    const quitarEscuchasDesbloqueo = () => {
      document.removeEventListener("pointerdown", desbloquearYReproducir);
      document.removeEventListener("click", desbloquearYReproducir);
      document.removeEventListener("touchstart", desbloquearYReproducir);
      document.removeEventListener("keydown", desbloquearYReproducir);
      window.removeEventListener("focus", desbloquearYReproducir);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };

    // Manejar intentarReproducir.
    const intentarReproducir = async () => {
      if (startedRef.current) return true;
      try {
        await audio.play();
        startedRef.current = true;
        setAudioStarted(true);
        return true;
      } catch {
        return false;
      }
    };

    // Manejar desbloquearYReproducir.
    const desbloquearYReproducir = async () => {
      const started = await intentarReproducir();
      if (started) quitarEscuchasDesbloqueo();
    };

    
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") {
        void desbloquearYReproducir();
      }
    };

    audio.load();
    void desbloquearYReproducir();

    document.addEventListener("pointerdown", desbloquearYReproducir);
    document.addEventListener("click", desbloquearYReproducir);
    document.addEventListener("touchstart", desbloquearYReproducir, { passive: true });
    document.addEventListener("keydown", desbloquearYReproducir);
    window.addEventListener("focus", desbloquearYReproducir);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      quitarEscuchasDesbloqueo();
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
      audioRef.current = null;
      startedRef.current = false;
      setAudioStarted(false);
    };
  }, []);

  
  const manejarInicioAudio = async () => {
    // Boton manual por si el navegador bloquea autoplay.
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      startedRef.current = true;
      setAudioStarted(true);
    } catch {
      // No-op
    }
  };

  useEffect(() => {
    // Controles del menú principal (logo + opciones desde el primer frame).
    const manejarTecla = (event) => {
      if (esTeclaArriba(event.code) || esTeclaIzquierda(event.code)) {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
        return;
      }

      if (esTeclaAbajo(event.code) || esTeclaDerecha(event.code)) {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % menuOptions.length);
        return;
      }

      if (esTeclaAceptar(event.code)) {
        event.preventDefault();
        const currentOption = menuOptions[selectedIndex];
        if (currentOption === "CONTINUAR") {
          onContinue?.();
          return;
        }
        if (currentOption === "NUEVA PARTIDA") {
          onStart?.();
          return;
        }
        if (currentOption === "OPCIONES") {
          setPanelOpcionesTitulo(true);
          return;
        }
        return;
      }
    };

    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [menuOptions, onContinue, onStart, selectedIndex]);

  useEffect(() => {
    if (!panelOpcionesTitulo) return;
    const cerrar = (e) => {
      if (
        esTeclaAceptar(e.code) ||
        esTeclaAtras(e.code) ||
        e.code === "Escape"
      ) {
        e.preventDefault();
        setPanelOpcionesTitulo(false);
      }
    };
    document.addEventListener("keydown", cerrar);
    return () => document.removeEventListener("keydown", cerrar);
  }, [panelOpcionesTitulo]);

  return (
    // Render del título + Ho-Oh + menú.
    <div className="gs-title-root">
      {!audioStarted && (
        <button type="button" className="gs-audio-btn" onClick={manejarInicioAudio}>
          AUDIO ON
        </button>
      )}
      <div className="gs-title-bg">
        <div className="gs-sun-glow" />
        <div className="gs-sky-haze gs-sky-haze--top" />
        <div className="gs-sky-haze gs-sky-haze--mid" />

        <div className="gs-cloud gs-cloud--1">
          <span />
          <span />
          <span />
        </div>
        <div className="gs-cloud gs-cloud--2">
          <span />
          <span />
          <span />
        </div>
        <div className="gs-cloud gs-cloud--3">
          <span />
          <span />
          <span />
        </div>
        <div className="gs-cloud gs-cloud--4">
          <span />
          <span />
          <span />
        </div>
        <div className="gs-cloud gs-cloud--5">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="gs-title-logo-wrap">
        <img src={logoPokemonSvg} alt="Pokemon" className="gs-title-logo" decoding="async" />
        <span className="gs-title-gold">GOLD VERSION</span>
      </div>

      <div className="gs-hooh-track">
        <img src={hoOhSprite} alt="Ho-Oh" className="gs-hooh" />
      </div>

      <div className="gs-menu-wrap">
        <div className="gs-menu-frame" style={{ backgroundImage: `url(${menuFrameImg})` }}>
          {menuOptions.map((option, index) => (
            <div key={option} className="gs-menu-row">
              {index === selectedIndex && (
                <>
                  <img src={menuCursorImg} alt="" className="gs-menu-cursor" />
                  <img src={menuHighlightImg} alt="" className="gs-menu-highlight" />
                </>
              )}
              <span className="gs-menu-label">{option}</span>
            </div>
          ))}
        </div>
      </div>

      {panelOpcionesTitulo && (
        <div
          className="gs-title-opciones-overlay"
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            lineHeight: 1.7,
            color: "#f4f4f4",
            textAlign: "center",
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              maxWidth: 280,
              border: "2px solid #bcd",
              background: "rgba(12,18,28,0.92)",
              padding: "14px 16px 18px",
            }}
          >
            <div style={{ marginBottom: 10, color: "#dfe8f5" }}>OPCIONES</div>
            <div style={{ fontSize: 7, color: "#a8b4c4", marginBottom: 12 }}>
              Aún no hay ajustes (volumen, idioma, etc.). Se irán añadiendo aquí.
            </div>
            <div style={{ fontSize: 6, color: "#7a8a9e" }}>Z / Enter / X · cerrar</div>
          </div>
        </div>
      )}

      <div className="gs-title-footer">(C)2000 GAME FREAK inc.</div>
      <div className="gs-title-scanlines" />
    </div>
  );
};

export default PantallaJuego;

