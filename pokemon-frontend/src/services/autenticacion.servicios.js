import axios from "axios";

const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${hostname}:8081`;
const API_URL = `${API_BASE_URL}/auth`;

// Preparo el envío de datos del formulario.
const registrar = (username, password) => {
  return axios.post(`${API_URL}/registrar`, {
    username,
    password,
  });
};


const iniciarSesion = (username, password) => {
  return axios
    .post(`${API_URL}/iniciarSesion`, {
      username,
      password,
    })
    .then((response) => {
      if (response?.data?.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    });
};

// cerrarSesion.
const cerrarSesion = () => {
  localStorage.removeItem("user");
};

export const servicioAutenticacion = {
  registrar,
  iniciarSesion,
  cerrarSesion,
};

