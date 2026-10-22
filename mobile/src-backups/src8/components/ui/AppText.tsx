/** Texto reutilizable con jerarquía visual y escalado accesible del sistema. */
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type AppTextProps = TextProps & { variant?: 'title' | 'subtitle' | 'body' | 'caption'; muted?: boolean };
export function AppText({ variant = 'body', muted = false, style, ...props }: AppTextProps) {
  const { colors } = useTheme();
  return <Text {...props} style={[styles[variant], { color: muted ? colors.muted : colors.text }, style]} />;
}
const styles = StyleSheet.create({
  title: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.45 },
  subtitle: { fontSize: 20, lineHeight: 27, fontWeight: '600', letterSpacing: -0.15 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
});
