import { useEffect, useRef } from 'react';
import { crearJuegoPhaser } from '../../phaser/PhaserJuego';

/**
 * Monta Phaser.Game en el div 160×144.
 *
 * @param {{ current: {
 *   onCambioPantalla?: (p: string) => void,
 *   onTextoEstatico?: (p: { lineas: string[], onCerrar: () => void }) => void,
 *   onAbrirMenuIngame?: (p: { resumePhaser: () => void }) => void,
 *   onBatallaUi?: (p: unknown) => void
 * } }} callbacksRef
 *        Ref actualizada por el padre en cada render para que los callbacks no queden obsoletos.
 */
const CanvasPhaser = ({ callbacksRef }) => {
  const contenedorRef = useRef(null);
  const juegoRef = useRef(null);

  useEffect(() => {
    if (!contenedorRef.current || juegoRef.current) return;

    const ref = callbacksRef ?? { current: {} };
    juegoRef.current = crearJuegoPhaser(contenedorRef.current, {
      onCambioPantalla: (pantalla) => ref.current.onCambioPantalla?.(pantalla),
      onTextoEstatico: (payload) => ref.current.onTextoEstatico?.(payload),
      onAbrirMenuIngame: (payload) => ref.current.onAbrirMenuIngame?.(payload),
      onBatallaUi: (payload) => ref.current.onBatallaUi?.(payload),
    });

    // El canvas real lo inyecta Phaser dentro del contenedor; hay que forzarle
    // image-rendering para evitar blur al escalar con CSS transform.
    const canvas = contenedorRef.current.querySelector('canvas');
    if (canvas) {
      canvas.style.imageRendering = 'pixelated';
      // Compatibilidad extra (algunos navegadores respetan esto mejor)
      canvas.style.setProperty('image-rendering', 'crisp-edges');
    }

    return () => {
      juegoRef.current?.destroy(true);
      juegoRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
