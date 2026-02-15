import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { servicioAutenticacion } from "../services/autenticacion.servicios";
import { usarAutenticacionStore } from "../store/usarAutenticacionStore";
import pikachuGif from "../assets/ui/sprites/crystal/Pikachu_cristal.gif";

const SPRITES = {
  pikachu: pikachuGif,
};

const aparecer = (d = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, delay: d },
});

const deslizarArriba = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: d, ease: "easeOut" },
});

const PantallaLineas = () => <div className="screen-scanlines" />;
const PantallaPixeles = () => <div className="screen-pixel-grid" />;

// ManejoPokeballSvg.
const PokeballSvg = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <circle cx="50" cy="50" r="46" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <path d="M4 50h92" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <circle cx="50" cy="50" r="12" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <circle cx="50" cy="50" r="6" fill="var(--gbc-text-dark)" />
  </svg>
);

const generarEstrellas = (n) =>
  Array.from({ length: n }, () => ({
    w: Math.random() * 2 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dur: Math.random() * 3 + 2,
    del: Math.random() * 2,
  }));

const generarCometas = (n) =>
  Array.from({ length: n }, () => ({
    x: Math.random() * 95,
    y: Math.random() * 65 + 5,
    dur: Math.random() * 2 + 2.8,
    del: Math.random() * 8,
    travel: Math.random() * 90 + 70,
  }));

const LOGIN_TAGS = ["SECURE", "JOHTO-NET", "JWT", "ONLINE"];

const LOGIN_TIPS = [
  "Usa tu cuenta de entrenador registrada",
  "Tu sesion viaja protegida con JWT",
  "Si falla, revisa usuario y password",
  "Pulsa iniciar sesion para entrar al juego",
];

const AURORA_BLOBS = [
  {
    w: 420,
    h: 210,
    t: "-12%",
    l: "-10%",
    color: "rgba(70, 175, 255, 0.28)",
    opacity: 0.8,
    dx: 20,
    dy: -12,
    duration: 12,
    delay: 0,
  },
  {
    w: 360,
    h: 180,
    b: "-14%",
    r: "-8%",
    color: "rgba(110, 95, 255, 0.24)",
    opacity: 0.75,
    dx: -18,
    dy: 14,
    duration: 14,
    delay: 1,
  },
  {
    w: 300,
    h: 160,
    t: "22%",
    l: "58%",
    color: "rgba(0, 255, 200, 0.14)",
    opacity: 0.6,
    dx: -12,
    dy: -8,
    duration: 16,
    delay: 2,
  },
];

// Preparar el envío de datos del formulario.
const PaginaAcceso = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [registerNotice, setRegisterNotice] = useState("");

  const stars = useMemo(() => generarEstrellas(30), []);
  const comets = useMemo(() => generarCometas(6), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOGIN_TIPS.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!location.state?.registrationSuccess) return;

    const notice = location.state?.registeredUsername
      ? `Cuenta creada para ${location.state.registeredUsername}. Inicia sesion para continuar.`
      : "Cuenta creada. Inicia sesion para continuar.";

    setRegisterNotice(notice);
    navigate(location.pathname, { replace: true, state: null });

    const timer = setTimeout(() => setRegisterNotice(""), 5500);
    return () => clearTimeout(timer);
  }, [location.pathname, location.state, navigate]);

  // Si el jugador pulsa algo, se gestiona aquí.
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await servicioAutenticacion.iniciarSesion(username, password);
      usarAutenticacionStore.getState().establecerInicioSesion(response.user, response.token);
      navigate("/game");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg login2-page">
      <div className="login2-nebula-layer" aria-hidden="true">
        {AURORA_BLOBS.map((blob, i) => (
          <motion.div
            key={i}
            className="login2-nebula"
            style={{
              width: blob.w,
              height: blob.h,
              top: blob.t,
              left: blob.l,
              right: blob.r,
              bottom: blob.b,
              background: blob.color,
              opacity: blob.opacity,
            }}
            animate={{
              x: [0, blob.dx, 0],
              y: [0, blob.dy, 0],
              scale: [1, 1.06, 1],
              opacity: [blob.opacity * 0.55, blob.opacity, blob.opacity * 0.55],
            }}
            transition={{ repeat: Infinity, duration: blob.duration, delay: blob.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      <motion.div
        className="login2-shell-halo"
        animate={{ opacity: [0.5, 0.75, 0.5], scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      />

      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="bg-star login2-star"
          style={{ width: s.w, height: s.w, left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ opacity: [0.1, 0.55, 0.1] }}
          transition={{ repeat: Infinity, duration: s.dur, delay: s.del }}
        />
      ))}

      {comets.map((c, i) => (
        <motion.div
          key={i}
          className="login2-comet"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          animate={{ x: [0, c.travel], y: [0, c.travel * 0.28], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: c.dur, delay: c.del, ease: "easeOut" }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="login2-title-wrap"
      >
        <h1 className="login2-main-title">TRAINER LOGIN</h1>
        <h2 className="login2-main-subtitle">Pokemon Bytes</h2>
        <div className="login2-tag-row">
          {LOGIN_TAGS.map((tag) => (
            <span key={tag} className="login2-tag">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {[
        { s: 180, t: "-30px", l: "-50px", o: 0.03 },
        { s: 120, b: "15%", r: "-20px", o: 0.025 },
      ].map(({ s, t, l, r, b, o }, i) => (
        <motion.div
          key={i}
          className="pokeball-bg"
          style={{ width: s, height: s, top: t, left: l, right: r, bottom: b, opacity: o }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        >
          <PokeballSvg />
        </motion.div>
      ))}

      <motion.div
        className="gbc-container"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="gbc-shell">
          <div className="gbc-top-row">
            <span className="gbc-label">Game Boy Color</span>
            <div className="gbc-power-row">
              <span className="gbc-power-label">Power</span>
              <motion.div
                className="power-led power-led--on"
                animate={{
                  boxShadow: ["0 0 4px var(--gbc-accent)", "0 0 8px var(--gbc-accent)", "0 0 4px var(--gbc-accent)"],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          </div>

          <div className="gbc-screen-border">
            <div className="iniciarSesion-screen">
              <PantallaLineas />
              <PantallaPixeles />

              <motion.div
                className="pokeball-bg"
                style={{ width: 70, height: 70, bottom: "-10px", right: "-15px", opacity: 0.05 }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
              >
                <PokeballSvg />
              </motion.div>

              <div className="screen-content screen-content--iniciarSesion">
                <motion.div {...aparecer(0.1)} className="screen-content login2-iniciarSesion-header">
                  <motion.img
                    src={SPRITES.pikachu}
                    alt="Pikachu"
                    className="sprite--boot login2-pika"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  />
                  <h1 className="iniciarSesion-title">Trainer Login</h1>
                  <div className="screen-divider">
                    {[...Array(8)].map((_, i) => (
                      <span
                        key={i}
                        className={`screen-divider-dot ${i % 3 === 0 ? "screen-divider-dot--strong" : "screen-divider-dot--soft"}`}
                      />
                    ))}
                  </div>
                  <p className="iniciarSesion-subtitle">Identificate para continuar</p>

                  <div className="login2-status-row">
                    <span className="login2-chip">AUTH LINK</span>
                    <span className="login2-chip login2-chip--accent">JOHTO NET</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={tipIndex}
                      className="login2-tip"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                      {LOGIN_TIPS[tipIndex]}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>

                {registerNotice && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="login2-notice">
                    {registerNotice}
                  </motion.div>
                )}

                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="iniciarSesion-error">
                    {`[ ${error} ]`}
                  </motion.div>
                )}

                <motion.form {...deslizarArriba(0.2)} onSubmit={manejarEnvio} className="iniciarSesion-form login2-form">
                  <div className="iniciarSesion-field">
                    <label htmlFor="username" className="gbc-input-label">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ash_Ketchum"
                      autoComplete="username"
                      className="gbc-input"
                    />
                  </div>

                  <div className="iniciarSesion-field">
                    <label htmlFor="password" className="gbc-input-label">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="........"
                      autoComplete="current-password"
                      className="gbc-input"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !username || !password}
                    whileHover={!loading && username && password ? { scale: 1.02 } : {}}
                    whileTap={!loading && username && password ? { scale: 0.98 } : {}}
                    className="iniciarSesion-btn"
                  >
                    {loading ? (
                      <span className="loading-dots">
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                      </span>
                    ) : (
                      "> Iniciar Sesion"
                    )}
                  </motion.button>
                </motion.form>

                <motion.div {...aparecer(0.35)} className="login2-registrar-cta">
                  <span className="login2-registrar-text">No tienes cuenta?</span>
                  <Link to="/registrar" className="login2-registrar-link">
                    Crear cuenta
                  </Link>
                </motion.div>

                <motion.div {...aparecer(0.45)} className="login2-footer-note">
                  Secure access terminal
                </motion.div>

                <motion.div {...aparecer(0.5)}>
                  <Link to="/" className="iniciarSesion-back-link">
                    {"< Volver al inicio"}
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="gbc-bottom-row">
            <span className="gbc-bottom-label">Pokemon Bytes(TM)</span>
            <span className="gbc-bottom-label gbc-bottom-label--dim">(C) 2026</span>
          </div>

          <div className="gbc-controls-row">
            <div className="dpad">
              <div className="dpad-v dpad-bar" />
              <div className="dpad-h dpad-bar" />
              <div className="dpad-center" />
            </div>
            <div className="ab-row">
              <div className="ab-button">B</div>
              <div className="ab-button ab-button--a">A</div>
            </div>
          </div>

          <div className="select-start-row">
            <div>
              <div className="select-start-bar" />
              <span className="select-start-label">Select</span>
            </div>
            <div>
              <div className="select-start-bar" />
              <span className="select-start-label">Start</span>
            </div>
          </div>

          <div className="speaker-wrap">
            <div className="speaker-lines">
              <div className="speaker-line speaker-line--1" />
              <div className="speaker-line speaker-line--2" />
              <div className="speaker-line speaker-line--3" />
              <div className="speaker-line speaker-line--4" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaginaAcceso;

