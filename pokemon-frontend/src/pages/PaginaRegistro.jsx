import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { servicioAutenticacion } from "../services/autenticacion.servicios";
import cyndaquilGif from "../assets/ui/sprites/crystal/Cyndaquil_cristal.gif";
import totodileGif from "../assets/ui/sprites/crystal/Totodile_cristal.gif";
import chikoritaGif from "../assets/ui/sprites/crystal/Chikorita_cristal.gif";

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

// Manejo de  PokeballSvg.
const PokeballSvg = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <circle cx="50" cy="50" r="46" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <path d="M4 50h92" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <circle cx="50" cy="50" r="12" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <circle cx="50" cy="50" r="6" fill="var(--gbc-text-dark)" />
  </svg>
);

const STARTER_SPRITES = [
  { name: "Cyndaquil", src: cyndaquilGif, delay: 0 },
  { name: "Totodile", src: totodileGif, delay: 0.15 },
  { name: "Chikorita", src: chikoritaGif, delay: 0.3 },
];

const REGISTER_TAGS = ["NEW TRAINER", "SECURE", "JOHTO", "ONLINE"];

const REGISTER_TIPS = [
  "Elige un username unico para tu aventura",
  "Usa una clave de al menos 6 caracteres",
  "Confirma la clave antes de crear la cuenta",
  "Despues del registro entraras al iniciarSesion",
];

const AURORA_BLOBS = [
  {
    w: 420,
    h: 210,
    t: "-14%",
    l: "-12%",
    color: "rgba(255, 170, 70, 0.24)",
    opacity: 0.78,
    dx: 20,
    dy: -12,
    duration: 12,
    delay: 0,
  },
  {
    w: 370,
    h: 190,
    b: "-12%",
    r: "-8%",
    color: "rgba(70, 210, 255, 0.20)",
    opacity: 0.76,
    dx: -20,
    dy: 12,
    duration: 14,
    delay: 1,
  },
  {
    w: 280,
    h: 150,
    t: "24%",
    l: "56%",
    color: "rgba(255, 99, 132, 0.14)",
    opacity: 0.6,
    dx: -14,
    dy: -10,
    duration: 16,
    delay: 2,
  },
];

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

// Cargar datos.
const obtenerFuerzaContrasena = (value) => {
  if (!value) return 0;

  let score = 0;
  if (value.length >= 6) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  return score;
};

// Manejar etiquetaFuerza.
const etiquetaFuerza = (score) => {
  if (score <= 1) return "Debil";
  if (score === 2) return "Media";
  if (score === 3) return "Fuerte";
  return "Elite";
};

// Preparar el envío de datos del formulario.
const PaginaRegistro = () => {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const stars = useMemo(() => generarEstrellas(32), []);
  const comets = useMemo(() => generarCometas(6), []);
  const passwordScore = obtenerFuerzaContrasena(password);
  const canSubmit =
    !loading &&
    username.trim().length >= 3 &&
    password.length >= 6 &&
    password === confirmPassword &&
    !success;

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % REGISTER_TIPS.length);
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Si el jugador pulsa algo, se gestiona aquí.
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      setError("El username debe tener al menos 3 caracteres.");
      return;
    }
    if (password.length < 6) {
      setError("La password debe tener minimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("La confirmacion no coincide con la password.");
      return;
    }

    setLoading(true);

    try {
      const response = await servicioAutenticacion.registrar(cleanUsername, password);
      const backendMessage =
        typeof response?.data === "string" ? response.data : `Cuenta creada para ${cleanUsername}.`;

      setSuccess(backendMessage);
      redirectTimeoutRef.current = setTimeout(() => {
        navigate("/iniciarSesion", {
          replace: true,
          state: { registrationSuccess: true, registeredUsername: cleanUsername },
        });
      }, 1400);
    } catch (err) {
      const backendData = err?.response?.data;
      const message =
        typeof backendData === "string"
          ? backendData
          : backendData?.message || err?.message || "Error al registrar. Intenta de nuevo.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg register2-page">
      <div className="register2-nebula-layer" aria-hidden="true">
        {AURORA_BLOBS.map((blob, i) => (
          <motion.div
            key={i}
            className="register2-nebula"
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
        className="register2-shell-halo"
        animate={{ opacity: [0.5, 0.75, 0.5], scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      />

      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="bg-star register2-star"
          style={{ width: s.w, height: s.w, left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ opacity: [0.1, 0.55, 0.1] }}
          transition={{ repeat: Infinity, duration: s.dur, delay: s.del }}
        />
      ))}

      {comets.map((c, i) => (
        <motion.div
          key={i}
          className="register2-comet"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          animate={{ x: [0, c.travel], y: [0, c.travel * 0.28], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: c.dur, delay: c.del, ease: "easeOut" }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="register2-title-wrap"
      >
        <h1 className="register2-main-title">NEW TRAINER REGISTRY</h1>
        <h2 className="register2-main-subtitle">Pokemon Bytes</h2>
        <div className="register2-tag-row">
          {REGISTER_TAGS.map((tag) => (
            <span key={tag} className="register2-tag">
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
            <div className="iniciarSesion-screen register2-screen">
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
                <motion.div {...aparecer(0.1)} className="screen-content register2-header">
                  <div className="register2-starter-row">
                    {STARTER_SPRITES.map((starter) => (
                      <motion.img
                        key={starter.name}
                        src={starter.src}
                        alt={starter.name}
                        className="register2-starter-sprite"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: starter.delay, ease: "easeInOut" }}
                      />
                    ))}
                  </div>

                  <h1 className="register2-title">Create Trainer</h1>
                  <p className="register2-subtitle">Configura tu cuenta para empezar la aventura</p>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={tipIndex}
                      className="register2-tip"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                      {REGISTER_TIPS[tipIndex]}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>

                {success && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="register2-success">
                    {success}
                  </motion.div>
                )}

                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="iniciarSesion-error">
                    {`[ ${error} ]`}
                  </motion.div>
                )}

                <motion.form {...deslizarArriba(0.2)} onSubmit={manejarEnvio} className="iniciarSesion-form register2-form">
                  <div className="iniciarSesion-field">
                    <label htmlFor="registrar-username" className="gbc-input-label">
                      Username
                    </label>
                    <input
                      id="registrar-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Red_Gyarados"
                      autoComplete="username"
                      className="gbc-input"
                    />
                  </div>

                  <div className="iniciarSesion-field">
                    <label htmlFor="registrar-password" className="gbc-input-label">
                      Password
                    </label>
                    <input
                      id="registrar-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="........"
                      autoComplete="new-password"
                      className="gbc-input"
                    />
                  </div>

                  <div className={`register2-strength register2-strength--${passwordScore}`}>
                    <div className="register2-strength-top">
                      <span className="register2-strength-label">Nivel de seguridad</span>
                      <span className="register2-strength-value">{etiquetaFuerza(passwordScore)}</span>
                    </div>
                    <div className="register2-strength-bars">
                      {[...Array(4)].map((_, i) => (
                        <span key={i} className={`register2-strength-bar ${i < passwordScore ? "is-active" : ""}`} />
                      ))}
                    </div>
                  </div>

                  <div className="iniciarSesion-field">
                    <label htmlFor="registrar-confirm" className="gbc-input-label">
                      Confirm Password
                    </label>
                    <input
                      id="registrar-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="........"
                      autoComplete="new-password"
                      className="gbc-input"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={!canSubmit}
                    whileHover={canSubmit ? { scale: 1.02 } : {}}
                    whileTap={canSubmit ? { scale: 0.98 } : {}}
                    className="iniciarSesion-btn register2-btn"
                  >
                    {loading ? (
                      <span className="loading-dots">
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                      </span>
                    ) : (
                      "> Crear Cuenta"
                    )}
                  </motion.button>
                </motion.form>

                <motion.div {...aparecer(0.45)} className="register2-footer-note">
                  Tu perfil quedara listo para iniciar sesion
                </motion.div>

                <motion.div {...aparecer(0.5)} className="register2-links">
                  <Link to="/iniciarSesion" className="register2-link">
                    {"< Ya tengo cuenta"}
                  </Link>
                  <Link to="/" className="register2-link register2-link--ghost">
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

export default PaginaRegistro;

