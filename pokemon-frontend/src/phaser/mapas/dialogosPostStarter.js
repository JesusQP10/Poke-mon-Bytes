/**
 * Diálogos cuando el jugador ya tiene inicial (sustituyen al texto “elige uno” / visita a Elm).
 */

/**
 * @param {string} nombreJugador
 * @param {string} nombrePokemon Nombre del inicial en el equipo.
 * @param {boolean} pocionEntregada
 * @returns {string[]}
 */
export function lineasProfElmTrasStarter(nombreJugador, nombrePokemon, pocionEntregada) {
  const n = nombrePokemon || 'tu Pokémon';
  if (!pocionEntregada) {
    return [
      `¡${nombreJugador}! Veo que ya elegiste.`,
      `¡${n} parece llevarse bien contigo!`,
      'Mi ayudante está junto a la salida.\nTiene algo para el camino.',
      '¡No te vayas sin hablar con él!',
    ];
  }
  return [
    `¡${nombreJugador}! ¿Cómo va ${n}?`,
    'Sigue cuidándolo y observa\nbien a los Pokémon salvajes.',
    '¡La región Johto esconde\nmuchas sorpresas!',
  ];
}

/**
 * @param {string} nombreJugador
 * @param {string} nombrePokemon
 * @returns {string[]}
 */
export function lineasMadreTrasStarter(nombreJugador, nombrePokemon) {
  const n = nombrePokemon || 'ese Pokémon';
  return [
    `¡${nombreJugador}! ¿Ese Pokémon\nte lo dio el PROF. ELM?`,
    `¡${n} tiene muy buena pinta!`,
    'Cuídalo con mimo. Y usa el\nPOKÉGEAR si necesitas algo.',
    '¡Vuelve pronto a casa, cariño!',
  ];
}
