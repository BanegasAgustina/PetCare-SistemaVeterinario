import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export function PetCareLogo({ style, accessibilityLabel = 'PetCare' }: { style: StyleProp<ImageStyle>; accessibilityLabel?: string }) {
  const { mode } = useTheme();
  const source = mode === 'dark'
    ? require('../../assets/petcare-logo-dark.png')
    : require('../../assets/petcare-logo.png');
  return <Image source={source} resizeMode="contain" style={style} accessibilityLabel={accessibilityLabel} />;
}
