import { useState } from 'react';
import { Pressable,StyleSheet,View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { responsiveLayout } from '../../constants/responsive';
import { AppText } from '../ui/AppText';
import { PetCareSection,type IconName } from '../client/PetCareUI';
import { useRoleQuickAccess } from './RoleNavigationContext';

export function RoleQuickAccess(){
  const items=useRoleQuickAccess();
  const {colors}=useTheme();
  const [contentWidth,setContentWidth]=useState(0);
  if(!items.length)return null;
  const gap=responsiveLayout.grid.gap;
  const minWidth=responsiveLayout.grid.quickAccessMinItemWidth;
  const columns=Math.max(1,Math.min(2,Math.floor((contentWidth+gap)/(minWidth+gap))));
  const groups=[...new Map(items.map(item=>[item.group??'',items.filter(candidate=>(candidate.group??'')===(item.group??''))])).entries()];
  const renderItems=(groupItems:typeof items)=><View style={styles.grid}>
    {groupItems.map(item=><Pressable key={item.path} accessibilityRole="button" accessibilityLabel={`Abrir ${item.label}`} onPress={()=>router.push(item.path as never)} style={({pressed})=>[styles.card,{width:contentWidth?(columns===1?contentWidth:(contentWidth-gap)/2):undefined,backgroundColor:colors.surface,borderColor:colors.border,opacity:pressed?0.78:1}]}>
      <View style={[styles.icon,{backgroundColor:colors.accent}]}><Ionicons name={item.icon as IconName} size={20} color={colors.primary}/></View>
      <AppText style={styles.label}>{item.label}</AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.muted}/>
    </Pressable>)}
  </View>;
  return <PetCareSection title="Accesos rápidos">
    <View onLayout={event=>setContentWidth(current=>Math.abs(current-event.nativeEvent.layout.width)<1?current:event.nativeEvent.layout.width)} style={styles.content}>
      {groups.length>1||groups[0]?.[0]?groups.map(([group,groupItems])=><View key={group} style={styles.group}>
        {group&&<AppText variant="caption" muted style={styles.groupTitle}>{group}</AppText>}{renderItems(groupItems)}
      </View>):renderItems(items)}
    </View>
  </PetCareSection>;
}

const styles=StyleSheet.create({content:{gap:responsiveLayout.grid.gap},group:{gap:responsiveLayout.grid.gap},groupTitle:{textTransform:'uppercase',letterSpacing:0.7},grid:{width:'100%',flexDirection:'row',flexWrap:'wrap',gap:responsiveLayout.grid.gap},card:{flexGrow:1,minWidth:0,minHeight:64,paddingHorizontal:12,paddingVertical:10,borderWidth:1,borderRadius:16,flexDirection:'row',alignItems:'center',gap:10},icon:{width:38,height:38,borderRadius:13,alignItems:'center',justifyContent:'center',flexShrink:0},label:{flex:1,minWidth:0,fontWeight:'600'}});
