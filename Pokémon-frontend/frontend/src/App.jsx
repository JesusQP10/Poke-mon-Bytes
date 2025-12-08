import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';

// Componente temporal para probar que entraste
const GameMenu = () => {
  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div style={{textAlign: 'center', marginTop: '50px'}}>
      <h1>MUNDO POKÉMON</h1>
      <p>¡Bienvenido, Entrenador!</p>
      <p>Aquí irá el mapa de Phaser.</p>
      <button onClick={logout} style={{backgroundColor: 'red', color: 'white'}}>Salir</button>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Comprobamos si hay token al arrancar
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Si no está registrado, vas al Login. Si sí, al Juego */}
        <Route 
          path="/" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/game" />} 
        />
        
        {/* Ruta protegida del juego */}
        <Route 
          path="/game" 
          element={isAuthenticated ? <GameMenu /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
