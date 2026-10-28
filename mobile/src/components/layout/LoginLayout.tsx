// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

/** Contenido y artwork son hermanos: solo el formulario hereda el padding horizontal. */
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { LoginPets } from './LoginPets';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { PetCareDecorativeBackground } from '../client/PetCareDecorations';

// Función LoginLayout: concentra la lógica dentro de este módulo.
export function LoginLayout({ children, scrollable = false, showDesktopImage = false, petArtwork = 'login', petDecorations = false }: PropsWithChildren<{ scrollable?: boolean; showDesktopImage?: boolean; petArtwork?: 'login' | 'register'; petDecorations?: boolean }>) {
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
  const desktopWeb = isWebAtLeast(Platform.OS, width, responsiveLayout.breakpoints.authDesktop);
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
  // Auth screens stay scrollable on phones and short windows so fields never sit outside the viewport.
  const main = <View style={[styles.main, { width: desktopWeb && showDesktopImage ? Math.min(width * 0.46, 560) : Math.min(width, 560), alignSelf: 'center', paddingHorizontal: desktopWeb && showDesktopImage ? 40 : 24 }, desktopWeb && showDesktopImage && styles.desktopCardPanel, { gap: tight ? 0 : compact ? 4 : 10, paddingTop: keyboardOpen ? 12 : tight ? 12 : compact ? 18 : 24, paddingBottom: 16 }]}>{children}</View>;
  const artwork = !keyboardOpen && !desktopWeb && <LoginPets registration={petArtwork === 'register'} />;
  const desktopImage = desktopWeb && showDesktopImage && !keyboardOpen && <View style={styles.desktopImageFrame}>
    <Image source={require('../../assets/img1.jpg')} resizeMode="cover" accessibilityLabel="Veterinario atendiendo a un cachorro" style={styles.desktopImage} />
  </View>;
  const desktopCard = desktopWeb && showDesktopImage && <View style={styles.desktopCard}>
    {desktopImage}{main}
  </View>;
  return <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: colors.background }]}>
    {petDecorations && <PetCareDecorativeBackground variant="care" />}
    <View style={[styles.shape, { backgroundColor: colors.accent }]} />
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scrollable ? <ScrollView nativeID={Platform.OS==='web'?'petcare-web-scroll-login':undefined} keyboardShouldPersistTaps="always" keyboardDismissMode="none" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, desktopWeb && styles.webScrollContent, desktopWeb && showDesktopImage && styles.desktopScrollContent, keyboardOpen && styles.keyboardScrollContent]}>
        {desktopCard || <>{desktopImage}{main}</>}{artwork}
      </ScrollView> : <View style={[styles.fixedContent, desktopWeb && styles.desktopFixedContent]}>
        {desktopCard || <>{desktopImage}{main}</>}
        {artwork && <View pointerEvents="none" style={styles.bottomArtwork}>{artwork}</View>}
      </View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 16 },
  webScrollContent: { alignItems: 'center', paddingVertical: 32 },
  desktopScrollContent: { justifyContent: 'center', width: '100%', paddingHorizontal: 32 },
  keyboardScrollContent: { justifyContent: 'flex-start' },
  fixedContent: { flex: 1, overflow: 'hidden' },
  desktopFixedContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 32 },
  desktopCard: { flexDirection: 'row', alignItems: 'stretch', width: '94%', maxWidth: 1180, borderRadius: 26, overflow: 'hidden' },
  desktopImageFrame: { width: '50%', flexGrow: 0, flexShrink: 0, overflow: 'hidden' },
  desktopImage: { width: '100%', height: '100%' },
  desktopCardPanel: { width: '50%', flexGrow: 0, flexShrink: 0, alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 24 },
  bottomArtwork: { position: 'absolute', left: 0, right: 0, bottom: -50, alignItems: 'center' },
  main: { width: '100%', paddingHorizontal: 24 },
  shape: { pointerEvents: 'none', position: 'absolute', width: '120%', aspectRatio: 1, borderRadius: 1000, top: -370, left: '-40%', opacity: 0.3 },
});



