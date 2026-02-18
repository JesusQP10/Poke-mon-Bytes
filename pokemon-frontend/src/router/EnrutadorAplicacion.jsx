import { Routes, Route, Navigate } from "react-router-dom";
import PaginaInicio from "../pages/PaginaInicio";
import PaginaAcceso from "../pages/PaginaAcceso";
import PaginaRegistro from "../pages/PaginaRegistro";
import PaginaJuego from "../pages/PaginaJuego";

// manejar EnrutadorAplicacion.
export const EnrutadorAplicacion = () => {
  return (
    <Routes>
      <Route path="/" element={<PaginaInicio />} />
      <Route path="/iniciarSesion" element={<PaginaAcceso />} />
      <Route path="/registrar" element={<PaginaRegistro />} />
      <Route path="/game" element={<PaginaJuego />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default EnrutadorAplicacion;

