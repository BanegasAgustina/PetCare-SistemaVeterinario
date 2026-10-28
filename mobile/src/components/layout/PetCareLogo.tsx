// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// Función PetCareLogo: concentra la lógica dentro de este módulo.
export function PetCareLogo({ style, accessibilityLabel = 'PetCare' }: { style: StyleProp<ImageStyle>; accessibilityLabel?: string }) {
  const { mode } = useTheme();
  const source = mode === 'dark'
    ? require('../../assets/petcare-logo-dark.png')
    : require('../../assets/petcare-logo.png');
  return <Image source={source} resizeMode="contain" style={style} accessibilityLabel={accessibilityLabel} />;
}
