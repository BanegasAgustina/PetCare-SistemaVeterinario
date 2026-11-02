/**
 * ARCHIVO: responsive.ts
 * UBICACIÓN: mobile/src/constants/responsive.ts
 * FUNCIÓN: Constantes compartidas de presentación o comportamiento.
 * RESPONSABILIDAD: Constantes compartidas de presentación o comportamiento dentro de PetCare; agrupa las declaraciones de responsive.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/notifications.tsx, mobile/src/app/client/orders/index.tsx y 26 más
 * FUNCIONAMIENTO: Expone valores de referencia compartidos por los módulos que los importan.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Breakpoints y dimensiones compartidos por layouts web y componentes adaptables. */
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

/** Indica si la plataforma es web y el ancho alcanza el breakpoint indicado. */
export function isWebAtLeast(platform: string, width: number, breakpoint: number) {
  return platform === 'web' && width >= breakpoint;
}

/** Activa dos columnas/tablas clínicas solo al alcanzar los anchos definidos para desktop. */
export function patientDetailPresentation(platform: string, width: number) {
  return {
    twoColumns: isWebAtLeast(platform, width, responsiveLayout.breakpoints.desktop),
    clinicalTables: isWebAtLeast(platform, width, responsiveLayout.breakpoints.desktopTable),
  };
}

/** Calcula ancho de sidebar como proporción del viewport, limitado por mínimo y máximo establecidos. */
export function desktopSidebarWidth(viewportWidth: number) {
  return Math.min(
    responsiveLayout.sidebar.maxWidth,
    Math.max(responsiveLayout.sidebar.minWidth, viewportWidth * responsiveLayout.sidebar.viewportRatio),
  );
}
