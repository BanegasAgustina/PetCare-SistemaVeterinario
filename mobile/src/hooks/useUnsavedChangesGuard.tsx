// Este archivo se encarga de lo siguiente: Hook reutilizable de React; concentra estado o comportamiento que pueden compartir varias pantallas.

import { useCallback, useState } from 'react';
import { usePreventRemove } from 'expo-router';
import { ConfirmModal } from '../components/ui/ConfirmModal';

/** Confirma el descarte ante botón, gesto, navegación programática y retroceso de Android. */
// Función useUnsavedChangesGuard: concentra la lógica dentro de este módulo.
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  const [pendingExit, setPendingExit] = useState<{ action: () => void; isNavigation: boolean } | null>(null);
  const disablePrevention = usePreventRemove(hasUnsavedChanges, ({ repeat }) => setPendingExit({ action: repeat, isNavigation: true }));
  // Función allowNavigation: agrupa una operación que este módulo puede ejecutar o reutilizar.
const allowNavigation = () => {
    setPendingExit(null);
    disablePrevention();
  };
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
