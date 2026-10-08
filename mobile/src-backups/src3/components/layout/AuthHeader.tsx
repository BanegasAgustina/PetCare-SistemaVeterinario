/** Cabecera compartida por login/registro con logo real, navegación y tema. */
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors, mode, setPreference } = useTheme();
  return <View style={styles.container}>
    <View style={styles.navigation}>
      <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.control}><AppText variant="caption">← Volver</AppText></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')} style={styles.control}><AppText variant="caption">{mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}</AppText></Pressable>
    </View>
    <View style={[styles.logoPanel, { backgroundColor: colors.logoBackground }]}><Image source={require('../../assets/petcare-logo.png')} resizeMode="contain" style={styles.logo} accessibilityLabel="Logo de PetCare" /></View>
    <AppText variant="title">{title}</AppText><AppText muted>{subtitle}</AppText>
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 12 }, navigation: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  control: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  logoPanel: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16 }, logo: { width: '100%', aspectRatio: 3 },
});
