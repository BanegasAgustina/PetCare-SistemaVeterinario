/** Base visual PetCare: Safe Area, teclado y contenido desplazable; nunca usa alerts nativos. */
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { softSurfaceShadow } from '../../constants/surface';

type AppModalProps = PropsWithChildren<{ visible: boolean; dismissible?: boolean; onClose?: () => void; size?: 'default' | 'wide'; footer?: ReactNode }>;
export function AppModal({ visible, dismissible = false, onClose, size = 'default', footer, children }: AppModalProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1024;
  const close = () => { if (dismissible) onClose?.(); };
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
    <SafeAreaView style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} disabled={!dismissible} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View role="dialog" accessibilityViewIsModal style={[styles.card, size === 'wide' && styles.wideCard, desktop && styles.desktopCard, desktop && size === 'wide' && styles.desktopWideCard, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView style={footer ? styles.scrollContent : undefined} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
          {footer && <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }, keyboard: { pointerEvents: 'box-none', flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', maxWidth: 440, maxHeight: '90%', borderRadius: 26, borderWidth: 1, elevation: 4 },
  wideCard: { maxWidth: 760 },
  desktopCard: { maxWidth: 600 },
  desktopWideCard: { maxWidth: 1000 },
  content: { padding: 22, gap: 16 }, scrollContent: { flexShrink: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10 },
});
