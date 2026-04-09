import { useEffect, useRef } from 'react';
import { crearJuegoPhaser } from '../../phaser/PhaserJuego';

/**
 * Monta y desmonta una instancia de Phaser.Game dentro del div 160×144
 * que gestiona PaginaJuego.jsx.
 *
 * onCambioPantalla(pantalla) → notifica a PaginaJuego para cambiar de escena React.
 */
const CanvasPhaser = ({ onCambioPantalla }) => {
  const contenedorRef = useRef(null);
  const juegoRef = useRef(null);

  useEffect(() => {
    // Evitar crear múltiples instancias de Phaser
    if (!contenedorRef.current || juegoRef.current) return;

    juegoRef.current = crearJuegoPhaser(contenedorRef.current, { onCambioPantalla });

    return () => {
      juegoRef.current?.destroy(true);
      juegoRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar/desmontar — Phaser gestiona su propio ciclo de vida

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
