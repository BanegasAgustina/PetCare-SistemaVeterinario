// Este archivo se encarga de lo siguiente: Componente visual reutilizable; mantiene una interacción o presentación común en la app.

/** Checkbox accesible compartido por especialidades y permisos. */
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
// Función SelectionRow: concentra la lógica dentro de este módulo.
export function SelectionRow({ label,hint,checked,disabled=false,onPress,radio=false }: { label:string;hint?:string;checked:boolean;disabled?:boolean;onPress:()=>void;radio?:boolean }) {
  const { colors }=useTheme();
  return <Pressable accessibilityRole={radio?'radio':'checkbox'} accessibilityLabel={label} accessibilityState={{checked,disabled}} disabled={disabled} onPress={onPress}
    style={[styles.row,{borderColor:checked?colors.primary:colors.border,backgroundColor:checked?colors.accent:colors.surface,opacity:disabled?0.6:1}]}>
    <Ionicons name={radio?(checked?'radio-button-on':'radio-button-off'):(checked?'checkbox-outline':'square-outline')} size={22} color={colors.primary} accessible={false}/>
    <View style={styles.text}><AppText>{label}</AppText>{Boolean(hint) && <AppText variant="caption" muted>{hint}</AppText>}</View>
  </Pressable>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({row:{minHeight:50,paddingHorizontal:13,paddingVertical:10,borderWidth:1,borderRadius:14,flexDirection:'row',gap:12,alignItems:'center'},text:{flex:1,minWidth:0,gap:4}});
