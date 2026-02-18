import { useEffect, useMemo, useRef, useState } from "react";
import hoOhSprite from "../../assets/game/title/raw/title_ho_oh_fly.gif";
import titleTheme from "../../assets/game/audio/bgm/title_screen_gold_silver.mp3";
import menuFrameImg from "../../assets/game/title/menu/title_menu_frame_01.png";
import menuCursorImg from "../../assets/game/title/menu/title_menu_cursor_01.png";
import menuHighlightImg from "../../assets/game/title/menu/title_menu_highlight_01.png";
import menuTexts from "../../assets/game/title/texts/menu_texts.es.json";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaIzquierda,
  esTeclaDerecha,
  esTeclaArriba,
} from "../../config/controlesJuego";
import "./PantallaJuego.css";

// Logo oficial para la pantalla de título.
const LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg";

// Manejar PantallaJuego.
const PantallaJuego = ({ onStart }) => {
  // Referencias para controlar la música del título.
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  // "phase" cambia entre título y menú.
  const [audioStarted, setAudioStarted] = useState(false);
  const [phase, setPhase] = useState("title");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Detectar si hay partida guardada para mostrar CONTINUE .
  const hasSave = useMemo(() => {
    if (typeof window === "undefined") return false;

    const saveKeys = [
      "pokemon_bytes_save",
      "pokemon-bytes-save",
      "pokemon_bytes_game_state",
      "pokemon-game-save",
    ];

    return saveKeys.some((key) => {
      const value = window.localStorage.getItem(key);
      return value && value.trim().length > 0;
    });
  }, []);

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
    // Controles del menú principal.
    const manejarTecla = (event) => {
      if (phase === "title") {
        if (esTeclaAceptar(event.code)) {
          event.preventDefault();
          setPhase("menu");
          setSelectedIndex(0);
        }
        return;
      }

      if (phase !== "menu") return;

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
        if (currentOption === "NUEVA PARTIDA") {
          onStart?.();
        }
        return;
      }

      if (esTeclaAtras(event.code)) {
        event.preventDefault();
        setPhase("title");
        setSelectedIndex(0);
      }
    };

    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [menuOptions, onStart, phase, selectedIndex]);

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
        <img src={LOGO_URL} alt="Pokemon" className="gs-title-logo" />
        <span className="gs-title-gold">GOLD VERSION</span>
      </div>

      <div className="gs-hooh-track">
        <img src={hoOhSprite} alt="Ho-Oh" className="gs-hooh" />
      </div>
      {phase === "title" && <span className="gs-press-start">PRESS START</span>}

      {phase === "menu" && (
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
      )}

      <div className="gs-title-footer">(C)2000 GAME FREAK inc.</div>
      <div className="gs-title-scanlines" />
    </div>
  );
};

export default PantallaJuego;

