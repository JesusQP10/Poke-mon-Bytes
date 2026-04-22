import { describe, it, expect } from 'vitest';
import {
  urlGifCrystalStarter,
  urlSpriteDirectoPorId,
  spriteAnimadoPreferido,
  etiquetaTipoEspanol,
} from '../../services/pokemonDetallePokeapi.js';

describe('urlGifCrystalStarter', () => {
  it('devuelve string para Chikorita (152)', () => expect(urlGifCrystalStarter(152)).toBeTruthy());
  it('devuelve string para Cyndaquil (155)', () => expect(urlGifCrystalStarter(155)).toBeTruthy());
  it('devuelve string para Totodile (158)', () => expect(urlGifCrystalStarter(158)).toBeTruthy());
  it('devuelve null para Pikachu (25)', () => expect(urlGifCrystalStarter(25)).toBeNull());
  it('devuelve null para null', () => expect(urlGifCrystalStarter(null)).toBeNull());
  it('devuelve null para undefined', () => expect(urlGifCrystalStarter(undefined)).toBeNull());
  it('acepta id como string', () => expect(urlGifCrystalStarter('152')).toBeTruthy());
});

describe('urlSpriteDirectoPorId', () => {
  it('principal apunta a sprites B/W animados', () => {
    const { principal } = urlSpriteDirectoPorId(25);
    expect(principal).toContain('generation-v');
    expect(principal).toContain('black-white/animated');
    expect(principal).toContain('/25.gif');
  });

  it('fallback apunta a Crystal generación II', () => {
    const { fallback } = urlSpriteDirectoPorId(25);
    expect(fallback).toContain('generation-ii/crystal');
    expect(fallback).toContain('/25.png');
  });

  it('incluye el id en ambas URLs', () => {
    const { principal, fallback } = urlSpriteDirectoPorId(152);
    expect(principal).toContain('/152.gif');
    expect(fallback).toContain('/152.png');
  });
});

describe('spriteAnimadoPreferido', () => {
  it('devuelve null para null', () => expect(spriteAnimadoPreferido(null)).toBeNull());
  it('devuelve null para undefined', () => expect(spriteAnimadoPreferido(undefined)).toBeNull());
  it('devuelve null para objeto vacío', () => expect(spriteAnimadoPreferido({})).toBeNull());

  it('prefiere animated B/W (gen-v)', () => {
    const sprites = {
      versions: {
        'generation-v': {
          'black-white': { animated: { front_default: 'bw-animated.gif' } },
        },
      },
      other: { showdown: { front_default: 'showdown.gif' } },
      front_default: 'default.png',
    };
    expect(spriteAnimadoPreferido(sprites)).toBe('bw-animated.gif');
  });

  it('usa showdown si no hay B/W animado', () => {
    const sprites = {
      versions: { 'generation-v': { 'black-white': {} } },
      other: { showdown: { front_default: 'showdown.gif' } },
      front_default: 'default.png',
    };
    expect(spriteAnimadoPreferido(sprites)).toBe('showdown.gif');
  });

  it('usa front_default como último recurso', () => {
    const sprites = { front_default: 'default.png' };
    expect(spriteAnimadoPreferido(sprites)).toBe('default.png');
  });
});

describe('etiquetaTipoEspanol', () => {
  it('traduce fire a Fuego', () => expect(etiquetaTipoEspanol('fire')).toBe('Fuego'));
  it('traduce water a Agua', () => expect(etiquetaTipoEspanol('water')).toBe('Agua'));
  it('traduce grass a Planta', () => expect(etiquetaTipoEspanol('grass')).toBe('Planta'));
  it('traduce psychic a Psíquico', () => expect(etiquetaTipoEspanol('psychic')).toBe('Psíquico'));
  it('traduce ghost a Fantasma', () => expect(etiquetaTipoEspanol('ghost')).toBe('Fantasma'));
  it('devuelve el código original si no está mapeado', () => {
    expect(etiquetaTipoEspanol('stellar')).toBe('stellar');
  });
  it('devuelve cadena vacía para null', () => expect(etiquetaTipoEspanol(null)).toBe(''));
  it('devuelve cadena vacía para undefined', () => expect(etiquetaTipoEspanol(undefined)).toBe(''));
  it('es insensible a mayúsculas', () => expect(etiquetaTipoEspanol('FIRE')).toBe('Fuego'));
});
