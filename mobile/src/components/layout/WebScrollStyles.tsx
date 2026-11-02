/**
 * ARCHIVO: WebScrollStyles.tsx
 * UBICACIÓN: mobile/src/components/layout/WebScrollStyles.tsx
 * FUNCIÓN: Pieza nativa sin estilos globales de scroll web.
 * RESPONSABILIDAD: Mantener una interfaz común en plataformas donde no aplica CSS de navegador.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/_layout.tsx
 * FUNCIONAMIENTO: Renderiza un componente vacío en la variante nativa; Metro selecciona la variante según plataforma.
 * IMPORTANCIA: Evita introducir código web en el bundle nativo.
 */
/** Native platforms keep their existing scroll indicators. */
/** Renderiza vacío en nativo, donde no se aplican reglas CSS globales de scroll. */
export function WebScrollStyles() {
  return null;
}
