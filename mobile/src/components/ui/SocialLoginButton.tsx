/** Dispara OAuth mediante su callback; el contenedor controla carga y errores inline. */
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Provider = 'Google' | 'Facebook' | 'X';
const icons = { Google: 'google', Facebook: 'facebook-f', X: 'x-twitter' } as const;
export function SocialLoginButton({ provider, onPress,disabled=false }: { provider: Provider; onPress?: () => void;disabled?:boolean }) {
  const { colors } = useTheme();
  const unavailable = !onPress||disabled;
  return <Pressable disabled={unavailable} onPress={onPress} accessibilityRole="button"
    accessibilityLabel={provider === 'X' ? 'X / Twitter' : provider} accessibilityState={{ disabled: unavailable }}
    style={({ pressed }) => [styles.button, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
    <FontAwesome6 name={icons[provider]} brand size={22} color={colors.text} accessible={false} />
  </Pressable>;
}
const styles = StyleSheet.create({ button: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } });
