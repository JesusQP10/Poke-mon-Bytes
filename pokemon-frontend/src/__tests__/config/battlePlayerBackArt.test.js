import { describe, it, expect } from 'vitest';
import { urlsEspaldaJugadorCampo } from '../../config/battlePlayerBackArt.js';

const POKEAPI_BACK_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions';

describe('urlsEspaldaJugadorCampo — starters Johto', () => {
  it('Chikorita (id 152) devuelve asset local en principal y fallback', () => {
    const { principal, fallback } = urlsEspaldaJugadorCampo({ id: 152 });
    expect(principal).toBeTruthy();
    expect(fallback).toBeTruthy();
    expect(principal).toBe(fallback);
  });

  it('Cyndaquil (pokedexId 155) devuelve asset local', () => {
    const { principal } = urlsEspaldaJugadorCampo({ pokedexId: 155 });
    expect(principal).toBeTruthy();
    expect(principal).not.toContain('pokeapi');
    expect(principal).not.toContain('github');
  });

  it('Totodile (idPokedex 158) devuelve asset local', () => {
    const { principal } = urlsEspaldaJugadorCampo({ idPokedex: 158 });
    expect(principal).toBeTruthy();
  });

  it('reconoce chikorita por nombre', () => {
    const { principal } = urlsEspaldaJugadorCampo({ nombre: 'Chikorita' });
    expect(principal).toBeTruthy();
    expect(principal).not.toContain(POKEAPI_BACK_BASE);
  });
});

describe('urlsEspaldaJugadorCampo — Pokémon no starter', () => {
  it('Pikachu (id 25) devuelve URL de PokéAPI generación V', () => {
    const { principal } = urlsEspaldaJugadorCampo({ id: 25 });
    expect(principal).toContain('generation-v');
    expect(principal).toContain('/25.gif');
  });

  it('fallback apunta a Crystal generación II', () => {
    const { fallback } = urlsEspaldaJugadorCampo({ id: 25 });
    expect(fallback).toContain('generation-ii');
    expect(fallback).toContain('/25.png');
  });

  it('null usa id de fallback (158 = Totodile) en PokéAPI', () => {
    const { principal } = urlsEspaldaJugadorCampo(null);
    expect(principal).toContain('generation-v');
    expect(principal).toContain('/158.gif');
  });

  it('objeto vacío también usa fallback PokéAPI', () => {
    const { principal } = urlsEspaldaJugadorCampo({});
    expect(principal).toContain('generation-v');
  });
});
