/** Logo transparente sin panel; conserva colores y mejora su contorno en oscuro. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
export function LoginBrand({ title = 'Bienvenido/a a PetCare', subtitle = 'Cuidamos a quienes más querés' }: { title?: string; subtitle?: string }) {
  const { colors, mode, setPreference } = useTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableHeight = height - insets.top - insets.bottom;
  const compact = availableHeight <= 700;
  const logoWidth = Math.min(availableHeight < 640 ? 200 : compact ? 242 : 290, width - 64);
  return <View style={styles.header}>
    <View style={[styles.logoRow, { height: logoWidth / 3 }]}>
      {/* Contorno de un píxel detrás del PNG; el logo original se dibuja intacto encima. */}
      {mode === 'dark' && [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([x, y], index) =>
        <Image key={index} accessible={false} source={require('../../assets/petcare-logo.png')} resizeMode="contain" tintColor={colors.text}
          style={{ position: 'absolute', width: logoWidth, height: logoWidth / 3, transform: [{ translateX: x }, { translateY: y }] }} />)}
      <Image source={require('../../assets/petcare-logo.png')} resizeMode="contain" style={{ width: logoWidth, height: logoWidth / 3 }} accessibilityLabel="Logo oficial de PetCare" />
      <Pressable accessibilityRole="button" accessibilityLabel={mode === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'} onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')}
        style={({ pressed }) => [styles.theme, { opacity: pressed ? 0.7 : 1 }]}>
        <Ionicons name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.primary} accessible={false} />
      </Pressable>
    </View>
    <AppText variant="subtitle" style={[styles.title, { fontSize: compact ? 20 : 23 }]}>{title}</AppText>
    <AppText muted style={styles.subtitle}>{subtitle}</AppText>
  </View>;
}
const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 2 }, logoRow: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  theme: { position: 'absolute', right: 0, top: 0, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { textAlign: 'center' }, subtitle: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
});


