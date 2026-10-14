/** Tokens visuales basados en imagenes/paleta de colores .png. */
const sharedColors = {
  danger: "#c85454",
  logoBackground: "#def1ea",
  onPrimary: "#ffffff",
};
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
    danger: "#ffb4b4",
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
