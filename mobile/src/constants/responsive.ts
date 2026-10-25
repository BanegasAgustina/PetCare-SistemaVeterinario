/** Breakpoints and layout values shared by the web layouts and adaptive components. */
export const responsiveLayout = {
  breakpoints: {
    compactCards: 520,
    tablet: 768,
    authDesktop: 1024,
    desktop: 1024,
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
  form: {
    minFieldWidth: 280,
    gap: 12,
  },
} as const;

export function isWebAtLeast(platform: string, width: number, breakpoint: number) {
  return platform === 'web' && width >= breakpoint;
}

export function desktopSidebarWidth(viewportWidth: number) {
  return Math.min(
    responsiveLayout.sidebar.maxWidth,
    Math.max(responsiveLayout.sidebar.minWidth, viewportWidth * responsiveLayout.sidebar.viewportRatio),
  );
}
