/** Contenido y artwork son hermanos: solo el formulario hereda el padding horizontal. */
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { LoginPets } from './LoginPets';

export function LoginLayout({ children, scrollable = false, showDesktopImage = false }: PropsWithChildren<{ scrollable?: boolean; showDesktopImage?: boolean }>) {
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
  const main = <View style={[styles.main, { width: responsiveWeb ? Math.min(showDesktopImage && !keyboardOpen ? width * 0.46 : width - 48, 560) : width, alignSelf: 'center', paddingHorizontal: responsiveWeb ? 32 : 24 }, responsiveWeb && !showDesktopImage && [styles.webPanel, { backgroundColor: colors.surface, borderColor: colors.border }], showDesktopImage && responsiveWeb && styles.desktopCardPanel, { gap: tight ? 0 : compact ? 4 : 10, paddingTop: keyboardOpen ? 4 : tight ? 4 : compact ? 10 : 24, paddingBottom: 4 }]}>{children}</View>;
  const artwork = !keyboardOpen && !responsiveWeb && <LoginPets registration={scrollable} />;
  const desktopImage = responsiveWeb && showDesktopImage && !keyboardOpen && <View style={styles.desktopImageFrame}>
    <Image source={require('../../assets/img1.jpg')} resizeMode="cover" accessibilityLabel="Veterinario atendiendo a un cachorro" style={styles.desktopImage} />
  </View>;
  const desktopCard = responsiveWeb && showDesktopImage && <View style={[styles.desktopCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    {desktopImage}{main}
  </View>;
  return <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.shape, { backgroundColor: colors.accent }]} />
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scrollable ? <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, responsiveWeb && styles.webScrollContent, responsiveWeb && showDesktopImage && styles.desktopScrollContent, keyboardOpen && styles.keyboardScrollContent]}>
        {desktopCard ?? <>{desktopImage}{main}</>}{artwork}
      </ScrollView> : <View style={[styles.fixedContent, responsiveWeb && styles.desktopFixedContent]}>
        {desktopCard ?? <>{desktopImage}{main}</>}
        {artwork && <View pointerEvents="none" style={styles.bottomArtwork}>{artwork}</View>}
      </View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  webScrollContent: { alignItems: 'center', paddingVertical: 32 },
  desktopScrollContent: { justifyContent: 'center', width: '100%', paddingHorizontal: 32 },
  keyboardScrollContent: { justifyContent: 'flex-start' },
  fixedContent: { flex: 1, overflow: 'hidden' },
  desktopFixedContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 32 },
  desktopCard: { flexDirection: 'row', alignItems: 'stretch', width: '94%', maxWidth: 1180, borderWidth: 1, borderRadius: 26, overflow: 'hidden' },
  desktopImageFrame: { width: '40%', flexGrow: 0, flexShrink: 0, overflow: 'hidden' },
  desktopImage: { width: '100%', height: '100%' },
  desktopCardPanel: { width: '60%', flexGrow: 0, flexShrink: 0, alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 24 },
  webPanel: { borderWidth: 1, borderRadius: 26, paddingBottom: 20, maxWidth: 560 },
  bottomArtwork: { position: 'absolute', left: 0, right: 0, bottom: -50, alignItems: 'center' },
  main: { width: '100%', paddingHorizontal: 24 },
  shape: { pointerEvents: 'none', position: 'absolute', width: '120%', aspectRatio: 1, borderRadius: 1000, top: -370, left: '-40%', opacity: 0.3 },
});



