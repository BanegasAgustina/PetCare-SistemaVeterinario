/** Contenedor desplazable que respeta notch y barra inferior en distintos celulares. */
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

export function ScreenContainer({ children, keyboardAvoiding = false }: PropsWithChildren<{ keyboardAvoiding?: boolean }>) {
  const { colors } = useTheme();
  const scroll = <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}</ScrollView>;
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* iOS desplaza con padding; Android reduce la ventana con softwareKeyboardLayoutMode=resize. */}
      {keyboardAvoiding ? <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{scroll}</KeyboardAvoidingView> : scroll}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 24, gap: 24 },
});
