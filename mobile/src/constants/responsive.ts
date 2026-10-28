// Este archivo se encarga de lo siguiente: Valores de configuración compartidos para mantener criterios consistentes en la app.

/** Breakpoints and layout values shared by the web layouts and adaptive components. */
// Dato responsiveLayout: conserva un valor calculado o de configuración usado por este módulo.
export const responsiveLayout = {
  breakpoints: {
    compactCards: 520,
    tablet: 768,
    authDesktop: 1024,
    desktop: 1024,
    desktopTable: 1200,
    largeDesktop: 1440,
  },
  sidebar: {
    minWidth: 248,
    maxWidth: 280,
    viewportRatio: 0.19,
  },
  content: {
    mobileMaxWidth: 600,
    tabletMaxWidth: 960,
    desktopMaxWidth: 1320,
    wideDesktopMaxWidth: 1500,
    desktopBottomPadding: 32,
  },
  grid: {
    minItemWidth: 280,
    minWideItemWidth: 360,
    quickAccessMinItemWidth: 152,
    maxColumns: 4,
    gap: 16,
  },
  table: {
    compactBefore: 1440,
    comfortableCellPadding: 12,
    compactCellPadding: 8,
  },
  store: {
    productMinItemWidth: 220,
    productMaxColumns: 5,
    productImageMaxHeight: 190,
    promotionMaxWidth: 760,
    mobileBannerHeight: 168,
    tabletBannerHeight: 206,
    desktopBannerHeight: 244,
  },
  form: {
    minFieldWidth: 280,
    gap: 12,
  },
} as const;

// Función isWebAtLeast: comprueba una regla o condición dentro de este módulo.
export function isWebAtLeast(platform: string, width: number, breakpoint: number) {
  return platform === 'web' && width >= breakpoint;
}

// Función patientDetailPresentation: concentra la lógica dentro de este módulo.
export function patientDetailPresentation(platform: string, width: number) {
  return {
    twoColumns: isWebAtLeast(platform, width, responsiveLayout.breakpoints.desktop),
    clinicalTables: isWebAtLeast(platform, width, responsiveLayout.breakpoints.desktopTable),
  };
}

// Función desktopSidebarWidth: concentra la lógica dentro de este módulo.
export function desktopSidebarWidth(viewportWidth: number) {
  return Math.min(
    responsiveLayout.sidebar.maxWidth,
    Math.max(responsiveLayout.sidebar.minWidth, viewportWidth * responsiveLayout.sidebar.viewportRatio),
  );
}
