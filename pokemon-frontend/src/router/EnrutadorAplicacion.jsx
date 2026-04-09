import { Routes, Route, Navigate } from "react-router-dom";
import PaginaInicio from "../pages/PaginaInicio";
import PaginaAcceso from "../pages/PaginaAcceso";
import PaginaRegistro from "../pages/PaginaRegistro";
import PaginaJuego from "../pages/PaginaJuego";
import { usarAutenticacionStore } from "../store/usarAutenticacionStore";

// Ruta protegida: redirige al login si no hay sesión activa
const RutaProtegida = ({ children }) => {
  const estaAutenticado = usarAutenticacionStore((s) => s.estaAutenticado);
  return estaAutenticado ? children : <Navigate to="/iniciarSesion" replace />;
};

export const EnrutadorAplicacion = () => {
  return (
    <Routes>
      <Route path="/" element={<PaginaInicio />} />
      <Route path="/iniciarSesion" element={<PaginaAcceso />} />
      <Route path="/registrar" element={<PaginaRegistro />} />
      <Route
        path="/game"
        element={
          <RutaProtegida>
            <PaginaJuego />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default EnrutadorAplicacion;
