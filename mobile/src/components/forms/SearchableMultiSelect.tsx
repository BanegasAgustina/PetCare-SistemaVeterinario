import { useMemo,useState } from 'react';
import { Pressable,StyleSheet,View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppInput } from './AppInput';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { SelectionRow } from '../ui/SelectionRow';
import { useTheme } from '../../hooks/useTheme';
import type { SelectOption } from './AppSelectField';
import { normalizeSearchTerm } from '../../utils/search-normalization';

export function SearchableMultiSelect({label,options,value,onChange,disabled=false,error,required=false}:{label:string;options:SelectOption[];value:string[];onChange:(value:string[])=>void;disabled?:boolean;error?:string;required?:boolean}){
  const {colors}=useTheme();const [open,setOpen]=useState(false);const [search,setSearch]=useState('');const selected=options.filter(option=>value.includes(option.id));const visible=useMemo(()=>{const term=normalizeSearchTerm(search.trim());return term?options.filter(option=>normalizeSearchTerm(option.name).includes(term)):options;},[options,search]);
  const close=()=>{setOpen(false);setSearch('');};const toggle=(id:string)=>onChange(value.includes(id)?value.filter(item=>item!==id):[...value,id]);
  return <View style={{gap:6}}><AppText variant="caption">{label}{required?' *':''}</AppText><Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${selected.length} seleccionados`} accessibilityState={{disabled,expanded:open}} disabled={disabled} onPress={()=>setOpen(true)} style={[styles.control,{backgroundColor:colors.surface,borderColor:error?colors.danger:colors.border,opacity:disabled ? .6 : 1}]}><AppText numberOfLines={2} style={{flex:1,color:selected.length?colors.text:colors.muted}}>{selected.length?selected.map(item=>item.name).join(', '):'Buscar y seleccionar…'}</AppText><Ionicons name="chevron-down-outline" size={19} color={colors.muted}/></Pressable>{error&&<AppText variant="caption" style={{color:colors.danger}}>{error}</AppText>}
    <AppModal visible={open} dismissible onClose={close}><AppText variant="title">{label}</AppText><AppInput icon="search-outline" label={`Buscar ${label.toLocaleLowerCase()}`} placeholder={`Buscar ${label.toLocaleLowerCase()}…`} value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false}/>{value.length>0&&<Pressable accessibilityRole="button" onPress={()=>onChange([])} style={styles.clear}><AppText style={{color:colors.primary,fontWeight:'700'}}>Limpiar selección</AppText></Pressable>}{visible.map(option=><SelectionRow key={option.id} label={option.name} hint={value.includes(option.id)?'Seleccionado':''} checked={value.includes(option.id)} onPress={()=>toggle(option.id)}/>)}{visible.length===0&&<AppText muted>No se encontraron resultados.</AppText>}<AppText variant="caption" muted>{selected.length} seleccionados</AppText><Pressable accessibilityRole="button" onPress={close} style={[styles.done,{backgroundColor:colors.primary}]}><AppText style={{color:colors.onPrimary,fontWeight:'700'}}>Listo</AppText></Pressable></AppModal>
  </View>;
}
const styles=StyleSheet.create({control:{minHeight:50,width:'100%',paddingHorizontal:14,borderWidth:1,borderRadius:14,flexDirection:'row',alignItems:'center',gap:12},clear:{paddingVertical:6},done:{minHeight:44,borderRadius:12,alignItems:'center',justifyContent:'center',padding:10}});
