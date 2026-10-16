/** Contenido y artwork son hermanos: solo el formulario hereda el padding horizontal. */
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { LoginPets } from './LoginPets';

export function LoginLayout({ children, scrollable = false }: PropsWithChildren<{ scrollable?: boolean }>) {
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
  const responsiveWeb = Platform.OS === 'web' && width >= 768;
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const insets = useSafeAreaInsets();
  const availableHeight = height - insets.top - insets.bottom;
  const compact = availableHeight <= 700;
  const tight = availableHeight < 640;
  // El login permanece fijo aunque aparezca el teclado; Registro sí necesita scroll.
  const main = <View style={[styles.main, { width: responsiveWeb ? Math.min(width - 48, 560) : width, alignSelf: 'center', paddingHorizontal: responsiveWeb ? 32 : 24 }, responsiveWeb && [styles.webPanel, { backgroundColor: colors.surface, borderColor: colors.border }], { gap: tight ? 0 : compact ? 4 : 10, paddingTop: keyboardOpen ? 4 : tight ? 4 : compact ? 10 : 24, paddingBottom: 4 }]}>{children}</View>;
  const artwork = !keyboardOpen && !responsiveWeb && <LoginPets registration={scrollable} />;
  return <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.shape, { backgroundColor: colors.accent }]} />
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scrollable ? <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, responsiveWeb && styles.webScrollContent, keyboardOpen && styles.keyboardScrollContent]}>
        {main}{artwork}
      </ScrollView> : <View style={[styles.fixedContent, responsiveWeb && styles.desktopFixedContent]}>
        {main}
        {artwork && <View pointerEvents="none" style={styles.bottomArtwork}>{artwork}</View>}
      </View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  webScrollContent: { alignItems: 'center', paddingVertical: 32 },
  keyboardScrollContent: { justifyContent: 'flex-start' },
  fixedContent: { flex: 1, overflow: 'hidden' },
  desktopFixedContent: { justifyContent: 'center', paddingVertical: 24 },
  webPanel: { borderWidth: 1, borderRadius: 26, paddingBottom: 20, maxWidth: 560 },
  bottomArtwork: { position: 'absolute', left: 0, right: 0, bottom: -50, alignItems: 'center' },
  main: { width: '100%', paddingHorizontal: 24 },
  shape: { pointerEvents: 'none', position: 'absolute', width: '120%', aspectRatio: 1, borderRadius: 1000, top: -370, left: '-40%', opacity: 0.3 },
});



