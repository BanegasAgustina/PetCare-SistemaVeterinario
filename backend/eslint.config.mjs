/**
 * ARCHIVO: eslint.config.mjs
 * UBICACIÓN: backend/eslint.config.mjs
 * FUNCIÓN: Configura ESLint con reglas recomendadas para TypeScript y exclusiones de salida.
 * RESPONSABILIDAD: Aplicar análisis estático común al código fuente del backend.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expande el preset recomendado de typescript-eslint e ignora dist y node_modules.
 * IMPORTANCIA: Es la configuración consumida por los comandos lint del paquete backend.
 */
// Reglas estáticas para detectar errores sin imponer cambios de estilo innecesarios.
import tseslint from 'typescript-eslint';
export default tseslint.config(...tseslint.configs.recommended, { ignores: ['dist/**', 'node_modules/**'] });
