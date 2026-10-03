// Configuración oficial de Expo para revisar TypeScript y componentes React Native.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([expoConfig, { ignores: ['dist/**', 'src-backups/**'] }, {
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    // La regla de UX es global: los errores usan inline, las confirmaciones modal y el feedback toast.
    'no-restricted-globals': ['error', 'alert', 'confirm', 'prompt'],
    'no-restricted-imports': ['error', { paths: [{ name: 'react-native', importNames: ['Alert'], message: 'Usá AppModal, ConfirmModal, feedback inline o useFeedback.' }] }],
    'no-restricted-properties': ['error', { property: 'alert', message: 'PetCare no utiliza alerts nativos.' }, { property: 'confirm', message: 'Usá ConfirmModal.' }, { property: 'prompt', message: 'Usá un formulario PetCare.' }],
  },
}]);
