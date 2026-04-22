import { describe, it, expect } from 'vitest';
import {
  normalizarListaInventario,
  fusionarPokedexRegistrados,
  idEntrenadorDesdeSemilla,
  normalizarIdEntrenador5,
  normalizarMapaActualParaPreload,
} from '../../store/usarJuegoStore.js';

describe('normalizarListaInventario', () => {
  it('devuelve [] para array vacío', () => {
    expect(normalizarListaInventario([])).toEqual([]);
  });

  it('devuelve [] para no-array', () => {
    expect(normalizarListaInventario(null)).toEqual([]);
    expect(normalizarListaInventario(undefined)).toEqual([]);
    expect(normalizarListaInventario('hola')).toEqual([]);
  });

  it('fusiona dos líneas con el mismo itemId numérico', () => {
    const lineas = [
      { itemId: 1, nombre: 'Potion', cantidad: 2 },
      { itemId: 1, nombre: 'Potion', cantidad: 3 },
    ];
    const result = normalizarListaInventario(lineas);
    expect(result).toHaveLength(1);
    expect(result[0].cantidad).toBe(5);
  });

  it('trata items con distinto itemId como entradas separadas', () => {
    const lineas = [
      { itemId: 1, nombre: 'Potion', cantidad: 1 },
      { itemId: 2, nombre: 'Antídoto', cantidad: 1 },
    ];
    expect(normalizarListaInventario(lineas)).toHaveLength(2);
  });

  it('fusiona por nombre normalizado si no hay id numérico', () => {
    const lineas = [
      { nombre: 'Poción', cantidad: 1 },
      { nombre: 'Potion', cantidad: 2 },
    ];
    const result = normalizarListaInventario(lineas);
    expect(result).toHaveLength(1);
    expect(result[0].cantidad).toBe(3);
  });

  it('ignora entradas que no son objetos', () => {
    const lineas = [null, undefined, 'texto', { itemId: 5, cantidad: 1 }];
    const result = normalizarListaInventario(lineas);
    expect(result).toHaveLength(1);
  });

  it('cantidad no finita se trata como 1', () => {
    const lineas = [{ itemId: 1, nombre: 'X', cantidad: 'mucho' }];
    expect(normalizarListaInventario(lineas)[0].cantidad).toBe(1);
  });
});

describe('fusionarPokedexRegistrados', () => {
  it('combina lista guardada y equipo sin duplicados', () => {
    const result = fusionarPokedexRegistrados([1, 2], [{ id: 2 }, { id: 3 }]);
    expect(result).toEqual([1, 2, 3]);
  });

  it('ordena numéricamente', () => {
    const result = fusionarPokedexRegistrados([10, 1], [{ id: 5 }]);
    expect(result).toEqual([1, 5, 10]);
  });

  it('tolera prev vacío', () => {
    const result = fusionarPokedexRegistrados([], [{ id: 7 }]);
    expect(result).toEqual([7]);
  });

  it('tolera prev no-array', () => {
    const result = fusionarPokedexRegistrados(null, [{ id: 1 }]);
    expect(result).toEqual([1]);
  });

  it('ignora ids no numéricos del equipo', () => {
    const result = fusionarPokedexRegistrados([1], [{ id: 'abc' }]);
    expect(result).toEqual([1]);
  });

  it('usa pokedexId si no hay id en el equipo', () => {
    const result = fusionarPokedexRegistrados([], [{ pokedexId: 152 }]);
    expect(result).toEqual([152]);
  });
});

describe('idEntrenadorDesdeSemilla', () => {
  it('devuelve siempre una cadena de 5 dígitos', () => {
    const id = idEntrenadorDesdeSemilla('usuario123');
    expect(id).toMatch(/^\d{5}$/);
  });

  it('es determinista (misma semilla → mismo resultado)', () => {
    const a = idEntrenadorDesdeSemilla('semilla-fija');
    const b = idEntrenadorDesdeSemilla('semilla-fija');
    expect(a).toBe(b);
  });

  it('semillas distintas dan (casi siempre) resultados distintos', () => {
    const a = idEntrenadorDesdeSemilla('alpha');
    const b = idEntrenadorDesdeSemilla('beta');
    expect(a).not.toBe(b);
  });

  it('tolera semilla vacía y devuelve 5 dígitos', () => {
    expect(idEntrenadorDesdeSemilla('')).toMatch(/^\d{5}$/);
  });

  it('tolera null/undefined', () => {
    expect(idEntrenadorDesdeSemilla(null)).toMatch(/^\d{5}$/);
    expect(idEntrenadorDesdeSemilla(undefined)).toMatch(/^\d{5}$/);
  });
});

describe('normalizarIdEntrenador5', () => {
  it('devuelve cadena vacía para null', () => expect(normalizarIdEntrenador5(null)).toBe(''));
  it('devuelve cadena vacía para string sin dígitos', () => {
    expect(normalizarIdEntrenador5('abc')).toBe('');
  });

  it('extrae los últimos 5 dígitos de una cadena más larga', () => {
    expect(normalizarIdEntrenador5('abc12345')).toBe('12345');
  });

  it('rellena con ceros a la izquierda si hay menos de 5 dígitos', () => {
    expect(normalizarIdEntrenador5('42')).toBe('00042');
  });

  it('mantiene exactamente 5 dígitos si ya los tiene', () => {
    expect(normalizarIdEntrenador5('99999')).toBe('99999');
  });
});

describe('normalizarMapaActualParaPreload', () => {
  it('elm_lab → elm-lab', () => expect(normalizarMapaActualParaPreload('elm_lab')).toBe('elm-lab'));
  it('debugger_room → debugger-room', () => {
    expect(normalizarMapaActualParaPreload('debugger_room')).toBe('debugger-room');
  });
  it('new_bark_town → new-bark-town', () => {
    expect(normalizarMapaActualParaPreload('new_bark_town')).toBe('new-bark-town');
  });
  it('player_house → player-house', () => {
    expect(normalizarMapaActualParaPreload('player_house')).toBe('player-house');
  });
  it('player_room → player-room', () => {
    expect(normalizarMapaActualParaPreload('player_room')).toBe('player-room');
  });
  it('cadena vacía → player-room (default)', () => {
    expect(normalizarMapaActualParaPreload('')).toBe('player-room');
  });
  it('null → player-room (default)', () => {
    expect(normalizarMapaActualParaPreload(null)).toBe('player-room');
  });
  it('clave desconocida se devuelve tal cual', () => {
    expect(normalizarMapaActualParaPreload('mi-mapa')).toBe('mi-mapa');
  });
});
