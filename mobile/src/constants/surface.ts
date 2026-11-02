/**
 * ARCHIVO: surface.ts
 * UBICACIÓN: mobile/src/constants/surface.ts
 * FUNCIÓN: Constantes compartidas de presentación o comportamiento.
 * RESPONSABILIDAD: Constantes compartidas de presentación o comportamiento dentro de PetCare; agrupa las declaraciones de surface.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/components/admin/AdminPersonRow.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/Storefront.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx
 * FUNCIONAMIENTO: Expone valores de referencia compartidos por los módulos que los importan.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import { Platform } from 'react-native';

/** Elevación discreta para superficies interactivas, teñida con el color del tema. */
/** Devuelve estilos de elevación adaptados a web o nativo según Platform.select. */
export function softSurfaceShadow(color: string) {
  return Platform.select({
    web: { boxShadow: `0 7px 20px ${color}20` },
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 2,
    },
  });
}
