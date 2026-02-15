export const TECLAS_CONTROL_JUEGO = {
  accept: ["KeyZ", "Enter", "NumpadEnter"],
  back: ["KeyX", "Escape"],
  up: ["KeyW", "ArrowUp"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  down: ["KeyS", "ArrowDown"],
};

export const esTeclaAceptar = (code) => TECLAS_CONTROL_JUEGO.accept.includes(code);
export const esTeclaAtras = (code) => TECLAS_CONTROL_JUEGO.back.includes(code);
export const esTeclaArriba = (code) => TECLAS_CONTROL_JUEGO.up.includes(code);
export const esTeclaAbajo = (code) => TECLAS_CONTROL_JUEGO.down.includes(code);
export const esTeclaIzquierda = (code) => TECLAS_CONTROL_JUEGO.left.includes(code);
export const esTeclaDerecha = (code) => TECLAS_CONTROL_JUEGO.right.includes(code);

