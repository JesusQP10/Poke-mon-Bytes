import { describe, it, expect } from 'vitest';
import {
  battleStatusClaveParaIlustracion,
  battleStatusTextureKeyPhaser,
  BATTLE_STATUS_PHASER_LOAD,
} from '../../config/battleStatusArt.js';

describe('battleStatusClaveParaIlustracion', () => {
  it('devuelve la clave de estado del jugador si es válida', () => {
    expect(battleStatusClaveParaIlustracion('veneno', null)).toBe('veneno');
  });

  it('usa el estado salvaje si el del jugador es nulo', () => {
    expect(battleStatusClaveParaIlustracion(null, 'paralisis')).toBe('paralisis');
  });

  it('normaliza a minúsculas', () => {
    expect(battleStatusClaveParaIlustracion('QUEMADO', null)).toBe('quemado');
  });

  it('devuelve normal para clave desconocida', () => {
    expect(battleStatusClaveParaIlustracion('maldicion', null)).toBe('normal');
  });

  it('devuelve normal si ambos son nulos', () => {
    expect(battleStatusClaveParaIlustracion(null, null)).toBe('normal');
  });

  it('devuelve normal si ambos son cadena vacía', () => {
    expect(battleStatusClaveParaIlustracion('', '')).toBe('normal');
  });

  it('reconoce todos los estados válidos', () => {
    const estados = ['veneno', 'paralisis', 'quemado', 'confuso', 'congelado', 'dormido'];
    estados.forEach((e) => {
      expect(battleStatusClaveParaIlustracion(e, null)).toBe(e);
    });
  });

  it('el estado jugador tiene prioridad sobre el salvaje', () => {
    expect(battleStatusClaveParaIlustracion('veneno', 'dormido')).toBe('veneno');
  });
});

describe('battleStatusTextureKeyPhaser', () => {
  it('devuelve clave con prefijo battle-art-', () => {
    expect(battleStatusTextureKeyPhaser('veneno', null)).toBe('battle-art-veneno');
  });

  it('devuelve battle-art-normal para estado inválido', () => {
    expect(battleStatusTextureKeyPhaser('maldicion', null)).toBe('battle-art-normal');
  });

  it('devuelve battle-art-normal si todo es nulo', () => {
    expect(battleStatusTextureKeyPhaser(null, null)).toBe('battle-art-normal');
  });
});

describe('BATTLE_STATUS_PHASER_LOAD', () => {
  it('contiene 7 pares [key, url]', () => {
    expect(BATTLE_STATUS_PHASER_LOAD).toHaveLength(7);
  });

  it('todas las claves empiezan por battle-art-', () => {
    BATTLE_STATUS_PHASER_LOAD.forEach(([key]) => {
      expect(key.startsWith('battle-art-')).toBe(true);
    });
  });

  it('incluye la clave battle-art-normal', () => {
    const claves = BATTLE_STATUS_PHASER_LOAD.map(([k]) => k);
    expect(claves).toContain('battle-art-normal');
  });
});
