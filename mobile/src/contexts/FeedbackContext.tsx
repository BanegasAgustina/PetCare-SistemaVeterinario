/**
 * ARCHIVO: FeedbackContext.tsx
 * UBICACIÓN: mobile/src/contexts/FeedbackContext.tsx
 * FUNCIÓN: Proveedor de estado compartido.
 * RESPONSABILIDAD: Proveedor de estado compartido dentro de PetCare; agrupa las declaraciones de FeedbackContext.
 * CONEXIONES: Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx y 19 más
 * FUNCIONAMIENTO: Mantiene estado compartido y lo expone a los componentes descendientes mediante Context.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Feedback breve propio: una notificación a la vez, no bloquea y desaparece automáticamente. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, Pressable, StyleSheet, View, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../hooks/useTheme';

/** Clases visuales permitidas para un toast. */
type Kind = 'success' | 'error' | 'info';
/** Aviso visible con ID para gestionar su animación/ciclo de vida. */
type Toast = { id: number; message: string; kind: Kind };
/** Contrato mínimo consumido por pantallas que informan una acción. */
type Feedback = { showToast: (message: string, kind?: Kind) => void };
// Contexto opcional: useFeedback produce un error claro si falta el provider.
const FeedbackContext = createContext<Feedback | undefined>(undefined);
/** Provee showToast y renderiza un aviso temporal accesible usando colores y safe area actuales. */
export function FeedbackProvider({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const sequence = useRef(0);
  const [opacity] = useState(() => new Animated.Value(0));
  /** Reemplaza el aviso visible con un mensaje nuevo y un ID que reinicia su ciclo de vida. */
  const showToast = useCallback((message: string, kind: Kind = 'info') => setToast({ id: ++sequence.current, message, kind }), []);
  useEffect(() => {
    if (!toast) return;
    let active = true;
    // Reduce Motion se respeta; el fade no bloquea ningún control de la pantalla.
    void AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) return;
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: reduce ? 0 : 160, useNativeDriver: false }).start();
    });
    const timeout = setTimeout(() => setToast(null), 4500);
    return () => { active = false; clearTimeout(timeout); opacity.stopAnimation(); };
  }, [toast, opacity]);
  return <FeedbackContext.Provider value={{ showToast }}>{children}
    {toast && <View style={[styles.position, { bottom: insets.bottom + 14 }]}>
      <Animated.View accessibilityLiveRegion="polite" style={[styles.toast, { opacity, backgroundColor: colors.surface, borderColor: toast.kind === 'error' ? colors.danger : colors.primary }]}>
        <Ionicons name={toast.kind === 'success' ? 'checkmark-circle-outline' : toast.kind === 'error' ? 'warning-outline' : 'information-circle-outline'} size={22} color={toast.kind === 'error' ? colors.danger : colors.primary} accessible={false} />
        <AppText style={styles.message}>{toast.message}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar notificación" onPress={() => setToast(null)} style={styles.close}><Ionicons name="close" size={20} color={colors.muted} accessible={false} /></Pressable>
      </Animated.View>
    </View>}
  </FeedbackContext.Provider>;
}
/** Consume FeedbackContext y falla si falta FeedbackProvider en el árbol. */
export function useFeedback(): Feedback {
  const feedback = useContext(FeedbackContext);
  if (!feedback) throw new Error('useFeedback requiere FeedbackProvider.');
  return feedback;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  position: { pointerEvents: 'box-none', position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { width: '100%', maxWidth: 460, flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingLeft: 14, paddingVertical: 8, gap: 10 },
  message: { flex: 1, fontSize: 14, lineHeight: 20 }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
