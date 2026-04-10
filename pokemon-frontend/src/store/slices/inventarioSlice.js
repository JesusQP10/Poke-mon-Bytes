/**
 * Slice de Zustand para el inventario
 * Maneja: items, pokeballs, medicinas, etc.
 */

export const crearInventarioSlice = (set, get) => ({
  // Inventario
  inventario: [],

  // Setters
  addItem: (item) => set((state) => {
    // Verificar si el item ya existe
    const existente = state.inventario.find(i => i.id === item.id);
    
    if (existente) {
      // Si existe, incrementar cantidad
      return {
        inventario: state.inventario.map(i =>
          i.id === item.id
            ? { ...i, cantidad: i.cantidad + (item.cantidad || 1) }
            : i
        ),
      };
    } else {
      // Si no existe, añadir nuevo
      return {
        inventario: [
          ...state.inventario,
          { ...item, cantidad: item.cantidad || 1 },
        ],
      };
    }
  }),

  removeItem: (itemId, cantidad = 1) => set((state) => {
    return {
      inventario: state.inventario
        .map(item => {
          if (item.id === itemId) {
            const nuevaCantidad = item.cantidad - cantidad;
            return { ...item, cantidad: nuevaCantidad };
          }
          return item;
        })
        .filter(item => item.cantidad > 0),
    };
  }),

  setItemCantidad: (itemId, cantidad) => set((state) => ({
    inventario: state.inventario.map(item =>
      item.id === itemId ? { ...item, cantidad } : item
    ),
  })),

  tieneItem: (itemId) => {
    const state = get();
    return state.inventario.some(item => item.id === itemId && item.cantidad > 0);
  },

  getCantidadItem: (itemId) => {
    const state = get();
    const item = state.inventario.find(i => i.id === itemId);
    return item?.cantidad || 0;
  },

  // Reset
  resetInventario: () => set({
    inventario: [],
  }),
});
