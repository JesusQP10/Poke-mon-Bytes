import { describe, it, expect } from 'vitest';
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaArriba,
  esTeclaAbajo,
  esTeclaIzquierda,
  esTeclaDerecha,
} from '../../config/controlesJuego.js';

describe('esTeclaAceptar', () => {
  it('reconoce Z', () => expect(esTeclaAceptar('KeyZ')).toBe(true));
  it('reconoce Enter', () => expect(esTeclaAceptar('Enter')).toBe(true));
  it('reconoce NumpadEnter', () => expect(esTeclaAceptar('NumpadEnter')).toBe(true));
  it('rechaza Escape', () => expect(esTeclaAceptar('Escape')).toBe(false));
  it('rechaza cadena vacía', () => expect(esTeclaAceptar('')).toBe(false));
});

describe('esTeclaAtras', () => {
  it('reconoce X', () => expect(esTeclaAtras('KeyX')).toBe(true));
  it('reconoce Escape', () => expect(esTeclaAtras('Escape')).toBe(true));
  it('rechaza Z', () => expect(esTeclaAtras('KeyZ')).toBe(false));
});

describe('esTeclaArriba', () => {
  it('reconoce W', () => expect(esTeclaArriba('KeyW')).toBe(true));
  it('reconoce ArrowUp', () => expect(esTeclaArriba('ArrowUp')).toBe(true));
  it('rechaza ArrowDown', () => expect(esTeclaArriba('ArrowDown')).toBe(false));
});

describe('esTeclaAbajo', () => {
  it('reconoce S', () => expect(esTeclaAbajo('KeyS')).toBe(true));
  it('reconoce ArrowDown', () => expect(esTeclaAbajo('ArrowDown')).toBe(true));
  it('rechaza ArrowUp', () => expect(esTeclaAbajo('ArrowUp')).toBe(false));
});

describe('esTeclaIzquierda', () => {
  it('reconoce A', () => expect(esTeclaIzquierda('KeyA')).toBe(true));
  it('reconoce ArrowLeft', () => expect(esTeclaIzquierda('ArrowLeft')).toBe(true));
  it('rechaza ArrowRight', () => expect(esTeclaIzquierda('ArrowRight')).toBe(false));
});

describe('esTeclaDerecha', () => {
  it('reconoce D', () => expect(esTeclaDerecha('KeyD')).toBe(true));
  it('reconoce ArrowRight', () => expect(esTeclaDerecha('ArrowRight')).toBe(true));
  it('rechaza ArrowLeft', () => expect(esTeclaDerecha('ArrowLeft')).toBe(false));
});
