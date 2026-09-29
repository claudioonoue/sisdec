import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * Testes do Portal de Operações.
 *
 * O alvo são as peças que **decidem** algo: o recorte lido da URL, a tradução de
 * falhas da API, os rótulos das enumerações e os componentes que já falharam em
 * produção de forma silenciosa. Telas inteiras e Server Actions ficam de fora —
 * elas dependem da API no ar, e a verificação delas é o percurso manual descrito
 * no registro de progresso.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    globals: true,
  },
});
