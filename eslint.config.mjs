import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores(['.next/**','node_modules/**','test-results/**','data/**','.chrome-tmp/**','next-env.d.ts','gitea/**','tmp/**']),
]);
