/** Franja inferior full bleed; el marco recorta solo los cuerpos. */
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
const artwork = require('../../assets/auth-pets.png');
const visibleWidth = 1990;
export function LoginPets({ registration = false }: { registration?: boolean }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const scale = width / visibleWidth;
  if (!registration) {
    const imageHeight = width * 994 / 1152;
    return <View accessible={false} style={[styles.frame, { width, height: imageHeight }]}>
      <View style={[styles.shape, { backgroundColor: colors.accent }]} />
      <Image source={require('../../assets/login-full-pets.png')} resizeMode="contain" style={{ position: 'absolute', top: 0, width, height: imageHeight }} />
    </View>;
  }
  return <View accessible={false} style={[styles.frame, { width, height: 609 * scale }]}>
    <View style={[styles.shape, { backgroundColor: colors.accent }]} />
    <Image source={artwork} resizeMode="contain" style={{ position: 'absolute', left: -73 * scale, top: -109 * scale, width: 2110 * scale, height: 745 * scale }} />
  </View>;
}
const styles = StyleSheet.create({
  frame: { pointerEvents: 'none', flexShrink: 0, overflow: 'hidden', alignSelf: 'center' },
  shape: { position: 'absolute', bottom: 0, width: '100%', height: '55%', borderTopLeftRadius: 100, borderTopRightRadius: 100, opacity: 0.5 },
});
