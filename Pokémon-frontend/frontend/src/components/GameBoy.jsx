import React, { useState } from 'react';

const GameBoy = ({ children, onStartPress, onAButtonPress, onBButtonPress }) => {
  const [isRotated, setIsRotated] = useState(false);

  return (
    <div 
      className={`gbc-body ${isRotated ? 'rotated' : ''}`}
      onClick={() => setIsRotated(!isRotated)}
    >
      <div className="screen-lens" onClick={(e) => e.stopPropagation()}>
        <div className="power-indicator">
          <div className="led-light"></div>
          <span className="power-text">BATTERY</span>
        </div>

        <div className="lcd-container">
          <div className="lcd-active">
            {children}
          </div>
        </div>

        <div className="lens-branding">
          GAME BOY <span className="c">C</span><span className="o1">O</span><span className="l">L</span><span className="o2">O</span><span className="r">R</span>
        </div>
      </div>

      <div className="controls-section" onClick={(e) => e.stopPropagation()}>
        <div className="nintendo-emboss">Nintendo</div>
        <div className="buttons-area">
            <div className="dpad">
                <div className="dpad-cross dpad-h"></div>
                <div className="dpad-cross dpad-v"></div>
                <div className="dpad-center-dent"></div>
            </div>
            <div className="action-buttons">
                <div className="btn-round pos-a" onClick={onAButtonPress}>
                    <div className="btn-label label-a">A</div>
                </div>
                <div className="btn-round pos-b" onClick={onBButtonPress}>
                    <div className="btn-label label-b">B</div>
                </div>
            </div>
        </div>
        
        <div className="start-select-group">
            <div className="flex flex-col items-center">
                <div className="pill-btn"></div>
                <span className="pill-label">SELECT</span>
            </div>
            <div className="flex flex-col items-center">
                <div 
                    className="pill-btn" 
                    onClick={onStartPress} 
                    title="Pulsa aquí para empezar"
                ></div>
                <span className="pill-label">START</span>
            </div>
        </div>
        
        <div className="speaker-grille">
            <div className="slot"></div><div className="slot"></div><div className="slot"></div>
            <div className="slot"></div><div className="slot"></div><div className="slot"></div>
        </div>
      </div>
    </div>
  );
};

export default GameBoy;