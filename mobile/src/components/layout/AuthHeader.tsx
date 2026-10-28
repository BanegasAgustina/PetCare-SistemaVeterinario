// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

/** Cabecera compartida por login/registro con logo real, navegación y tema. */
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
// Función AuthHeader: concentra la lógica dentro de este módulo.
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors, mode, setPreference } = useTheme();
  return <View style={styles.container}>
    <View style={styles.navigation}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={[styles.backButton,{backgroundColor:colors.accent}]}><Ionicons name="arrow-back" size={21} color={colors.text}/></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')} style={styles.control}><AppText variant="caption">{mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}</AppText></Pressable>
    </View>
    <View style={[styles.logoPanel, { backgroundColor: colors.logoBackground }]}><Image source={require('../../assets/petcare-logo.png')} resizeMode="contain" style={styles.logo} accessibilityLabel="Logo de PetCare" /></View>
    <AppText variant="title">{title}</AppText><AppText muted>{subtitle}</AppText>
  </View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  container: { gap: 12 }, navigation: { minHeight:44, flexDirection: 'row', flexWrap: 'wrap', alignItems:'center', justifyContent: 'space-between', gap: 8 },
  backButton:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},
  control: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  logoPanel: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16 }, logo: { width: '100%', aspectRatio: 3 },
});
