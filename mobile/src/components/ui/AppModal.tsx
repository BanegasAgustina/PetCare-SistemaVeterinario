/**
 * ARCHIVO: AppModal.tsx
 * UBICACIÓN: mobile/src/components/ui/AppModal.tsx
 * FUNCIÓN: Contenedor modal común con cierre opcional, áreas desplazables y pie configurable.
 * RESPONSABILIDAD: Mantener diálogos adaptables y accesibles en web y móvil.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/surface.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/components/admin/ConfirmNameModal.tsx y 17 más
 * FUNCIONAMIENTO: Recibe visibilidad, contenido, tamaño y pie; aplica áreas seguras y comportamiento de teclado, y solo cierra por interacción cuando dismissible lo permite.
 * IMPORTANCIA: Da un patrón común para formularios, detalles y confirmaciones modales.
 */
/** Base visual PetCare: Safe Area, teclado y contenido desplazable; nunca usa alerts nativos. */
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { softSurfaceShadow } from '../../constants/surface';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

// Tipo AppModalProps: define la forma o las opciones válidas de los datos usados por este módulo.
type AppModalProps = PropsWithChildren<{ visible: boolean; dismissible?: boolean; onClose?: () => void; size?: 'default' | 'wide'; footer?: ReactNode }>;
/** Muestra contenido en un modal adaptado a pantalla y tema, con cierre controlado. */
export function AppModal({ visible, dismissible = false, onClose, size = 'default', footer, children }: AppModalProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  /** Cierra el modal solo cuando la propiedad dismissible lo permite. */
const close = () => { if (dismissible) onClose?.(); };
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
    <SafeAreaView style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} disabled={!dismissible} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View role="dialog" accessibilityViewIsModal style={[styles.card, size === 'wide' && styles.wideCard, desktop && styles.desktopCard, desktop && size === 'wide' && styles.desktopWideCard, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView nativeID={Platform.OS==='web'?'petcare-web-scroll-modal':undefined} style={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
          {footer && <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }, keyboard: { pointerEvents: 'box-none', flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '92%', maxWidth: 440, maxHeight: '90%', minHeight: 0, borderRadius: 20, borderWidth: 1, elevation: 4, overflow: 'hidden' },
  wideCard: { maxWidth: 760 },
  desktopCard: { maxWidth: 600 },
  desktopWideCard: { maxWidth: 1000 },
  content: { padding: 20, gap: 14 }, scrollContent: { flexShrink: 1, minHeight: 0 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 9 },
});
