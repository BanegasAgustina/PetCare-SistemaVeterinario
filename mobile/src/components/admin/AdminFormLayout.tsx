/** Bloques y acciones compartidos para que los formularios administrativos se recorran en un orden claro. */
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';

export function AdminFormSection({ title, description, children }: PropsWithChildren<{ title: string; description?: string }>) {
  return <View style={styles.section}>
    <View style={styles.heading}>
      <AppText variant="subtitle">{title}</AppText>
      {Boolean(description) && <AppText variant="caption" muted>{description}</AppText>}
    </View>
    <View style={styles.fields}>{children}</View>
  </View>;
}

export function AdminFormActions({ children }: PropsWithChildren) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  section: { width: '100%', gap: 12, paddingTop: 4 },
  heading: { gap: 3 },
  fields: { width: '100%', gap: 12 },
  actions: { width: '100%', gap: 10, paddingTop: 4 },
});
