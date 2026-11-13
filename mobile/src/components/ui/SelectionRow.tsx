/**
 * ARCHIVO: SelectionRow.tsx
 * UBICACIÓN: mobile/src/components/ui/SelectionRow.tsx
 * FUNCIÓN: Fila seleccionable con apariencia de casilla o radio, etiqueta y ayuda opcional.
 * RESPONSABILIDAD: Capturar elecciones accesibles en permisos, especialidades y formularios de configuración.
 * CONEXIONES: Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx y 16 más
 * FUNCIONAMIENTO: Representa checked y disabled recibidos, expone semántica de selección y delega cambios a onPress.
 * IMPORTANCIA: Uniforma controles de opción en superficies de configuración.
 */
/** Checkbox accesible compartido por especialidades y permisos. */
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
/** Muestra una opción accesible de selección única o múltiple con estado, ayuda y deshabilitado. */
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
