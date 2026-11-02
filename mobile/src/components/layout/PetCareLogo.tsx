/**
 * ARCHIVO: PetCareLogo.tsx
 * UBICACIÓN: mobile/src/components/layout/PetCareLogo.tsx
 * FUNCIÓN: Logotipo de PetCare con nombre accesible.
 * RESPONSABILIDAD: Compartir la marca en navegación, login y superficies de inicio.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/layout/LoginBrand.tsx
 * FUNCIONAMIENTO: Renderiza imagen y etiqueta de accesibilidad recibida, respetando el estilo solicitado.
 * IMPORTANCIA: Evita duplicar selección de asset y atributos accesibles.
 */
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/** Renderiza el logotipo con etiqueta accesible configurable. */
export function PetCareLogo({ style, accessibilityLabel = 'PetCare' }: { style: StyleProp<ImageStyle>; accessibilityLabel?: string }) {
  const { mode } = useTheme();
  const source = mode === 'dark'
    ? require('../../assets/petcare-logo-dark.png')
    : require('../../assets/petcare-logo.png');
  return <Image source={source} resizeMode="contain" style={style} accessibilityLabel={accessibilityLabel} />;
}
