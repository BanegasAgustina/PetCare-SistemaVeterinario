// Este archivo se encarga de lo siguiente: Componente reutilizable del área de clientes; presenta información y acciones para sus mascotas, turnos o compras.

import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

// Tipo PetCareDecorationVariant: define la forma o las opciones válidas de los datos usados por este módulo.
export type PetCareDecorationVariant = 'pets' | 'care';

/** Fondo decorativo no interactivo, adaptado al tema y sin datos de negocio. */
// Función PetCareDecorativeBackground: concentra la lógica dentro de este módulo.
export function PetCareDecorativeBackground({ variant = 'care' }: { variant?: PetCareDecorationVariant }) {
  const { colors } = useTheme();
  return <View pointerEvents="none" accessible={false} style={styles.pageDecoration}>
    <View style={[styles.decorationOrb, styles.decorationOrbTop, { backgroundColor: colors.accent }]} />
    <View style={[styles.decorationOrb, styles.decorationOrbBottom, { backgroundColor: colors.accent }]} />
    <Ionicons name="paw" size={variant === 'pets' ? 62 : 48} color={colors.primary} style={styles.pagePawTop} />
    <Ionicons name="paw-outline" size={variant === 'pets' ? 38 : 30} color={colors.muted} style={styles.pagePawBottom} />
    {variant === 'pets'
      ? <><MaterialCommunityIcons name="dog" size={46} color={colors.primary} style={styles.pageAnimalTop} /><Ionicons name="heart" size={21} color={colors.primary} style={styles.pageHeart} /></>
      : <Ionicons name="medkit-outline" size={24} color={colors.primary} style={styles.pageMedical} />}
  </View>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  pageDecoration: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  decorationOrb: { position: 'absolute', borderRadius: 999, opacity: 0.42 },
  decorationOrbTop: { width: 230, height: 230, top: -142, right: -72 },
  decorationOrbBottom: { width: 180, height: 180, bottom: -124, left: -104 },
  pagePawTop: { position: 'absolute', top: 48, right: 22, opacity: 0.075, transform: [{ rotate: '18deg' }] },
  pagePawBottom: { position: 'absolute', bottom: 42, left: 23, opacity: 0.07, transform: [{ rotate: '-19deg' }] },
  pageAnimalTop: { position: 'absolute', top: 168, right: 17, opacity: 0.055 },
  pageHeart: { position: 'absolute', top: 238, right: 61, opacity: 0.07, transform: [{ rotate: '13deg' }] },
  pageMedical: { position: 'absolute', bottom: 126, left: 73, opacity: 0.075 },
});
