import { defineConfig } from 'vitest/config';

// Configuracion adicional para "ng test". Las pruebas que evidencian defectos conocidos fallan a
// proposito, por eso el reporte de cobertura (lcov para SonarQube) se genera aunque haya fallos.
export default defineConfig({
  test: {
    coverage: {
      reportOnFailure: true,
      reportsDirectory: 'coverage/front',
      exclude: ['src/test-setup.ts', 'src/testing/**']
    }
  }
});
