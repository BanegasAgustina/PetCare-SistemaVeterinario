/** Checkbox accesible compartido por especialidades y permisos. */
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
export function SelectionRow({ label,hint,checked,disabled=false,onPress }: { label:string;hint?:string;checked:boolean;disabled?:boolean;onPress:()=>void }) {
  const { colors }=useTheme();
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{checked,disabled}} disabled={disabled} onPress={onPress}
    style={[styles.row,{borderColor:colors.border,backgroundColor:colors.surface,opacity:disabled?0.6:1}]}>
    <Ionicons name={checked?'checkbox-outline':'square-outline'} size={22} color={colors.primary} accessible={false}/>
    <View style={styles.text}><AppText>{label}</AppText>{Boolean(hint) && <AppText variant="caption" muted>{hint}</AppText>}</View>
  </Pressable>;
}
const styles=StyleSheet.create({row:{minHeight:52,padding:12,borderWidth:1,borderRadius:12,flexDirection:'row',gap:12,alignItems:'center'},text:{flex:1,gap:4}});
