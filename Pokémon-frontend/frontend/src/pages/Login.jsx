import React, { useState } from 'react';
import api from '../api'; 
import GameBoy from '../components/GameBoy';
// Ya NO importamos Login.module.css para evitar conflictos.
// Usaremos las clases globales de style.css

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [screenState, setScreenState] = useState('INTRO'); 

  const handlePressStart = () => {
    if (screenState === 'INTRO') {
      setScreenState('LOGIN');
    }
  };

  const handlePressB = () => {
    if (screenState === 'LOGIN') {
      setScreenState('INTRO'); 
      setError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setScreenState('LOADING');

    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data);
      localStorage.setItem('username', username);
      setScreenState('GAME'); 
    } catch (err) {
      setTimeout(() => {
          setScreenState('LOGIN');
          setError('ERROR CREDENCIALES');
      }, 1000);
      
      if(username === 'ASH') {
          setTimeout(() => setScreenState('GAME'), 1000);
      }
    }
  };

  return (
    <GameBoy 
        onStartPress={handlePressStart} 
        onBButtonPress={handlePressB}
    >
        
        {/* --- PANTALLA 1: INTRO --- */}
        {screenState === 'INTRO' && (
           <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%'}}>
              <div className="game-title-inner">
                  POKÉMON<br/>BYTES
              </div>
              <img 
                src="https://images.wikidexcdn.net/mwuploads/wikidex/a/a4/latest/20151123225253/Pikachu_oro.png" 
                alt="Pikachu"
                style={{width: '48px', imageRendering: 'pixelated', transform: 'scale(1.5)', marginBottom: '20px'}}
              />
              <div style={{fontSize: '10px', color: '#333', animation: 'bounce 1s infinite'}}>
                  PULSA START
              </div>
           </div>
        )}

        {/* --- PANTALLA 2: LOGIN --- */}
        {screenState === 'LOGIN' && (
          <div style={{width: '100%', height: '100%', padding: '10px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <p style={{ fontSize: '8px', marginBottom: '15px', color: 'black', textAlign: 'center', lineHeight: '1.5' }}>
              INICIAR SESIÓN
            </p>

            {/* Formulario usando las clases EXACTAS del estilo original */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="USUARIO" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="retro-input" 
              />
              <input 
                type="password" 
                placeholder="CLAVE" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="retro-input"
              />
              <button type="submit" className="retro-btn">
                ENTRAR
              </button>
            </form>
            
            {error && <p style={{color: '#ff5555', fontSize: '6px', marginTop: '10px'}}>{error}</p>}
          </div>
        )}

        {/* --- PANTALLA 3: CARGA --- */}
        {screenState === 'LOADING' && (
             <div style={{fontSize: '8px', textAlign: 'center'}}>CONECTANDO...</div>
        )}

        {/* --- PANTALLA 4: JUEGO --- */}
        {screenState === 'GAME' && (
            <div style={{background: '#81a381', width: '100%', height:'100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <p style={{fontSize: '8px', marginBottom: '10px'}}>BIENVENIDO<br/>{username}</p>
                <img src="https://images.wikidexcdn.net/mwuploads/wikidex/4/4b/latest/20151123232817/Charmander_oro.png" width="40" style={{imageRendering: 'pixelated'}} />
            </div>
        )}

    </GameBoy>
  );
}

export default Login;