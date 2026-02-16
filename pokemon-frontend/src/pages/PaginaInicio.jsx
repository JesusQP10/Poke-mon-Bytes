import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import cyndaquilGif from "../assets/ui/sprites/crystal/Cyndaquil_cristal.gif";
import totodileGif from "../assets/ui/sprites/crystal/Totodile_cristal.gif";
import chikoritaGif from "../assets/ui/sprites/crystal/Chikorita_cristal.gif";
import pikachuGif from "../assets/ui/sprites/crystal/Pikachu_cristal.gif";
import lugiaGif from "../assets/ui/sprites/crystal/Lugia_cristal.gif";
import hoohGif from "../assets/ui/sprites/crystal/Ho-Oh_cristal.gif";

const SPRITES = {
  cyndaquil: cyndaquilGif,
  totodile: totodileGif,
  chikorita: chikoritaGif,
  pikachu: pikachuGif,
  lugia: lugiaGif,
  hooh: hoohGif,
};

const aparecer = (d = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay: d },
});

const deslizarArriba = (d = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: d, ease: "easeOut" },
});

const flotar = (d = 0) => ({
  animate: { y: [0, -4, 0] },
  transition: { repeat: Infinity, duration: 3, delay: d, ease: "easeInOut" },
});

const balancear = (d = 0) => ({
  animate: { y: [0, -3, 0] },
  transition: { repeat: Infinity, duration: 2, delay: d, ease: "easeInOut" },
});

const PantallaLineas = () => <div className="screen-scanlines" />;
const PantallaPixeles = () => <div className="screen-pixel-grid" />;

// Manejar PokeballSvg.
const PokeballSvg = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <circle cx="50" cy="50" r="46" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <path d="M4 50h92" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <circle cx="50" cy="50" r="12" stroke="var(--gbc-text-dark)" strokeWidth="3" />
    <circle cx="50" cy="50" r="6" fill="var(--gbc-text-dark)" />
  </svg>
);

// Manejar TarjetaInicial.
const TarjetaInicial = ({ name, sprite, type, delay }) => {
  const labels = { fire: "FUEGO", water: "AGUA", grass: "PLANTA" };

  return (
    <motion.div {...deslizarArriba(delay)} whileHover={{ y: -4, transition: { duration: 0.15 } }} className="starter-card">
      <div className="starter-card-frame">
        <motion.img src={sprite} alt={name} className="sprite--starter" {...balancear(delay * 2)} />
        <PantallaLineas />
      </div>
      <span className="starter-name">{name}</span>
      <span className={`starter-badge starter-badge--${type}`}>{labels[type]}</span>
    </motion.div>
  );
};

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

const POKEBALLS_SCREEN = [
  { s: 80, t: "-10px", r: "-15px", o: 0.06 },
  { s: 60, b: "40px", l: "-10px", o: 0.05 },
];

const META_TAGS = ["GEN II", "JOHTO", "WEB", "GBC"];

const SCREEN_NEWS = [
  "PROF. ELM TE ESTA ESPERANDO",
];

const AURORA_BLOBS = [
  { w: 420, h: 210, t: "-12%", l: "-10%", color: "rgba(70, 175, 255, 0.30)", opacity: 0.8, dx: 20, dy: -12, duration: 12, delay: 0 },
  { w: 360, h: 180, b: "-14%", r: "-8%", color: "rgba(110, 95, 255, 0.25)", opacity: 0.75, dx: -18, dy: 14, duration: 14, delay: 1 },
  { w: 300, h: 160, t: "22%", l: "58%", color: "rgba(0, 255, 200, 0.15)", opacity: 0.6, dx: -12, dy: -8, duration: 16, delay: 2 },
];

// Manejar PaginaInicio.
const PaginaInicio = () => {
  const navigate = useNavigate();
  const [booted, setBooted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [newsIndex, setNewsIndex] = useState(0);

  const stars = useMemo(() => generarEstrellas(34), []);
  const comets = useMemo(() => generarCometas(6), []);

  useEffect(() => {
    const t1 = setTimeout(() => setBooted(true), 800);
    const t2 = setTimeout(() => setShowContent(true), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % SCREEN_NEWS.length);
    }, 2600);
    return () => clearInterval(ticker);
  }, []);

  return (
    <div className="page-bg lp2-page">
      <div className="lp2-nebula-layer" aria-hidden="true">
        {AURORA_BLOBS.map((blob, i) => (
          <motion.div
            key={i}
            className="lp2-nebula"
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
            transition={{
              repeat: Infinity,
              duration: blob.duration,
              delay: blob.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="lp2-shell-halo"
        animate={{ opacity: [0.5, 0.75, 0.5], scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      />

      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="bg-star lp2-star"
          style={{ width: s.w, height: s.w, left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ opacity: [0.1, 0.55, 0.1] }}
          transition={{ repeat: Infinity, duration: s.dur, delay: s.del }}
        />
      ))}

      {comets.map((c, i) => (
        <motion.div
          key={i}
          className="lp2-comet"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          animate={{ x: [0, c.travel], y: [0, c.travel * 0.28], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: c.dur, delay: c.del, ease: "easeOut" }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="lp2-title-wrap"
      >
        <h1 className="lp2-main-title">POKEMON</h1>
        <h2 className="lp2-main-subtitle">BYTES</h2>
        <div className="lp2-tag-row">
          {META_TAGS.map((tag) => (
            <span key={tag} className="lp2-tag">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

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
                className={`power-led ${booted ? "power-led--on" : ""}`}
                animate={{
                  boxShadow: booted
                    ? ["0 0 4px var(--gbc-accent)", "0 0 8px var(--gbc-accent)", "0 0 4px var(--gbc-accent)"]
                    : "none",
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          </div>

          <div className="gbc-screen-border">
            <div className="gbc-screen">
              <PantallaLineas />
              <PantallaPixeles />

              {POKEBALLS_SCREEN.map(({ s, t, l, r, b, o }, i) => (
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

              <AnimatePresence mode="wait">
                {!booted && (
                  <motion.div
                    key="boot"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="gbc-screen lp2-boot-overlay"
                  >
                    <motion.div animate={{ opacity: [0, 1, 0, 1] }} transition={{ duration: 0.8, times: [0, 0.3, 0.6, 1] }}>
                      <img src={SPRITES.pikachu} alt="Pikachu" className="sprite--boot" />
                    </motion.div>
                    <span className="screen-boot-text">Loading...</span>
                  </motion.div>
                )}

                {booted && (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="screen-content"
                  >
                    <motion.div {...aparecer(0.1)} className="legendary-row">
                      <motion.img src={SPRITES.hooh} alt="Ho-Oh" className="sprite--legendary" {...flotar(0)} />
                      <motion.img src={SPRITES.lugia} alt="Lugia" className="sprite--legendary" {...flotar(0.5)} />
                    </motion.div>

                    <motion.div {...aparecer(0.3)}>
                      <h1 className="screen-title">Pokémon</h1>
                      <h2 className="screen-subtitle">Bytes</h2>
                    </motion.div>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={newsIndex}
                        className="lp2-news-ticker"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                      >
                        {SCREEN_NEWS[newsIndex]}
                      </motion.p>
                    </AnimatePresence>

                    <motion.div {...aparecer(0.4)} className="screen-divider">
                      {[...Array(12)].map((_, i) => (
                        <span
                          key={i}
                          className={`screen-divider-dot ${i % 3 === 0 ? "screen-divider-dot--strong" : "screen-divider-dot--soft"}`}
                        />
                      ))}
                    </motion.div>

                    <motion.p {...aparecer(0.5)} className="screen-description">
                      Revive Pokémon Oro y Plata.
                      <br />
                      Captura, entrena y combate desde tu navegador.
                    </motion.p>

                    <motion.div {...aparecer(0.55)} className="lp2-version-row">
                      <span className="lp2-version-pill lp2-version-pill--gold">GOLD LEGACY</span>
                      <span className="lp2-version-pill lp2-version-pill--silver">SILVER LEGACY</span>
                    </motion.div>

                    {showContent && (
                      <div className="starters-row">
                        <TarjetaInicial name="Cyndaquil" sprite={SPRITES.cyndaquil} type="fire" delay={0.1} />
                        <TarjetaInicial name="Totodile" sprite={SPRITES.totodile} type="water" delay={0.25} />
                        <TarjetaInicial name="Chikorita" sprite={SPRITES.chikorita} type="grass" delay={0.4} />
                      </div>
                    )}

                    {showContent && (
                      <motion.div {...deslizarArriba(0.6)} className="start-btn-wrap">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate("/iniciarSesion")}
                          className="start-game-btn"
                        >
                          {"> START GAME"}
                        </motion.button>
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                          className="screen-press-start"
                        >
                          Press Start
                        </motion.span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="gbc-bottom-row">
            <span className="gbc-bottom-label">Pokémon Bytes™</span>
            <span className="gbc-bottom-label gbc-bottom-label--dim">© 2026</span>
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
            <button onClick={() => navigate("/iniciarSesion")}>
              <div className="select-start-bar" />
              <span className="select-start-label">Select</span>
            </button>
            <button onClick={() => navigate("/iniciarSesion")}>
              <div className="select-start-bar" />
              <span className="select-start-label">Start</span>
            </button>
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.8 }} className="page-credits">
        Built with React · Framer Motion · Vite
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="lp2-description-wrap"
      >
        <p className="lp2-description">
          REGRESA A LA REGIÓN DE <span className="lp2-hl lp2-hl--gold">JOHTO</span> Y REDESCUBRE LA MAGIA.
          <br />
          JUEGA DE FORMA NATIVA EN EL NAVEGADOR A{" "}
          <span className="lp2-hl lp2-hl--violet">POKÉMON ORO/PLATA</span>.
          <br />
          REVIVE LA NOSTALGIA DE GBC.
          <br />
          <span className="lp2-hl lp2-hl--blue">¡HAZTE CON TODOS!</span>
        </p>
      </motion.div>
    </div>
  );
};

export default PaginaInicio;

