// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Pantalla de notificaciones propias para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareBadge,PetCareEmptyState,QueryState,dateTime,ResponsiveGrid } from '../../components/client/PetCareUI';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { FormNotice } from '../../components/ui/FormNotice';
import { useEffect, useState } from 'react';
import { Platform,Pressable,StyleSheet,View,useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { notificationPath } from '../../services/notification-path';
import { publishNotificationChange, subscribeToNotificationChanges } from '../../services/notification-events';
import { isWebAtLeast,responsiveLayout } from '../../constants/responsive';
import { useTheme } from '../../hooks/useTheme';

// Función NotificationsScreen: concentra la lógica dentro de este módulo.
export default function NotificationsScreen(){
  const api=useClient();
  const query=useClientQuery(api.notifications);
  const action=useAsyncAction();
  const {width}=useWindowDimensions();
  const {colors}=useTheme();
  const desktopWeb=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const [extraPages,setExtraPages]=useState<{baseId:string;items:import('../../types/client').Notification[];cursor:string|null}|null>(null);
  const [showRead,setShowRead]=useState(false);
  const firstId=query.data?.items[0]?.id??'';
  const extraItems=extraPages?.baseId===firstId?extraPages.items:[];
  const pageCursor=extraPages?.baseId===firstId?extraPages.cursor:query.data?.nextCursor??null;
  const items=[...new Map([...query.data?.items??[],...extraItems].map(item=>[item.id,item])).values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
  const unreadItems=items.filter(item=>!item.readAt);
  const readItems=items.filter(item=>Boolean(item.readAt));
  const visibleItems=showRead?readItems:unreadItems;
  useEffect(()=>{
    const unsubscribe=subscribeToNotificationChanges(query.reload);
    return unsubscribe;
  },[query.reload]);
  // Función readAll: agrupa una operación que este módulo puede ejecutar o reutilizar.
const readAll=()=>void action.run(async()=>{
    await api.readAllNotifications();
    publishNotificationChange();
  });
  // Función loadMore: agrupa una operación que este módulo puede ejecutar o reutilizar.
const loadMore=()=>void action.run(async()=>{
    if(!pageCursor||!firstId)return;
    const page=await api.notifications(pageCursor);
    setExtraPages(current=>({baseId:firstId,items:[...(current?.baseId===firstId?current.items:[]),...page.items],cursor:page.nextCursor}));
  });
  return <PetCareScreen wide>
    <PetCareHeader title="Notificaciones" back/>
    <AppText variant="caption" muted>Las novedades de PetCare se guardan en este centro y se sincronizan con el backend mientras usás la aplicación.</AppText>
    {!!query.data?.unreadCount&&<PetCareBadge label={`${query.data.unreadCount} sin leer`}/>}
    <View accessibilityRole="radiogroup" accessibilityLabel="Filtrar notificaciones" style={[styles.filterGroup,desktopWeb&&styles.desktopFilterGroup,{backgroundColor:colors.background,borderColor:colors.border}]}>
      {[{read:false,label:'No leídas'},{read:true,label:'Leídas'}].map(option=>{
        const selected=showRead===option.read;
        return <Pressable key={option.label} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{checked:selected}} onPress={()=>setShowRead(option.read)} style={[styles.filterOption,{backgroundColor:selected?colors.primary:colors.surface,borderColor:selected?colors.primary:colors.border}]}>
          <Ionicons name={selected?'checkmark-circle':'ellipse-outline'} size={18} color={selected?colors.onPrimary:colors.muted} accessible={false}/>
          <AppText style={{color:selected?colors.onPrimary:colors.text,fontWeight:selected?'700':'500'}}>{option.label}</AppText>
        </Pressable>;
      })}
    </View>
    {!!query.data?.unreadCount&&<View style={desktopWeb?styles.desktopBulkAction:undefined}><AppButton compact={desktopWeb} label="Marcar todas como leídas" variant="secondary" loading={action.loading} onPress={readAll}/></View>}
    
<QueryState {...query}/>
    <FormNotice error message={action.error}/>
    {query.data&&<>
      <AppText variant="subtitle">{showRead?'Notificaciones leídas':'Notificaciones no leídas'}{!showRead&&query.data.unreadCount?` · ${query.data.unreadCount}`:''}</AppText>
      {visibleItems.length?<ResponsiveGrid minItemWidth={280} maxColumns={4}>{visibleItems.map(n=><PetCareCard key={n.id} style={desktopWeb?styles.desktopCard:undefined}>
      <PetCareBadge label={n.readAt?'Leída':'Nueva'}/>
      <AppText variant="subtitle">{n.title}</AppText>
      <AppText numberOfLines={desktopWeb?4:undefined} style={desktopWeb?styles.desktopBody:undefined}>{n.body}</AppText>
      <AppText variant="caption" muted>{dateTime(n.createdAt)}</AppText>
      <View style={[styles.actions,desktopWeb&&styles.desktopActions]}><AppButton compact={desktopWeb} label="Ver detalle" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{
        if(!n.readAt)await api.readNotification(n.id);
        if(!n.readAt)publishNotificationChange();
        router.push(notificationPath(n.referenceType,n.referenceId));
      })}/>
      {!n.readAt&&<AppButton compact={desktopWeb} label="Marcar como leída" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{await api.readNotification(n.id);publishNotificationChange();})}/>}
      <AppButton compact={desktopWeb} label="Ocultar notificación" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{await api.hideNotification(n.id);setExtraPages(current=>current?{...current,items:current.items.filter(item=>item.id!==n.id)}:null);publishNotificationChange();})}/></View>
      </PetCareCard>)}</ResponsiveGrid>:<PetCareEmptyState title={showRead?'Todavía no hay notificaciones leídas':'Estás al día'} message={showRead?'Las notificaciones que abras o marques como leídas aparecerán acá.':'No tenés notificaciones nuevas.'} icon={showRead?'mail-open-outline':'notifications-outline'}/>}
    </>}
    {!!pageCursor&&<AppButton label="Cargar más notificaciones" variant="secondary" loading={action.loading} onPress={loadMore}/>}
  </PetCareScreen>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({filterGroup:{flexDirection:'row',gap:8},desktopFilterGroup:{alignSelf:'flex-start',width:380,maxWidth:'100%'},filterOption:{minHeight:46,flex:1,paddingHorizontal:14,borderRadius:14,borderWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},desktopBulkAction:{alignSelf:'flex-start'},desktopCard:{flex:1,minWidth:0},desktopBody:{flexGrow:1},actions:{gap:16},desktopActions:{gap:8,marginTop:'auto',paddingTop:8,flexDirection:'row',flexWrap:'wrap',alignItems:'center'}});
