import { useEffect, useMemo, useState } from "react";
import oakSprite from "../../assets/game/opening/frames/oak/opening_oak_idle_01.png";
import marillSprite from "../../assets/game/opening/frames/marill/opening_marill_idle_01.png";
import playerSprite from "../../assets/game/overworld/sprites/player/pixilart_drawing.png";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaIzquierda,
  esTeclaDerecha,
  esTeclaArriba,
} from "../../config/controlesJuego";
import "./EscenaApertura.css";

const OPENING_LINES = [
  "\u00A1Hola! \u00A1Perdona por la espera!",
  "\u00A1Est\u00E1s en el mundo de los Pok\u00E9mon!",
  "Me llamo Oak.",
  "Pero me llaman Profesor Pok\u00E9mon.",
  "Este mundo est\u00E1 habitado por unas criaturas llamadas Pok\u00E9mon.",
  "La gente y los Pok\u00E9mon conviven ayud\u00E1ndose unos a otros.",
  "Algunos juegan con los Pok\u00E9mon, otros luchan con ellos.",
  "Pero a\u00FAn hay muchas cosas que no sabemos.",
  "Quedan muchos misterios por resolver.",
  "Por eso estudio a diario los Pok\u00E9mon.",
  "\u00BFC\u00F3mo has dicho que te llamas?",
];

const NAME_OPTIONS = ["Nuevo nombre", "Jes\u00FAs", "Oro", "Ethan"];

const MAX_CUSTOM_NAME_LENGTH = 10;
const KEYBOARD_COLUMNS = 7;
const NAME_KEYBOARD_KEYS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "DEL",
  "OK",
];

const KEYBOARD_ROWS = NAME_KEYBOARD_KEYS.length / KEYBOARD_COLUMNS;
const EMPTY_NAME_PLACEHOLDER = "__________";

// Manejar EscenaApertura.
const EscenaApertura = ({ onContinue }) => {
  const [mode, setMode] = useState("dialog");
  const [lineIndex, setLineIndex] = useState(0);
  const [nameIndex, setNameIndex] = useState(0);
  const [customName, setCustomName] = useState("");
  const [keyboardIndex, setKeyboardIndex] = useState(0);

  const currentLine = OPENING_LINES[lineIndex];
  const isLastLine = lineIndex === OPENING_LINES.length - 1;
  const showMarill = lineIndex >= 4;
  const selectedName = useMemo(() => NAME_OPTIONS[nameIndex], [nameIndex]);
  const selectedKeyboardKey = useMemo(() => NAME_KEYBOARD_KEYS[keyboardIndex], [keyboardIndex]);

  // Si el jugador pulsa algo, se gestiona aquí.
  const manejarSiguienteDialogo = () => {
    if (isLastLine) {
      setMode("nameSelect");
      return;
    }
    setLineIndex((prev) => prev + 1);
  };

  
  const manejarAtrasDialogo = () => {
    if (lineIndex === 0) {
      return;
    }
    setLineIndex((prev) => prev - 1);
  };

  
  const manejarNombreArriba = () => {
    setNameIndex((prev) => (prev - 1 + NAME_OPTIONS.length) % NAME_OPTIONS.length);
  };

  
  const manejarNombreAbajo = () => {
    setNameIndex((prev) => (prev + 1) % NAME_OPTIONS.length);
  };

  
  const manejarAceptarSeleccionNombre = () => {
    if (selectedName === "Nuevo nombre") {
      setMode("nameInput");
      setKeyboardIndex(0);
      return;
    }
    onContinue?.(selectedName);
  };

  
  const manejarAtrasSeleccionNombre = () => {
    return;
  };

 
  const manejarMovimientoTeclado = (rowDelta, colDelta) => {
    const currentRow = Math.floor(keyboardIndex / KEYBOARD_COLUMNS);
    const currentCol = keyboardIndex % KEYBOARD_COLUMNS;
    const nextRow = (currentRow + rowDelta + KEYBOARD_ROWS) % KEYBOARD_ROWS;
    const nextCol = (currentCol + colDelta + KEYBOARD_COLUMNS) % KEYBOARD_COLUMNS;
    setKeyboardIndex(nextRow * KEYBOARD_COLUMNS + nextCol);
  };

  
  const manejarAceptarTeclado = (keyOverride) => {
    const key = keyOverride ?? selectedKeyboardKey;

    if (key === "DEL") {
      setCustomName((prev) => prev.slice(0, -1));
      return;
    }

    if (key === "OK") {
      const finalName = customName.trim();
      if (!finalName) {
        return;
      }
      onContinue?.(finalName);
      return;
    }

    setCustomName((prev) => {
      if (prev.length >= MAX_CUSTOM_NAME_LENGTH) {
        return prev;
      }
      return `${prev}${key}`;
    });
  };

  
  const manejarAtrasTeclado = () => {
    setMode("nameSelect");
  };

  useEffect(() => {
    // Teclas que el jugador pulsa.
    const alPulsarTecla = (event) => {
      if (mode === "dialog") {
        if (esTeclaAceptar(event.code)) {
          event.preventDefault();
          manejarSiguienteDialogo();
        } else if (esTeclaAtras(event.code)) {
          event.preventDefault();
          manejarAtrasDialogo();
        }
        return;
      }

      if (mode === "nameSelect") {
        if (esTeclaArriba(event.code) || esTeclaIzquierda(event.code)) {
          event.preventDefault();
          manejarNombreArriba();
        } else if (esTeclaAbajo(event.code) || esTeclaDerecha(event.code)) {
          event.preventDefault();
          manejarNombreAbajo();
        } else if (esTeclaAceptar(event.code)) {
          event.preventDefault();
          manejarAceptarSeleccionNombre();
        } else if (esTeclaAtras(event.code)) {
          event.preventDefault();
          manejarAtrasSeleccionNombre();
        }
        return;
      }

      if (esTeclaArriba(event.code)) {
        event.preventDefault();
        manejarMovimientoTeclado(-1, 0);
      } else if (esTeclaAbajo(event.code)) {
        event.preventDefault();
        manejarMovimientoTeclado(1, 0);
      } else if (esTeclaIzquierda(event.code)) {
        event.preventDefault();
        manejarMovimientoTeclado(0, -1);
      } else if (esTeclaDerecha(event.code)) {
        event.preventDefault();
        manejarMovimientoTeclado(0, 1);
      } else if (esTeclaAceptar(event.code)) {
        event.preventDefault();
        manejarAceptarTeclado();
      } else if (esTeclaAtras(event.code)) {
        event.preventDefault();
        manejarAtrasTeclado();
      }
    };

    document.addEventListener("keydown", alPulsarTecla);
    return () => document.removeEventListener("keydown", alPulsarTecla);
  }, [mode, lineIndex, keyboardIndex, customName, nameIndex]);

  // Manejar renderizarPanelSeleccionNombre.
  const renderizarPanelSeleccionNombre = () => (
    <div className="op-name-layout">
      <div className="op-name-frame">
        {NAME_OPTIONS.map((name, index) => {
          const isSelected = index === nameIndex;
          return (
            <div
              key={name}
              className={`op-name-option ${isSelected ? "op-name-option--selected" : ""}`}
              onClick={() => setNameIndex(index)}
            >
              <span className="op-name-cursor">{isSelected ? ">" : "\u00A0"}</span>
              <span>{name}</span>
            </div>
          );
        })}
      </div>
      <div className="op-player-wrap">
        <img src={playerSprite} alt="Player" className="op-player" />
      </div>
    </div>
  );

  // Manejar renderizarPanelEntradaNombre.
  const renderizarPanelEntradaNombre = () => (
    <div className="op-name-layout op-name-layout--input">
      <div className="op-name-input-wrap">
        <div className="op-name-current-frame">
          <span className="op-name-current-label">NOMBRE</span>
          <span className="op-name-current-value">
            {customName || EMPTY_NAME_PLACEHOLDER.slice(0, MAX_CUSTOM_NAME_LENGTH)}
          </span>
        </div>

        <div className="op-keyboard-frame">
          <div className="op-keyboard-grid">
            {NAME_KEYBOARD_KEYS.map((key, index) => {
              const isSelected = index === keyboardIndex;
              const isAction = key === "DEL" || key === "OK";
              return (
                <button
                  key={`${key}-${index}`}
                  type="button"
                  className={`op-key ${isSelected ? "op-key--selected" : ""} ${isAction ? "op-key--action" : ""}`}
                  onClick={() => {
                    setKeyboardIndex(index);
                    manejarAceptarTeclado(key);
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="op-player-wrap op-player-wrap--input">
        <img src={playerSprite} alt="Player" className="op-player op-player--input" />
      </div>
    </div>
  );

  return (
    <div className="op-root">
      <div className="op-header">
        {mode === "dialog" ? "Professor Oak" : mode === "nameSelect" ? "Choose Name" : "Name Input"}
      </div>

      <div className="op-viewport">
        {mode === "dialog" ? (
          <div className="op-cast-wrap">
            <div className="op-oak-wrap">
              <img src={oakSprite} alt="Professor Oak" className="op-oak" />
            </div>
            <div className={`op-marill-wrap ${showMarill ? "op-marill-wrap--show" : ""}`}>
              <img src={marillSprite} alt="Marill" className="op-marill" />
            </div>
          </div>
        ) : mode === "nameSelect" ? (
          renderizarPanelSeleccionNombre()
        ) : (
          renderizarPanelEntradaNombre()
        )}
        <div className="op-scanlines" />
      </div>

      {mode === "dialog" ? (
        <div className="op-dialog">
          <div className="op-title">OAK</div>
          <p className="op-text">{currentLine}</p>

          <div className="op-footer">
            <button type="button" className="op-btn" onClick={manejarAtrasDialogo}>
              B BACK
            </button>
            <span className="op-progress">
              {lineIndex + 1}/{OPENING_LINES.length}
            </span>
            <button type="button" className="op-btn op-btn--primary" onClick={manejarSiguienteDialogo}>
              A NEXT
            </button>
          </div>
        </div>
      ) : mode === "nameSelect" ? (
        <div className="op-dialog op-dialog--name">
          
          <p className="op-text">{"Elige c\u00F3mo quieres que te llamen."}</p>

          <div className="op-footer">
            <button type="button" className="op-btn op-btn--disabled" onClick={manejarAtrasSeleccionNombre}>
              B BACK
            </button>
            <span className="op-progress">{selectedName}</span>
            <button type="button" className="op-btn op-btn--primary" onClick={manejarAceptarSeleccionNombre}>
              A SELECT
            </button>
          </div>
        </div>
      ) : (
        <div className="op-dialog op-dialog--name">
        
          <p className="op-text">Pulsa OK para confirmar.</p>

          <div className="op-footer">
            <button type="button" className="op-btn" onClick={manejarAtrasTeclado}>
              B MENU
            </button>
            <span className="op-progress">
              {customName.length}/{MAX_CUSTOM_NAME_LENGTH}
            </span>
            <button type="button" className="op-btn op-btn--primary" onClick={() => manejarAceptarTeclado("OK")}>
              A OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscenaApertura;
