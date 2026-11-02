/**
 * ARCHIVO: theme.ts
 * UBICACIÓN: mobile/src/constants/theme.ts
 * FUNCIÓN: Constantes compartidas de presentación o comportamiento.
 * RESPONSABILIDAD: Constantes compartidas de presentación o comportamiento dentro de PetCare; agrupa las declaraciones de theme.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/contexts/ThemeContext.tsx
 * FUNCIONAMIENTO: Expone valores de referencia compartidos por los módulos que los importan.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Tokens visuales basados en imagenes/paleta de colores .png. */
// Configuración sharedColors: reúne valores o reglas que consume el resto del módulo.
const sharedColors = {
  danger: "#c98292",
  logoBackground: "#def1ea",
  onPrimary: "#ffffff",
  highlight: "#f0b4c5",
  onHighlight: "#173e35",
  focus: "#146b55",
};
// Configuración themes: reúne valores o reglas que consume el resto del módulo.
export const themes = {
  light: {
    ...sharedColors,
    background: "#f3f8f5",
    surface: "#ffffff",
    text: "#173e35",
    muted: "#385b53",
    primary: "#146b55",
    border: "#c6ded4",
    accent: "#def1ea",
  },
  dark: {
    ...sharedColors,
    focus: "#68c6a1",
    danger: "#f0b4c5",
    background: "#0f211c",
    surface: "#214b3f",
    text: "#edf7f2",
    muted: "#a9beb6",
    primary: "#a9beb6",
    onPrimary: "#0f211c",
    border: "#315047",
    accent: "#315047",
  },
};
