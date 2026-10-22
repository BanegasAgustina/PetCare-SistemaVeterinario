/** Franja inferior full bleed; el marco recorta solo los cuerpos. */
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
const artwork = require('../../assets/auth-pets.png');
export function LoginPets({ registration = false }: { registration?: boolean }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  if (!registration) {
    const imageHeight = width * 703 / 1152;
    return <View accessible={false} style={[styles.frame, { width, height: imageHeight, transform: [{ translateY: -50 }] }]}>
      <View style={[styles.shape, { backgroundColor: colors.accent }]} />
      <Image source={require('../../assets/login-full-pets.png')} resizeMode="contain" style={{ position: 'absolute', top: 0, width, height: imageHeight }} />
    </View>;
  }
  const imageHeight = width * 745 / 2110;
  return <View accessible={false} style={[styles.frame, { width, height: imageHeight + 30 }]}>
    {/* El registro termina con la imagen, sin franja verde debajo. */}
    <Image source={artwork} resizeMode="contain" style={{ position: 'absolute', left: 0, top: 30, width, height: imageHeight }} />
  </View>;
}
const styles = StyleSheet.create({
  frame: { pointerEvents: 'none', flexShrink: 0, overflow: 'hidden', alignSelf: 'center' },
  shape: { position: 'absolute', bottom: 0, width: '100%', height: '55%', borderTopLeftRadius: 100, borderTopRightRadius: 100, opacity: 0.5 },
});
