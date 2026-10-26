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
import { Platform,StyleSheet,View,useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { notificationPath } from '../../services/notification-path';
import { publishNotificationChange, subscribeToNotificationChanges } from '../../services/notification-events';
import { isWebAtLeast,responsiveLayout } from '../../constants/responsive';

export default function NotificationsScreen(){
  const api=useClient();
  const query=useClientQuery(api.notifications);
  const action=useAsyncAction();
  const {width}=useWindowDimensions();
  const desktopWeb=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const [extraPages,setExtraPages]=useState<{baseId:string;items:import('../../types/client').Notification[];cursor:string|null}|null>(null);
  const firstId=query.data?.items[0]?.id??'';
  const extraItems=extraPages?.baseId===firstId?extraPages.items:[];
  const pageCursor=extraPages?.baseId===firstId?extraPages.cursor:query.data?.nextCursor??null;
  const items=[...new Map([...query.data?.items??[],...extraItems].map(item=>[item.id,item])).values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
  const unreadItems=items.filter(item=>!item.readAt);
  const readItems=items.filter(item=>Boolean(item.readAt));
  useEffect(()=>{
    const unsubscribe=subscribeToNotificationChanges(query.reload);
    return unsubscribe;
  },[query.reload]);
  const readAll=()=>void action.run(async()=>{
    await api.readAllNotifications();
    publishNotificationChange();
  });
  const loadMore=()=>void action.run(async()=>{
    if(!pageCursor||!firstId)return;
    const page=await api.notifications(pageCursor);
    setExtraPages(current=>({baseId:firstId,items:[...(current?.baseId===firstId?current.items:[]),...page.items],cursor:page.nextCursor}));
  });
  return <PetCareScreen>
    <PetCareHeader title="Notificaciones" back/>
    <AppText variant="caption" muted>Las novedades de PetCare se guardan en este centro y se sincronizan con el backend mientras usás la aplicación.</AppText>
    {!!query.data?.unreadCount&&<PetCareBadge label={`${query.data.unreadCount} sin leer`}/>}
    {!!query.data?.unreadCount&&<AppButton label="Marcar todas como leídas" variant="secondary" loading={action.loading} onPress={readAll}/>}
    <QueryState {...query}/>
    <FormNotice error message={action.error}/>
    {query.data&&<>
      <AppText variant="subtitle">No leídas{query.data.unreadCount?` · ${query.data.unreadCount}`:''}</AppText>
      {unreadItems.length?<ResponsiveGrid minItemWidth={320} maxColumns={3}>{unreadItems.map(n=><PetCareCard key={n.id} style={desktopWeb?styles.desktopCard:undefined}>
      <PetCareBadge label={n.readAt?'Leída':'Nueva'}/>
      <AppText variant="subtitle">{n.title}</AppText>
      <AppText style={desktopWeb?styles.desktopBody:undefined}>{n.body}</AppText>
      <AppText variant="caption" muted>{dateTime(n.createdAt)}</AppText>
      <View style={[styles.actions,desktopWeb&&styles.desktopActions]}><AppButton compact={desktopWeb} label="Ver detalle" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{
        if(!n.readAt)await api.readNotification(n.id);
        if(!n.readAt)publishNotificationChange();
        router.push(notificationPath(n.referenceType,n.referenceId));
      })}/>
      {!n.readAt&&<AppButton compact={desktopWeb} label="Marcar como leída" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{await api.readNotification(n.id);publishNotificationChange();})}/>}
      <AppButton compact={desktopWeb} label="Ocultar notificación" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{await api.hideNotification(n.id);setExtraPages(current=>current?{...current,items:current.items.filter(item=>item.id!==n.id)}:null);publishNotificationChange();})}/></View>
    </PetCareCard>)}</ResponsiveGrid>:<PetCareEmptyState title="Estás al día" message="No tenés notificaciones nuevas." icon="notifications-outline"/>}
      <AppText variant="subtitle">Leídas</AppText>
      {readItems.length?<ResponsiveGrid minItemWidth={320} maxColumns={3}>{readItems.map(n=><PetCareCard key={n.id} style={desktopWeb?styles.desktopCard:undefined}>
        <PetCareBadge label="Leída"/><AppText variant="subtitle">{n.title}</AppText><AppText style={desktopWeb?styles.desktopBody:undefined}>{n.body}</AppText><AppText variant="caption" muted>{dateTime(n.createdAt)}</AppText>
        <View style={[styles.actions,desktopWeb&&styles.desktopActions]}><AppButton compact={desktopWeb} label="Ver detalle" variant="secondary" loading={action.loading} onPress={()=>router.push(notificationPath(n.referenceType,n.referenceId))}/><AppButton compact={desktopWeb} label="Ocultar notificación" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{await api.hideNotification(n.id);setExtraPages(current=>current?{...current,items:current.items.filter(item=>item.id!==n.id)}:null);publishNotificationChange();})}/></View>
      </PetCareCard>)}</ResponsiveGrid>:<PetCareEmptyState title="Todavía no hay notificaciones leídas" message="Las notificaciones que abras o marques como leídas aparecerán acá." icon="mail-open-outline"/>}
    </>}
    {!!pageCursor&&<AppButton label="Cargar más notificaciones" variant="secondary" loading={action.loading} onPress={loadMore}/>}
  </PetCareScreen>;
}

const styles=StyleSheet.create({desktopCard:{flex:1,minWidth:0},desktopBody:{flexGrow:1},actions:{gap:16},desktopActions:{gap:8,marginTop:'auto',paddingTop:8,flexDirection:'row',flexWrap:'wrap',alignItems:'center'}});
