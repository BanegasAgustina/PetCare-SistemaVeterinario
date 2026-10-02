// Reglas estáticas para detectar errores sin imponer cambios de estilo innecesarios.
import tseslint from 'typescript-eslint';
export default tseslint.config(...tseslint.configs.recommended, { ignores: ['dist/**', 'node_modules/**'] });
