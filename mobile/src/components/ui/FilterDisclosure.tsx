// Este archivo se encarga de lo siguiente: Componente visual reutilizable; mantiene una interacción o presentación común en la app.

import { useState, type PropsWithChildren } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

// Función FilterDisclosure: concentra la lógica dentro de este módulo.
export function FilterDisclosure({ children, activeCount = 0, onApply, onClear, onOpen, onCancel, fullWidth = false, compact = false }: PropsWithChildren<{ activeCount?: number; onApply: () => void; onClear: () => void; onOpen?: () => void; onCancel?: () => void; fullWidth?: boolean; compact?: boolean }>) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const floating = isWebAtLeast(Platform.OS, width, responsiveLayout.breakpoints.tablet);
  const desktop = compact && isWebAtLeast(Platform.OS, width, responsiveLayout.breakpoints.desktop);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  // Función dismiss: agrupa una operación que este módulo puede ejecutar o reutilizar.
const dismiss = () => { onCancel?.(); setOpen(false); };
  // Función toggle: agrupa una operación que este módulo puede ejecutar o reutilizar.
const toggle = () => { if (open) dismiss(); else { onOpen?.(); setOpen(true); } };
  return <View style={styles.wrap}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onHoverIn={()=>setHovered(true)} onHoverOut={()=>setHovered(false)} onPress={toggle} style={[styles.trigger, desktop&&styles.desktopTrigger, fullWidth&&styles.fullTrigger, { backgroundColor: open||desktop&&hovered?colors.accent:colors.surface, borderColor: open||desktop&&focused?colors.primary:colors.border }]}>
      <Ionicons name="options-outline" size={18} color={colors.primary}/><AppText>Filtros</AppText>
      {activeCount > 0 && <View style={[styles.badge, { backgroundColor: colors.primary }]}><AppText variant="caption" style={{ color: colors.onPrimary }}>{activeCount}</AppText></View>}
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted}/>
    </Pressable>
    {floating ? <AppModal visible={open} dismissible onClose={dismiss} footer={<View style={styles.actions}><AppButton compact variant="secondary" label="Cancelar" onPress={dismiss}/><AppButton compact variant="secondary" label="Limpiar" onPress={onClear}/><AppButton compact label="Aplicar" onPress={() => { onApply(); setOpen(false); }}/></View>}>
      <AppText variant="title">Filtros</AppText>
      {activeCount>0&&<AppText variant="caption" muted>{activeCount} {activeCount===1?'filtro activo':'filtros activos'}</AppText>}
      <View style={styles.optionsContent}>{children}</View>
    </AppModal> : open && <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <ScrollView nativeID={Platform.OS==='web'?'petcare-web-scroll-filter-options':undefined} style={styles.options} contentContainerStyle={styles.optionsContent} nestedScrollEnabled keyboardShouldPersistTaps="handled">{children}</ScrollView>
      <View style={styles.actions}><AppButton compact variant="secondary" label="Limpiar" onPress={onClear}/><AppButton compact label="Aplicar" onPress={() => { onApply(); setOpen(false); }}/></View>
    </View>}
  </View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ wrap: { gap: 8, minWidth: 0, maxWidth: '100%' }, trigger: { minHeight: 46, paddingHorizontal: 13, borderWidth: 1, borderRadius: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },desktopTrigger:{minHeight:40,paddingHorizontal:12,borderRadius:11},fullTrigger:{alignSelf:'stretch'}, badge: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, panel: { width: '100%', maxWidth: 560, maxHeight: 460, padding: 16, borderWidth: 1, borderRadius: 18, gap: 12 }, options: { flexShrink: 1, minHeight: 0 }, optionsContent: { width: '100%', gap: 10 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 } });
