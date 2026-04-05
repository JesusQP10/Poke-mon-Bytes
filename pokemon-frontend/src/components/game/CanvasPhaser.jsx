import { useEffect, useRef } from 'react';
import { crearJuegoPhaser } from '../../phaser/PhaserJuego';

/**
 * Componente React que monta y desmonta una instancia de Phaser.Game
 * dentro del div de 160×144 que gestiona PaginaJuego.jsx.
 *
 * onCambioPantalla(pantalla) → notifica a PaginaJuego para cambiar de escena React
 */
const CanvasPhaser = ({ onCambioPantalla }) => {
  const contenedorRef = useRef(null);
  const juegoRef = useRef(null);

  useEffect(() => {
    if (!contenedorRef.current || juegoRef.current) return;

    const callbacks = {
      onCambioPantalla,
    };

    juegoRef.current = crearJuegoPhaser(contenedorRef.current, callbacks);

    return () => {
      if (juegoRef.current) {
        juegoRef.current.destroy(true);
        juegoRef.current = null;
      }
    };
  }, []); // Linea deshabilitada por ahora

  return (
    <div
      ref={contenedorRef}
      style={{
        width: 160,
        height: 144,
        imageRendering: 'pixelated',
        overflow: 'hidden',
      }}
    />
  );
};

export default CanvasPhaser;
