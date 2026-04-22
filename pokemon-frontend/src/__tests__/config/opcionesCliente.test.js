import { describe, it, expect, beforeEach } from 'vitest';
import {
  pasoBgmPercent,
  BGM_VOL_BASE,
  PASOS_VOLUMEN_BGM,
  leerOpcionesCliente,
  volumenBgmParaPhaser,
  delayDialogoMs,
} from '../../config/opcionesCliente.js';

const STORAGE_KEY = 'pokemon_bytes_opciones_cliente_v1';

describe('constantes', () => {
  it('BGM_VOL_BASE es 0.6', () => expect(BGM_VOL_BASE).toBe(0.6));
  it('PASOS_VOLUMEN_BGM contiene [0, 25, 50, 75, 100]', () => {
    expect(PASOS_VOLUMEN_BGM).toEqual([0, 25, 50, 75, 100]);
  });
});

describe('pasoBgmPercent', () => {
  it('sube de 50 a 75', () => expect(pasoBgmPercent(50, +1)).toBe(75));
  it('baja de 50 a 25', () => expect(pasoBgmPercent(50, -1)).toBe(25));
  it('satura en el máximo (100)', () => expect(pasoBgmPercent(100, +1)).toBe(100));
  it('satura en el mínimo (0)', () => expect(pasoBgmPercent(0, -1)).toBe(0));
  it('valor desconocido usa el máximo (100) y sube al máximo', () => {
    expect(pasoBgmPercent(999, +1)).toBe(100);
  });
  it('valor desconocido usa el máximo (100) y baja a 75', () => {
    expect(pasoBgmPercent(999, -1)).toBe(75);
  });
  it('sube de 0 a 25', () => expect(pasoBgmPercent(0, +1)).toBe(25));
  it('baja de 100 a 75', () => expect(pasoBgmPercent(100, -1)).toBe(75));
});

describe('leerOpcionesCliente', () => {
  beforeEach(() => localStorage.clear());

  it('devuelve defaults si localStorage está vacío', () => {
    const opts = leerOpcionesCliente();
    expect(opts.bgmPercent).toBe(100);
    expect(opts.textoRapido).toBe(false);
    expect(opts.sfxOn).toBe(true);
    expect(opts.locale).toBe('es');
  });

  it('normaliza bgmPercent inválido a default 100', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bgmPercent: 33 }));
    expect(leerOpcionesCliente().bgmPercent).toBe(100);
  });

  it('acepta bgmPercent válido', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bgmPercent: 75 }));
    expect(leerOpcionesCliente().bgmPercent).toBe(75);
  });

  it('acepta locale en', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: 'en' }));
    expect(leerOpcionesCliente().locale).toBe('en');
  });

  it('rechaza locale desconocido y usa es', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: 'fr' }));
    expect(leerOpcionesCliente().locale).toBe('es');
  });

  it('devuelve defaults si el JSON es inválido', () => {
    localStorage.setItem(STORAGE_KEY, 'no-es-json{{');
    const opts = leerOpcionesCliente();
    expect(opts.bgmPercent).toBe(100);
  });
});

describe('volumenBgmParaPhaser', () => {
  beforeEach(() => localStorage.clear());

  it('devuelve 0.6 con bgmPercent 100', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bgmPercent: 100 }));
    expect(volumenBgmParaPhaser()).toBeCloseTo(0.6);
  });

  it('devuelve 0 con bgmPercent 0', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bgmPercent: 0 }));
    expect(volumenBgmParaPhaser()).toBe(0);
  });

  it('devuelve 0.3 con bgmPercent 50', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bgmPercent: 50 }));
    expect(volumenBgmParaPhaser()).toBeCloseTo(0.3);
  });
});

describe('delayDialogoMs', () => {
  beforeEach(() => localStorage.clear());

  it('devuelve 30 con texto normal', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ textoRapido: false }));
    expect(delayDialogoMs()).toBe(30);
  });

  it('devuelve 12 con texto rápido', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ textoRapido: true }));
    expect(delayDialogoMs()).toBe(12);
  });
});
