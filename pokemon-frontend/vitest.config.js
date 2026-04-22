import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** Devuelve el nombre de archivo como string para cualquier asset estático. */
function mockStaticAssets() {
  return {
    name: 'vitest-mock-assets',
    transform(_, id) {
      if (/\.(gif|png|jpg|jpeg|svg|webp|mp3|ogg|wav)(\?.*)?$/.test(id)) {
        const filename = id.split('/').pop().split('?')[0];
        return { code: `export default ${JSON.stringify(filename)}` };
      }
    },
  };
}

export default defineConfig({
  plugins: [mockStaticAssets(), react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/__tests__/**/*.test.js'],
  },
});
