/** Base visual PetCare: Safe Area, teclado y contenido desplazable; nunca usa alerts nativos. */
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { softSurfaceShadow } from '../../constants/surface';

type AppModalProps = PropsWithChildren<{ visible: boolean; dismissible?: boolean; onClose?: () => void }>;
export function AppModal({ visible, dismissible = false, onClose, children }: AppModalProps) {
  const { colors } = useTheme();
  const close = () => { if (dismissible) onClose?.(); };
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
    <SafeAreaView style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} disabled={!dismissible} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View role="dialog" accessibilityViewIsModal style={[styles.card, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }, keyboard: { pointerEvents: 'box-none', flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', maxWidth: 440, maxHeight: '90%', borderRadius: 26, borderWidth: 1, elevation: 4 },
  content: { padding: 22, gap: 16 },
});
