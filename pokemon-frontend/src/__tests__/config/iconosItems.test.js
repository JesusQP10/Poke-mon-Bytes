import { describe, it, expect } from 'vitest';
import { urlIconoItemPorNombre } from '../../config/iconosItems.js';

describe('urlIconoItemPorNombre', () => {
  it('devuelve URL para nombre simple', () => {
    expect(urlIconoItemPorNombre('repel')).toBe('/assets/game/overworld/sprites/items/repel.png');
  });

  it('convierte a minúsculas', () => {
    expect(urlIconoItemPorNombre('Super-Potion')).toBe('/assets/game/overworld/sprites/items/super-potion.png');
  });

  it('elimina diacríticos (poción → pocion)', () => {
    expect(urlIconoItemPorNombre('Poción')).toBe('/assets/game/overworld/sprites/items/pocion.png');
  });

  it('reemplaza espacios por guiones', () => {
    expect(urlIconoItemPorNombre('full restore')).toBe('/assets/game/overworld/sprites/items/full-restore.png');
  });

  it('elimina espacios extras y normaliza', () => {
    expect(urlIconoItemPorNombre('  Hyper Potion  ')).toBe('/assets/game/overworld/sprites/items/hyper-potion.png');
  });

  it('devuelve cadena vacía para null', () => {
    expect(urlIconoItemPorNombre(null)).toBe('');
  });

  it('devuelve cadena vacía para undefined', () => {
    expect(urlIconoItemPorNombre(undefined)).toBe('');
  });

  it('devuelve cadena vacía para nombre en blanco', () => {
    expect(urlIconoItemPorNombre('   ')).toBe('');
  });

  it('maneja nombre con tilde y mayúsculas', () => {
    expect(urlIconoItemPorNombre('Antiparalísis')).toBe(
      '/assets/game/overworld/sprites/items/antiparalisis.png'
    );
  });
});
