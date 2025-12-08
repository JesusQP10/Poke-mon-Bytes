import React from 'react'
import ReactDOM from 'react-dom/client'
import Login from './pages/Login'
import './styles/style.css' // Importa los estilos globales corregidos

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Contenedor principal que simula el body del HTML original */}
    <div className="flex flex-col items-center min-h-screen justify-center">
        
        {/* TÍTULO CON CLASES DE TAILWIND ORIGINALES */}
        <div className="text-center mt-6 mb-2 z-10">
            <h1 className="text-3xl md:text-5xl text-yellow-400 drop-shadow-[4px_4px_0_#000] animate-pulse" 
                style={{ fontFamily: '"Press Start 2P", cursive' }}>
                POKÉMON BYTES
            </h1>
        </div>
        
        {/* La App (Game Boy) */}
        <Login />
        
        {/* Footer estilo original */}
        <nav className="flex flex-wrap justify-center mb-8 z-10 gap-4 mt-4">
            <span style={{
                display: 'inline-block', margin: '10px', padding: '8px 16px', 
                border: '2px solid #555', background: '#222', color: '#ccc', 
                fontSize: '10px', boxShadow: '4px 4px 0 #000', cursor: 'pointer'
            }}>GITHUB</span>
        </nav>
    </div>
  </React.StrictMode>,
)