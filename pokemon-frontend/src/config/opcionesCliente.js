/**
 * Preferencias del jugador guardadas en localStorage (menú OPCIONES).
 * No sustituyen al guardado de partida; son ajustes de cliente.
 */

const STORAGE_KEY = "pokemon_bytes_opciones_cliente_v1";

/** Volumen base del BGM en Phaser antes de aplicar el % del jugador. */
export const BGM_VOL_BASE = 0.6;

const DEFAULTS = {
  /** 0, 25, 50, 75 o 100 */
  bgmPercent: 100,
  textoRapido: false,
  sfxOn: true,
};

function normalizar(o) {
  const pct = Number(o?.bgmPercent);
  const bgmPercent = [0, 25, 50, 75, 100].includes(pct) ? pct : DEFAULTS.bgmPercent;
  return {
    bgmPercent,
    textoRapido: Boolean(o?.textoRapido),
    sfxOn: o?.sfxOn !== false,
  };
}

export function leerOpcionesCliente() {
  if (typeof localStorage === "undefined") {
    return { ...DEFAULTS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return normalizar(JSON.parse(raw));
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * @param {Partial<{ bgmPercent: number, textoRapido: boolean, sfxOn: boolean }>} partial
 */
export function escribirOpcionesCliente(partial) {
  const next = normalizar({ ...leerOpcionesCliente(), ...partial });
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    /* cuota o modo privado */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bytes-opciones-audio", { detail: next }));
  }
  return next;
}

/** Volumen 0–1 para `sound.add(..., { volume })` del BGM. */
export function volumenBgmParaPhaser() {
  const pct = leerOpcionesCliente().bgmPercent;
  return BGM_VOL_BASE * (pct / 100);
}

/** Retardo entre caracteres en diálogos Phaser (ms). */
export function delayDialogoMs() {
  return leerOpcionesCliente().textoRapido ? 12 : 30;
}

export function sfxPermitido() {
  return leerOpcionesCliente().sfxOn !== false;
}

/** Pasos de volumen música (ciclo con flechas). */
export const PASOS_VOLUMEN_BGM = [0, 25, 50, 75, 100];
