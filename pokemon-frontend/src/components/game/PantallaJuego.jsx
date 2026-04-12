import { useEffect, useMemo, useRef, useState } from "react";
import hoOhSprite from "../../assets/game/title/raw/title_ho_oh_fly.gif";
import titleTheme from "../../assets/game/audio/bgm/title_screen_gold_silver.mp3";
import menuFrameImg from "../../assets/game/title/menu/title_menu_frame_01.png";
import menuCursorImg from "../../assets/game/title/menu/title_menu_cursor_01.png";
import menuHighlightImg from "../../assets/game/title/menu/title_menu_highlight_01.png";
import menuTextsEs from "../../assets/game/title/texts/menu_texts.es.json";
import menuTextsEn from "../../assets/game/title/texts/menu_texts.en.json";
import { textosPanelOpciones } from "../../config/textosOpcionesUi";
import logoPokemonSvg from "../../assets/game/title/pokemon_logo.svg";
import { hayGuardadoLocalContinuable } from "../../store/usarJuegoStore";
import { usarAutenticacionStore } from "../../store/usarAutenticacionStore";
import PuenteApi from "../../phaser/puentes/PuenteApi";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaIzquierda,
  esTeclaDerecha,
  esTeclaArriba,
} from "../../config/controlesJuego";
import {
  leerOpcionesCliente,
  escribirOpcionesCliente,
  pasoBgmPercent,
  volumenBgmParaPhaser,
} from "../../config/opcionesCliente";
import "./PantallaJuego.css";

/** @param {unknown} data Respuesta de GET /juego/estado */
function estadoServidorTieneProgreso(data) {
  if (!data || typeof data !== "object") return false;
  const team = Array.isArray(data.team) ? data.team : [];
  if (team.length > 0) return true;
  const ec = data.estadoCliente;
  if (ec && typeof ec === "object") {
    if (ec.starterElegido) return true;
    if (ec.hasStarter) return true;
    if (ec.partidaRecienteTitulo === true) return true;
    const tc = ec.teamCliente;
    if (Array.isArray(tc) && tc.length > 0) return true;
  }
  return false;
}

// Manejar PantallaJuego.
const PantallaJuego = ({ onStart, onContinue }) => {
  // Referencias para controlar la música del título.
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  const [audioStarted, setAudioStarted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [panelOpcionesTitulo, setPanelOpcionesTitulo] = useState(false);
  /** Opciones del menú (CONTINUAR / NUEVA PARTIDA / …) solo tras Z o Enter. */
  const [menuOpcionesVisible, setMenuOpcionesVisible] = useState(false);
  const [prefsTitulo, setPrefsTitulo] = useState(() => leerOpcionesCliente());
  const [selOpcionesTitulo, setSelOpcionesTitulo] = useState(0);

  const token = usarAutenticacionStore((s) => s.token);
  /** undefined = aún no comprobado (solo con sesión); true/false = resultado del GET */
  const [servidorTieneProgreso, setServidorTieneProgreso] = useState(undefined);
  const [epochGuardadoLocal, setEpochGuardadoLocal] = useState(0);

  useEffect(() => {
    const alGuardarLocal = () => setEpochGuardadoLocal((n) => n + 1);
    window.addEventListener("bytes-guardado-local", alGuardarLocal);
    return () => window.removeEventListener("bytes-guardado-local", alGuardarLocal);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void PuenteApi.getEstadoJugador()
      .then((data) => {
        if (!cancelled) setServidorTieneProgreso(estadoServidorTieneProgreso(data));
      })
      .catch(() => {
        if (!cancelled) setServidorTieneProgreso(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const puedeContinuar = useMemo(() => {
    void epochGuardadoLocal;
    return (
      hayGuardadoLocalContinuable() || (Boolean(token) && servidorTieneProgreso === true)
    );
  }, [token, servidorTieneProgreso, epochGuardadoLocal]);

  const menuTexts = prefsTitulo.locale === "en" ? menuTextsEn : menuTextsEs;
  const menuOptions = puedeContinuar ? menuTexts.with_save : menuTexts.no_save;
  const tOpcTitulo = useMemo(
    () => textosPanelOpciones(prefsTitulo.locale === "en" ? "en" : "es"),
    [prefsTitulo.locale],
  );

  const indiceMenuSeguro = Math.min(selectedIndex, Math.max(0, menuOptions.length - 1));

  useEffect(() => {
    // música y el desbloqueo por interacción del usuario.
    const audio = new Audio(titleTheme);
    audio.loop = true;
    audio.preload = "auto";
    const aplicarVolumenBgm = () => {
      audio.volume = volumenBgmParaPhaser();
    };
    aplicarVolumenBgm();
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

    window.addEventListener("bytes-opciones-audio", aplicarVolumenBgm);

    audio.load();
    void desbloquearYReproducir();

    document.addEventListener("pointerdown", desbloquearYReproducir);
    document.addEventListener("click", desbloquearYReproducir);
    document.addEventListener("touchstart", desbloquearYReproducir, { passive: true });
    document.addEventListener("keydown", desbloquearYReproducir);
    window.addEventListener("focus", desbloquearYReproducir);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      window.removeEventListener("bytes-opciones-audio", aplicarVolumenBgm);
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
    const manejarTecla = (event) => {
      if (panelOpcionesTitulo) {
        if (esTeclaAtras(event.code) || event.code === "Escape") {
          event.preventDefault();
          setPanelOpcionesTitulo(false);
          return;
        }
        const filas = 4;
        if (esTeclaArriba(event.code)) {
          event.preventDefault();
          setSelOpcionesTitulo((i) => Math.max(0, i - 1));
          return;
        }
        if (esTeclaAbajo(event.code)) {
          event.preventDefault();
          setSelOpcionesTitulo((i) => Math.min(filas - 1, i + 1));
          return;
        }
        if (esTeclaIzquierda(event.code) || esTeclaDerecha(event.code)) {
          event.preventDefault();
          const dir = esTeclaDerecha(event.code) ? 1 : -1;
          if (selOpcionesTitulo === 0) {
            const next = pasoBgmPercent(prefsTitulo.bgmPercent, dir);
            setPrefsTitulo(escribirOpcionesCliente({ bgmPercent: next }));
          } else if (selOpcionesTitulo === 1) {
            setPrefsTitulo(escribirOpcionesCliente({ sfxOn: !prefsTitulo.sfxOn }));
          } else if (selOpcionesTitulo === 2) {
            setPrefsTitulo(escribirOpcionesCliente({ textoRapido: !prefsTitulo.textoRapido }));
          } else if (selOpcionesTitulo === 3) {
            const nextLoc = prefsTitulo.locale === "es" ? "en" : "es";
            setPrefsTitulo(escribirOpcionesCliente({ locale: nextLoc }));
          }
          return;
        }
        if (esTeclaAceptar(event.code)) {
          event.preventDefault();
          if (selOpcionesTitulo === 0) {
            const next = pasoBgmPercent(prefsTitulo.bgmPercent, 1);
            setPrefsTitulo(escribirOpcionesCliente({ bgmPercent: next }));
          } else if (selOpcionesTitulo === 1) {
            setPrefsTitulo(escribirOpcionesCliente({ sfxOn: !prefsTitulo.sfxOn }));
          } else if (selOpcionesTitulo === 2) {
            setPrefsTitulo(escribirOpcionesCliente({ textoRapido: !prefsTitulo.textoRapido }));
          } else {
            const nextLoc = prefsTitulo.locale === "es" ? "en" : "es";
            setPrefsTitulo(escribirOpcionesCliente({ locale: nextLoc }));
          }
        }
        return;
      }

      if (!menuOpcionesVisible) {
        if (esTeclaAceptar(event.code)) {
          event.preventDefault();
          setMenuOpcionesVisible(true);
        }
        return;
      }

      if (esTeclaArriba(event.code)) {
        event.preventDefault();
        setSelectedIndex((prev) => {
          const i = Math.min(Math.max(0, prev), Math.max(0, menuOptions.length - 1));
          return (i - 1 + menuOptions.length) % menuOptions.length;
        });
        return;
      }

      if (esTeclaAbajo(event.code)) {
        event.preventDefault();
        setSelectedIndex((prev) => {
          const i = Math.min(Math.max(0, prev), Math.max(0, menuOptions.length - 1));
          return (i + 1) % menuOptions.length;
        });
        return;
      }

      if (esTeclaAceptar(event.code)) {
        event.preventDefault();
        if (puedeContinuar) {
          if (indiceMenuSeguro === 0) {
            onContinue?.();
            return;
          }
          if (indiceMenuSeguro === 1) {
            onStart?.();
            return;
          }
          if (indiceMenuSeguro === 2) {
            setPrefsTitulo(leerOpcionesCliente());
            setSelOpcionesTitulo(0);
            setPanelOpcionesTitulo(true);
            return;
          }
        } else {
          if (indiceMenuSeguro === 0) {
            onStart?.();
            return;
          }
          if (indiceMenuSeguro === 1) {
            setPrefsTitulo(leerOpcionesCliente());
            setSelOpcionesTitulo(0);
            setPanelOpcionesTitulo(true);
            return;
          }
        }
        return;
      }
    };

    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [
    menuOptions,
    menuOpcionesVisible,
    onContinue,
    onStart,
    indiceMenuSeguro,
    panelOpcionesTitulo,
    prefsTitulo,
    puedeContinuar,
    selOpcionesTitulo,
  ]);

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

      {menuOpcionesVisible && (
        <div className="gs-menu-wrap">
          <div className="gs-menu-frame" style={{ backgroundImage: `url(${menuFrameImg})` }}>
            {menuOptions.map((option, index) => (
              <div key={option} className="gs-menu-row">
                {index === indiceMenuSeguro && (
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

      {panelOpcionesTitulo && (
        <div className="gs-title-opciones-overlay" role="dialog" aria-modal="true">
          <div className="gs-title-opciones-panel">
            <div className="gs-title-opciones-heading">{tOpcTitulo.titulo}</div>
            <div
              className={`gs-title-opciones-row${selOpcionesTitulo === 0 ? " gs-title-opciones-row--active" : ""}`}
            >
              <span className="gs-title-opciones-cursor" aria-hidden>
                {selOpcionesTitulo === 0 ? "▶" : ""}
              </span>
              <span className="gs-title-opciones-label">{tOpcTitulo.musica}</span>
              <span className="gs-title-opciones-valor">{prefsTitulo.bgmPercent}%</span>
            </div>
            <div
              className={`gs-title-opciones-row${selOpcionesTitulo === 1 ? " gs-title-opciones-row--active" : ""}`}
            >
              <span className="gs-title-opciones-cursor" aria-hidden>
                {selOpcionesTitulo === 1 ? "▶" : ""}
              </span>
              <span className="gs-title-opciones-label">{tOpcTitulo.sonidos}</span>
              <span className="gs-title-opciones-valor">
                {prefsTitulo.sfxOn ? tOpcTitulo.sonidoSi : tOpcTitulo.sonidoNo}
              </span>
            </div>
            <div
              className={`gs-title-opciones-row${selOpcionesTitulo === 2 ? " gs-title-opciones-row--active" : ""}`}
            >
              <span className="gs-title-opciones-cursor" aria-hidden>
                {selOpcionesTitulo === 2 ? "▶" : ""}
              </span>
              <span className="gs-title-opciones-label">{tOpcTitulo.texto}</span>
              <span className="gs-title-opciones-valor">
                {prefsTitulo.textoRapido ? tOpcTitulo.textoVelRapido : tOpcTitulo.textoVelNormal}
              </span>
            </div>
            <div
              className={`gs-title-opciones-row${selOpcionesTitulo === 3 ? " gs-title-opciones-row--active" : ""}`}
            >
              <span className="gs-title-opciones-cursor" aria-hidden>
                {selOpcionesTitulo === 3 ? "▶" : ""}
              </span>
              <span className="gs-title-opciones-label">{tOpcTitulo.idioma}</span>
              <span className="gs-title-opciones-valor">{prefsTitulo.locale === "en" ? "EN" : "ES"}</span>
            </div>
            <p className="gs-title-opciones-hint">{tOpcTitulo.hintOpciones}</p>
          </div>
        </div>
      )}

      <div className="gs-title-footer">(C)2000 GAME FREAK inc.</div>
      <div className="gs-title-scanlines" />
    </div>
  );
};

export default PantallaJuego;

