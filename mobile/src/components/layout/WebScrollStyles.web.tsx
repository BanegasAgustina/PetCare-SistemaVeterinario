/**
 * ARCHIVO: WebScrollStyles.web.tsx
 * UBICACIÓN: mobile/src/components/layout/WebScrollStyles.web.tsx
 * FUNCIÓN: Inyecta estilos globales de desplazamiento para la versión web.
 * RESPONSABILIDAD: Ajustar scrollbar y contención de scroll del documento web.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Renderiza reglas CSS web desde el layout raíz; no contiene estado de dominio.
 * IMPORTANCIA: Mantiene el desplazamiento consistente en navegador, aislado de la variante nativa.
 */
import { useEffect } from 'react';

/** Hides only scroll indicators on explicitly marked React Native Web scroll areas. */
/** Instala las reglas CSS globales de scroll cuando se ejecuta en navegador. */
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
