/** Texto reutilizable con jerarquía visual y escalado accesible del sistema. */
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type AppTextProps = TextProps & { variant?: 'title' | 'subtitle' | 'body' | 'caption'; muted?: boolean };
export function AppText({ variant = 'body', muted = false, style, ...props }: AppTextProps) {
  const { colors } = useTheme();
  return <Text {...props} style={[styles[variant], { color: muted ? colors.muted : colors.text }, style]} />;
}
const styles = StyleSheet.create({
  title: { fontSize: 34, fontWeight: '700' },
  subtitle: { fontSize: 21, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 25 },
  caption: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
});
