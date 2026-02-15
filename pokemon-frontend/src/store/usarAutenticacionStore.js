import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 'persist' guarda los datos en localStorage automáticamente.
// Si se recarga la página, sigue el iniciarSesion.

export const usarAutenticacionStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      estaAutenticado: false,

      // Acción para guardar datos al hacer Login
      establecerInicioSesion: (userData, token) => set({
        user: userData,
        token: token,
        estaAutenticado: true
      }),

      // Acción para Salir (Logout)
      cerrarSesion: () => set({
        user: null,
        token: null,
        estaAutenticado: false
      }),
    }),
    {
      name: 'auth-storage', // Nombre de la clave en localStorage
    }
  )
);

