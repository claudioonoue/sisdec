import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * Testes do Portal do Cidadão.
 *
 * O alvo são as peças que **decidem** algo: a tradução de falhas da API em texto
 * que o cidadão entende, os rótulos vindos de `GET /metadata` e os dados que
 * aparecem em mais de uma tela — como os telefones de emergência, onde um número
 * divergente seria um defeito grave. Telas inteiras ficam de fora: dependem da
 * API no ar, e a verificação delas é o percurso manual descrito no registro de
 * progresso.
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
