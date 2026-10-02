/** Feedback breve propio: una notificación a la vez, no bloquea y desaparece automáticamente. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, Pressable, StyleSheet, View, AccessibilityInfo, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../components/ui/AppText';
import { useTheme } from '../hooks/useTheme';

type Kind = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; kind: Kind };
type Feedback = { showToast: (message: string, kind?: Kind) => void };
const FeedbackContext = createContext<Feedback | undefined>(undefined);
export function FeedbackProvider({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const sequence = useRef(0);
  const [opacity] = useState(() => new Animated.Value(0));
  const showToast = useCallback((message: string, kind: Kind = 'info') => setToast({ id: ++sequence.current, message, kind }), []);
  useEffect(() => {
    if (!toast) return;
    let active = true;
    // Reduce Motion se respeta; el fade no bloquea ningún control de la pantalla.
    void AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) return;
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: reduce ? 0 : 160, useNativeDriver: Platform.OS !== 'web' }).start();
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
export function useFeedback(): Feedback {
  const feedback = useContext(FeedbackContext);
  if (!feedback) throw new Error('useFeedback requiere FeedbackProvider.');
  return feedback;
}
const styles = StyleSheet.create({
  position: { pointerEvents: 'box-none', position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { width: '100%', maxWidth: 460, flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingLeft: 14, paddingVertical: 8, gap: 10 },
  message: { flex: 1, fontSize: 14, lineHeight: 20 }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
