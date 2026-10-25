import { useEffect } from 'react';

/** Hides only scroll indicators on explicitly marked React Native Web scroll areas. */
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
