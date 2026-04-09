// Constantes globales del proyecto

export const TAM_TILE = 16;
export const LIMITE_EQUIPO = 6;
export const MAX_MOVIMIENTOS = 4;

// Starters de Johto
export const STARTERS = {
  CHIKORITA: 152,
  CYNDAQUIL: 155,
  TOTODILE: 158,
};

// Sprites Gen II (PokeAPI)
export const SPRITE_FRENTE_URL = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/${id}.png`;

export const SPRITE_ESPALDA_URL = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/versions/generation-ii/gold/${id}.png`;
