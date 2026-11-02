/**
 * ARCHIVO: BackButton.tsx
 * UBICACIÓN: mobile/src/components/layout/BackButton.tsx
 * FUNCIÓN: Acción de regreso que usa la política compartida de historial y rol.
 * RESPONSABILIDAD: Permitir volver a la pantalla correcta en navegación de varios roles.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/hooks/useBackNavigation.ts Se utiliza desde: mobile/src/components/admin/AdminPageHeading.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/GlobalNavigation.tsx
 * FUNCIONAMIENTO: Si recibe callback lo ejecuta; si no, delega decisión a useBackNavigation y respeta ruta/fallback.
 * IMPORTANCIA: Evita que cada pantalla invente su propio comportamiento de volver.
 */
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useBackNavigation } from '../../hooks/useBackNavigation';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label?: string; style?: ViewStyle; onPress?: () => void };

/** Control de regreso compartido para encabezados de rutas secundarias. */
/** Muestra el botón y aplica callback explícito o política compartida de regreso. */
export function BackButton({ label = 'Volver', style, onPress }: Props) {
  const { colors } = useTheme();
  const { goBack } = useBackNavigation();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress ?? goBack} style={({ pressed }) => [styles.button, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }, style]}>
    <Ionicons name="arrow-back" size={22} color={colors.text} />
  </Pressable>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ button: { width: 48, height: 48, minWidth: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } });

