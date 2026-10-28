// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

import { useEffect } from 'react';

/** Hides only scroll indicators on explicitly marked React Native Web scroll areas. */
// Función WebScrollStyles: concentra la lógica dentro de este módulo.
export function WebScrollStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.dataset.petcareWebScroll = 'true';
    style.textContent = `
      [id^="petcare-web-scroll-"] {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      [id^="petcare-web-scroll-"]::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return null;
}
