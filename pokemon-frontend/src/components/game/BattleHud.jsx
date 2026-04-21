import "./BattleHud.css";
import "./MenuIngameReact.css";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Misma lógica que MenuIngameReact (color texto HP) */
function colorHp(hpA, hpM) {
  if (!hpM || hpM <= 0) return "menu-ingame-hp-ok";
  const r = Number(hpA) / hpM;
  if (r > 0.5) return "menu-ingame-hp-ok";
  if (r > 0.2) return "menu-ingame-hp-warn";
  return "menu-ingame-hp-bad";
}

const ETIQUETA_ESTADO = {
  quemado:          { texto: "QEM", color: "#e04000" },
  envenenado:       { texto: "VEN", color: "#a040c0" },
  grave_envenenado: { texto: "TOX", color: "#7000a0" },
  dormido:          { texto: "DOR", color: "#6080c0" },
  paralizado:       { texto: "PAR", color: "#c0b000" },
  congelado:        { texto: "HEL", color: "#40b0e0" },
  confuso:          { texto: "CNF", color: "#c060c0" },
};

function EstadoBadge({ estado }) {
  const info = ETIQUETA_ESTADO[String(estado ?? "").toLowerCase()];
  if (!info) return null;
  return (
    <span style={{
      display: "inline-block",
      padding: "0 2px",
      fontSize: "5px",
      lineHeight: "7px",
      background: info.color,
      color: "#fff",
      borderRadius: 1,
      verticalAlign: "middle",
      letterSpacing: 0,
    }}>
      {info.texto}
    </span>
  );
}

export default function BattleHud({ jugador, enemigo }) {
  const j = jugador ?? {};
  const e = enemigo ?? {};

  const jHpA = j.hpActual ?? null;
  const jHpM = j.hpMax ?? null;
  const eHpA = e.hpActual ?? null;
  const eHpM = e.hpMax ?? null;

  const jRatio = jHpA != null && jHpM != null ? clamp01(jHpA / jHpM) : 0;
  const eRatio = eHpA != null && eHpM != null ? clamp01(eHpA / eHpM) : 0;

  const nombreE = (e.nombre ?? e.name ?? "???").toString().toUpperCase();
  const nombreJ = (j.nombreApodo ?? j.nombre ?? j.name ?? "???").toString().toUpperCase();
  const estadoE = e.estado ?? "saludable";
  const estadoJ = j.estado ?? "saludable";

  return (
    <div className="battle-hud-root" aria-hidden>
      {/* Rival: mismas piezas que slot de equipo (sin números HP en panel superior) */}
      <div className="menu-ingame-team-slot battle-hud-slot battle-hud-slot--enemigo">
        <div className="menu-ingame-team-slot-head">
          <div className="menu-ingame-team-slot-names">
            <div className="menu-ingame-team-etiqueta">{nombreE}</div>
          </div>
          <div className="menu-ingame-team-nv">Nv{e.nivel ?? "?"}</div>
        </div>
        <div className="battle-hud-estado-row"><EstadoBadge estado={estadoE} /></div>
        <div className="menu-ingame-hp-row">
          <div className="menu-ingame-hpbar">
            <div
              className={`menu-ingame-hpbar-fill ${colorHp(eHpA, eHpM)}`}
              style={{ width: `${Math.round(eRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Jugador: barra + números como lista de equipo */}
      <div className="menu-ingame-team-slot battle-hud-slot battle-hud-slot--jugador">
        <div className="menu-ingame-team-slot-head">
          <div className="menu-ingame-team-slot-names">
            <div className="menu-ingame-team-etiqueta">{nombreJ}</div>
          </div>
          <div className="menu-ingame-team-nv">Nv{j.nivel ?? "?"}</div>
        </div>
        <div className="battle-hud-estado-row"><EstadoBadge estado={estadoJ} /></div>
        <div className="menu-ingame-hp-row">
          <div className="menu-ingame-hpbar">
            <div
              className={`menu-ingame-hpbar-fill ${colorHp(jHpA, jHpM)}`}
              style={{ width: `${Math.round(jRatio * 100)}%` }}
            />
          </div>
          <span className={`menu-ingame-hpnums ${colorHp(jHpA, jHpM)}`}>
            {jHpA ?? "??"}/{jHpM ?? "??"}
          </span>
        </div>
      </div>
    </div>
  );
}
