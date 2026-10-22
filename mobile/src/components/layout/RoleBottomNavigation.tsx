import { useEffect,useState } from 'react';
import { Keyboard,Modal,Platform,Pressable,ScrollView,StyleSheet,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';
import type { IconName } from '../client/PetCareUI';
import { splitNavigationTabs } from '../../utils/navigation-tabs';

export type NavigationTab={label:string;path:string;icon:IconName};
type Props={items:NavigationTab[];activePath:string|null;onNavigate:(path:string)=>void};

export function RoleBottomNavigation({items,activePath,onNavigate}:Props){
  const {colors}=useTheme();
  const [moreOpen,setMoreOpen]=useState(false);
  const [keyboardOpen,setKeyboardOpen]=useState(false);
  useEffect(()=>{
    if(Platform.OS==='web')return;
    const show=Keyboard.addListener('keyboardDidShow',()=>setKeyboardOpen(true));
    const hide=Keyboard.addListener('keyboardDidHide',()=>setKeyboardOpen(false));
    return ()=>{show.remove();hide.remove();};
  },[]);
  if(keyboardOpen||!items.length)return null;
  const {visible,overflow}=splitNavigationTabs(items);
  const active=items.find(item=>activePath===item.path||activePath?.startsWith(`${item.path}/`));
  const activeInOverflow=Boolean(overflow.some(item=>item.path===active?.path));
  const tabs:NavigationTab[]=[...visible,...(overflow.length?[{label:'Más',path:'__more__',icon:'ellipsis-horizontal-outline' as const}]:[])];
  return <>
    <SafeAreaView edges={['bottom']} style={[styles.safe,{backgroundColor:colors.surface,borderTopColor:colors.border}]}>
      <View accessibilityRole="tablist" style={styles.bar}>
        {tabs.map(item=>{
          const isMore=item.path==='__more__';
          const selected=isMore?activeInOverflow:activePath===item.path||Boolean(activePath?.startsWith(`${item.path}/`));
          return <Pressable key={item.path} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{selected}} onPress={()=>isMore?setMoreOpen(true):onNavigate(item.path)} style={styles.tab}>
            <View style={[styles.iconWrap,selected&&{backgroundColor:colors.accent}]}><Ionicons name={item.icon} size={21} color={selected?colors.primary:colors.muted}/></View>
            <AppText numberOfLines={1} variant="caption" style={{color:selected?colors.primary:colors.muted,fontWeight:selected?'700':'500'}}>{item.label}</AppText>
            {selected&&<View style={[styles.indicator,{backgroundColor:colors.primary}]}/>}
          </Pressable>;
        })}
      </View>
    </SafeAreaView>
    <Modal visible={moreOpen} transparent animationType="slide" onRequestClose={()=>setMoreOpen(false)}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú Más" onPress={()=>setMoreOpen(false)} style={StyleSheet.absoluteFill}/>
        <SafeAreaView edges={['bottom']} style={[styles.sheet,{backgroundColor:colors.surface,borderColor:colors.border}]}>
          <View style={styles.sheetHeading}><AppText variant="subtitle">Más módulos</AppText><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>setMoreOpen(false)}><Ionicons name="close-circle-outline" size={24} color={colors.muted}/></Pressable></View>
          <ScrollView contentContainerStyle={styles.moreList}>
            {overflow.map(item=><Pressable key={item.path} accessibilityRole="button" onPress={()=>{setMoreOpen(false);onNavigate(item.path);}} style={[styles.moreItem,{borderColor:colors.border}]}><Ionicons name={item.icon} size={20} color={colors.primary}/><AppText style={{flex:1}}>{item.label}</AppText><Ionicons name="chevron-forward" size={17} color={colors.muted}/></Pressable>)}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  </>;
}

const styles=StyleSheet.create({safe:{borderTopWidth:1},bar:{minHeight:64,paddingHorizontal:5,paddingTop:4,flexDirection:'row',alignItems:'stretch',justifyContent:'space-around'},tab:{flex:1,minWidth:0,alignItems:'center',justifyContent:'center',gap:1,paddingHorizontal:2,position:'relative'},iconWrap:{minWidth:42,minHeight:31,borderRadius:12,alignItems:'center',justifyContent:'center'},indicator:{position:'absolute',bottom:0,width:24,height:3,borderTopLeftRadius:3,borderTopRightRadius:3},modalRoot:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.28)'},sheet:{maxHeight:'72%',borderTopLeftRadius:22,borderTopRightRadius:22,borderWidth:1,paddingTop:18,paddingHorizontal:18},sheetHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingBottom:12},moreList:{gap:8,paddingBottom:12},moreItem:{minHeight:52,paddingHorizontal:12,borderWidth:1,borderRadius:14,flexDirection:'row',alignItems:'center',gap:12}});
