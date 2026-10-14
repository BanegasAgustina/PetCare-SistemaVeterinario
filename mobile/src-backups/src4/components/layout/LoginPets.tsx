/** Franja inferior full bleed: se compensa el margen alfa sin deformar los animales. */
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
const artwork = require('../../assets/auth-pets.png');
// PNG 2110 × 745. Límites visibles medidos con alfa > 20: (73,109)-(2063,718).
const visibleWidth = 1990;
export function LoginPets({ registration = false }: { registration?: boolean }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const scale = width / visibleWidth;
  // Se conserva la escala completa; el marco recorta solo la parte inferior de los cuerpos.
  if (!registration) return <View accessible={false} style={[styles.frame, { width, height: width * 0.72 }]}>
    <View style={[styles.shape, { backgroundColor: colors.accent }]} />
    <Image source={require('../../assets/login-full-pets.png')} resizeMode={'contain'} style={{ position: 'absolute', top: -width * 6 / 1152, width, height: width * 994 / 1152 }} />
  </View>;
  return <View accessible={false} style={[styles.frame, { width, height: 609 * scale }]}>
    <View style={[styles.shape, { backgroundColor: colors.accent }]} />
    <Image source={artwork} resizeMode="contain" style={{
      position: 'absolute', left: -73 * scale, top: -109 * scale,
      width: 2110 * scale, height: 745 * scale,
    }} />
  </View>;
}
const styles = StyleSheet.create({
  frame: { pointerEvents: 'none', flexShrink: 0, overflow: 'hidden', alignSelf: 'center' },
  shape: { position: 'absolute', bottom: 0, width: '100%', height: '55%', borderTopLeftRadius: 100, borderTopRightRadius: 100, opacity: 0.5 },
});


