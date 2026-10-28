// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useBackNavigation } from '../../hooks/useBackNavigation';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label?: string; style?: ViewStyle; onPress?: () => void };

/** Control de regreso compartido para encabezados de rutas secundarias. */
// Función BackButton: concentra la lógica dentro de este módulo.
export function BackButton({ label = 'Volver', style, onPress }: Props) {
  const { colors } = useTheme();
  const { goBack } = useBackNavigation();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress ?? goBack} style={({ pressed }) => [styles.button, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }, style]}>
    <Ionicons name="arrow-back" size={22} color={colors.text} />
  </Pressable>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ button: { width: 48, height: 48, minWidth: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } });

