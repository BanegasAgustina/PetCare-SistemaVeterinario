import { useEffect,useState } from 'react';
import { Keyboard,Platform,Pressable,StyleSheet,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';
import type { IconName } from '../client/PetCareUI';

export type NavigationTab={label:string;path:string;icon:IconName;group?:string};
type Props={items:NavigationTab[];activePath:string|null;onNavigate:(path:string)=>void};

export function RoleBottomNavigation({items,activePath,onNavigate}:Props){
  const {colors}=useTheme();
  const [keyboardOpen,setKeyboardOpen]=useState(false);
  useEffect(()=>{
    if(Platform.OS==='web')return;
    const show=Keyboard.addListener('keyboardDidShow',()=>setKeyboardOpen(true));
    const hide=Keyboard.addListener('keyboardDidHide',()=>setKeyboardOpen(false));
    return ()=>{show.remove();hide.remove();};
  },[]);
  if(keyboardOpen||!items.length)return null;
  return <>
    <SafeAreaView edges={['bottom']} style={[styles.safe,{backgroundColor:colors.surface,borderTopColor:colors.border}]}>
      <View accessibilityRole="tablist" style={styles.bar}>
        {items.map(item=>{
          const selected=activePath===item.path||Boolean(activePath?.startsWith(`${item.path}/`));
          return <Pressable key={item.path} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{selected}} onPress={()=>onNavigate(item.path)} style={styles.tab}>
            <View style={[styles.iconWrap,selected&&{backgroundColor:colors.accent}]}><Ionicons name={item.icon} size={21} color={selected?colors.primary:colors.muted}/></View>
            <AppText numberOfLines={1} variant="caption" style={{color:selected?colors.primary:colors.muted,fontWeight:selected?'700':'500'}}>{item.label}</AppText>
            {selected&&<View style={[styles.indicator,{backgroundColor:colors.primary}]}/>}
          </Pressable>;
        })}
      </View>
    </SafeAreaView>
  </>;
}

const styles=StyleSheet.create({safe:{borderTopWidth:1},bar:{minHeight:64,paddingHorizontal:5,paddingTop:4,flexDirection:'row',alignItems:'stretch',justifyContent:'space-around'},tab:{flex:1,minWidth:0,alignItems:'center',justifyContent:'center',gap:1,paddingHorizontal:2,position:'relative'},iconWrap:{minWidth:42,minHeight:31,borderRadius:12,alignItems:'center',justifyContent:'center'},indicator:{position:'absolute',bottom:0,width:24,height:3,borderTopLeftRadius:3,borderTopRightRadius:3}});
