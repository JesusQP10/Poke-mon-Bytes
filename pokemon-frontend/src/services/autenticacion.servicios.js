import api from './api';

// Auth no necesita el interceptor JWT (no hay token todavía),
// pero sí usamos la misma baseURL para no duplicar configuración.

const registrar = (username, password) =>
  api.post('/auth/registrar', { username, password });

const iniciarSesion = (username, password) =>
  api.post('/auth/iniciarSesion', { username, password }).then((response) => {
    if (response?.data?.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  });

const cerrarSesion = () => {
  localStorage.removeItem('user');
};

export const servicioAutenticacion = {
  registrar,
  iniciarSesion,
  cerrarSesion,
};
