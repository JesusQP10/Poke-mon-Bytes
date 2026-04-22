import { describe, it, expect } from 'vitest';
import {
  statCombateMenu,
  STATS_MENU_FALLBACK_POR_POKEDEX,
} from '../../config/statsCombateMenuFallback.js';

describe('STATS_MENU_FALLBACK_POR_POKEDEX', () => {
  it('contiene datos para los tres starters (152, 155, 158)', () => {
    expect(STATS_MENU_FALLBACK_POR_POKEDEX[152]).toBeDefined();
    expect(STATS_MENU_FALLBACK_POR_POKEDEX[155]).toBeDefined();
    expect(STATS_MENU_FALLBACK_POR_POKEDEX[158]).toBeDefined();
  });

  it('los stats de Chikorita (152) tienen las 5 claves', () => {
    const s = STATS_MENU_FALLBACK_POR_POKEDEX[152];
    ['ataque', 'defensa', 'ataqueEspecial', 'defensaEspecial', 'velocidad'].forEach(
      (k) => expect(typeof s[k]).toBe('number')
    );
  });
});

describe('statCombateMenu', () => {
  it('devuelve el campo directo si existe', () => {
    expect(statCombateMenu({ ataque: 15 }, 'ataque')).toBe(15);
  });

  it('usa el sufijo Stat si el campo directo es null', () => {
    expect(statCombateMenu({ ataqueEspecialStat: 20 }, 'ataqueEspecial')).toBe(20);
  });

  it('usa velocidadStat como fallback de velocidad', () => {
    expect(statCombateMenu({ velocidadStat: 12 }, 'velocidad')).toBe(12);
  });

  it('usa defensaStat como fallback de defensa', () => {
    expect(statCombateMenu({ defensaStat: 9 }, 'defensa')).toBe(9);
  });

  it('usa ataqueStat como fallback de ataque', () => {
    expect(statCombateMenu({ ataqueStat: 11 }, 'ataque')).toBe(11);
  });

  it('cae al fallback de Pokédex para id conocido', () => {
    expect(statCombateMenu({ id: 152 }, 'ataque')).toBe(STATS_MENU_FALLBACK_POR_POKEDEX[152].ataque);
  });

  it('devuelve null para id desconocido sin stats', () => {
    expect(statCombateMenu({ id: 999 }, 'ataque')).toBeNull();
  });

  it('devuelve null para pokemon null', () => {
    expect(statCombateMenu(null, 'ataque')).toBeNull();
  });

  it('devuelve null para pokemon undefined', () => {
    expect(statCombateMenu(undefined, 'ataque')).toBeNull();
  });

  it('campo directo vacío ("") cae al siguiente nivel', () => {
    expect(statCombateMenu({ ataque: '', id: 152 }, 'ataque')).toBe(
      STATS_MENU_FALLBACK_POR_POKEDEX[152].ataque
    );
  });
});
