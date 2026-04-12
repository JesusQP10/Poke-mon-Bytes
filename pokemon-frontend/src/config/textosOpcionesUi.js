/**
 * Cadenas del panel OPCIONES (título e in-game) según idioma UI.
 * Los diálogos del mundo Phaser siguen en español hasta externalizarlos.
 * @param {'es' | 'en'} locale
 */
export function textosPanelOpciones(locale) {
  if (locale === "en") {
    return {
      titulo: "SETTINGS",
      musica: "Music",
      sonidos: "Sound",
      texto: "Text",
      idioma: "Language",
      sonidoSi: "ON",
      sonidoNo: "OFF",
      textoVelRapido: "FAST",
      textoVelNormal: "NORMAL",
      hintOpciones: "↑↓ · ←→ or Z · X close",
      hintOpcionesIngame: "↑↓ · ←→ or Z · X menu",
      notaFilaOpciones: "← → or Z on row",
    };
  }
  return {
    titulo: "OPCIONES",
    musica: "Música",
    sonidos: "Sonidos",
    texto: "Texto",
    idioma: "Idioma",
    sonidoSi: "SÍ",
    sonidoNo: "NO",
    textoVelRapido: "RÁPIDO",
    textoVelNormal: "NORMAL",
    hintOpciones: "↑↓ · ←→ o Z · X cerrar",
    hintOpcionesIngame: "↑↓ · ←→ o Z · X menú",
    notaFilaOpciones: "← → o Z en la fila",
  };
}
