/**
 * ARCHIVO: useUnsavedChangesGuard.tsx
 * UBICACIÓN: mobile/src/hooks/useUnsavedChangesGuard.tsx
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useUnsavedChangesGuard.
 * CONEXIONES: Importa: mobile/src/components/ui/ConfirmModal.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx y 1 más
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import { useCallback, useState } from 'react';
import { usePreventRemove } from 'expo-router';
import { ConfirmModal } from '../components/ui/ConfirmModal';

/** Confirma el descarte ante botón, gesto, navegación programática y retroceso de Android. */
/** Previene salida si hay cambios, muestra ConfirmModal y permite continuar o descartar. */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  const [pendingExit, setPendingExit] = useState<{ action: () => void; isNavigation: boolean } | null>(null);
  const disablePrevention = usePreventRemove(hasUnsavedChanges, ({ repeat }) => setPendingExit({ action: repeat, isNavigation: true }));
  /** Cierra la confirmación y desactiva prevención antes de navegar tras un guardado exitoso. */
const allowNavigation = () => {
    setPendingExit(null);
    disablePrevention();
  };
  /** Ejecuta acción de inmediato si no hay cambios; si los hay, la guarda para pedir confirmación. */
  const confirmBeforeExit = useCallback((action: () => void) => {
    if (!hasUnsavedChanges) {
      action();
      return;
    }
    setPendingExit({ action, isNavigation: false });
  }, [hasUnsavedChanges]);
  const confirmation = <ConfirmModal
    visible={Boolean(pendingExit)}
    title="Cambios sin guardar"
    message="Tenés cambios sin guardar. ¿Querés salir sin guardar?"
    confirmLabel="Salir sin guardar"
    cancelLabel="Seguir editando"
    destructive
    onCancel={() => setPendingExit(null)}
    onConfirm={async () => {
      const exit = pendingExit;
      if (!exit) return;
      if (exit.isNavigation) disablePrevention();
      setPendingExit(null);
      exit.action();
    }}
  />;
  return { confirmation, allowNavigation, confirmBeforeExit };
}
