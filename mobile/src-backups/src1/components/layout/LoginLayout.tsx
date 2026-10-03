/** Contenido y artwork son hermanos: solo el formulario hereda el padding horizontal. */
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { LoginPets } from './LoginPets';

export function LoginLayout({ children, scrollable = false }: PropsWithChildren<{ scrollable?: boolean }>) {
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
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
  const [mainHeight, setMainHeight] = useState(0);
  const artworkHeight = width * 0.72;
  const scale = scrollable || keyboardOpen || !mainHeight ? 1 : Math.min(1, Math.max(0.4, (availableHeight - artworkHeight) / mainHeight));
  const allowScroll = scrollable || keyboardOpen;
  return <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.shape, { backgroundColor: colors.accent }]} />
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView scrollEnabled={allowScroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, !allowScroll && styles.fullHeight]}>
        {/* El espacio disponible queda arriba del bloque, acercando Registro al artwork. */}
        <View style={{ height: mainHeight ? mainHeight * scale : undefined }}>
        <View onLayout={({ nativeEvent }) => setMainHeight(nativeEvent.layout.height)} style={[styles.main, { width: width / scale, alignSelf: 'center', paddingHorizontal: 24 / scale, transform: [{ scale }], transformOrigin: 'top center' }, { gap: tight ? 0 : compact ? 4 : 10, paddingTop: keyboardOpen ? 8 : tight ? 8 : compact ? 16 : 32, paddingBottom: 6 }]}>
          {children}
        </View>
        </View>
        {!keyboardOpen && <LoginPets registration={scrollable} />}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: { flexGrow: 1, justifyContent: 'flex-end' },
  fullHeight: { height: '100%' },
  main: { width: '100%', paddingHorizontal: 24 },
  shape: { pointerEvents: 'none', position: 'absolute', width: '120%', aspectRatio: 1, borderRadius: 1000, top: -370, left: '-40%', opacity: 0.3 },
});



