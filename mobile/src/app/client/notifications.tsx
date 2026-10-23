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
import { AppState,Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { requestPushPermissionAndToken, storedPushToken, clearStoredPushToken, hasRegisteredPushPermission } from '../../services/push-notifications';
import { notificationPath } from '../../services/notification-path';
import { subscribeToNotificationChanges } from '../../services/notification-events';

export default function NotificationsScreen(){
  const api=useClient();
  const query=useClientQuery(api.notifications);
  const action=useAsyncAction();
  const {request}=useAuth();
  const [pushEnabled,setPushEnabled]=useState(false);
  const [extraPages,setExtraPages]=useState<{baseId:string;items:import('../../types/client').Notification[];cursor:string|null}|null>(null);
  const firstId=query.data?.items[0]?.id??'';
  const extraItems=extraPages?.baseId===firstId?extraPages.items:[];
  const pageCursor=extraPages?.baseId===firstId?extraPages.cursor:query.data?.nextCursor??null;
  useEffect(()=>{
    let active=true;
    if(Platform.OS!=='web')void hasRegisteredPushPermission()
      .then(enabled=>{if(active)setPushEnabled(enabled);})
      .catch(()=>console.error('No se pudo consultar el registro de notificaciones del dispositivo.'));
    const unsubscribe=subscribeToNotificationChanges(query.reload);
    const interval=setInterval(query.reload,30_000);
    const appState=AppState.addEventListener('change',state=>{if(state==='active'&&Platform.OS!=='web')void hasRegisteredPushPermission().then(enabled=>{if(active)setPushEnabled(enabled);}).catch(()=>console.error('No se pudo actualizar el permiso de notificaciones del dispositivo.'));});
    return ()=>{active=false;unsubscribe();clearInterval(interval);appState.remove();};
  },[query.reload]);
  const enablePush=()=>void action.run(async()=>{
    const token=await requestPushPermissionAndToken();
    await request('/client/notifications/push-token',{method:'POST',body:{token,platform:Platform.OS}});
    await api.updateNotificationPreferences({pushEnabled:true});
    setPushEnabled(true);
  });
  const disablePush=()=>void action.run(async()=>{
    await api.updateNotificationPreferences({pushEnabled:false});
    const token=await storedPushToken();
    if(token)await request('/client/notifications/push-token/revoke',{method:'POST',body:{token}});
    await clearStoredPushToken();
    setPushEnabled(false);
  });
  const readAll=()=>void action.run(async()=>{
    await api.readAllNotifications();
    query.reload();
  });
  const loadMore=()=>void action.run(async()=>{
    if(!pageCursor||!firstId)return;
    const page=await api.notifications(pageCursor);
    setExtraPages(current=>({baseId:firstId,items:[...(current?.baseId===firstId?current.items:[]),...page.items],cursor:page.nextCursor}));
  });
  return <PetCareScreen>
    <PetCareHeader title="Notificaciones" back/>
    {Platform.OS!=='web'&&<>
      <AppText variant="caption" muted>Activá las notificaciones para recibir novedades de turnos y pedidos. El permiso se verifica de nuevo al regresar desde Ajustes.</AppText>
      <AppText muted>Estado registrado en este dispositivo: {pushEnabled?'activadas':'desactivadas'}</AppText>
      <AppButton label={pushEnabled?'Desactivar notificaciones en este dispositivo':'Activar notificaciones en este dispositivo'} variant="secondary" loading={action.loading} onPress={pushEnabled?disablePush:enablePush}/>
      {action.error?.includes('ajustes')&&<AppButton label="Abrir ajustes del dispositivo" variant="secondary" onPress={()=>void Linking.openSettings()}/>}
    </>}
    {Platform.OS==='web'&&<PetCareCard><AppText variant="subtitle">Notificaciones del navegador</AppText><AppText muted>Las notificaciones push no están habilitadas en esta versión web. En Android, el registro remoto requiere una Development Build o un APK propio; Expo Go no está habilitado para este flujo.</AppText></PetCareCard>}
    {!!query.data?.unreadCount&&<PetCareBadge label={`${query.data.unreadCount} sin leer`}/>}
    {!!query.data?.unreadCount&&<AppButton label="Marcar todas como leídas" variant="secondary" loading={action.loading} onPress={readAll}/>}
    <QueryState {...query}/>
    <FormNotice error message={action.error}/>
    {query.data&&(query.data.items.length||extraItems.length?<ResponsiveGrid>{[...query.data.items,...extraItems].map(n=><PetCareCard key={n.id}>
      <PetCareBadge label={n.readAt?'Leída':'Nueva'}/>
      <AppText variant="subtitle">{n.title}</AppText>
      <AppText>{n.body}</AppText>
      <AppText variant="caption" muted>{dateTime(n.createdAt)}</AppText>
      <AppButton label="Ver detalle" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{
        if(!n.readAt)await api.readNotification(n.id);
        query.reload();
        router.push(notificationPath(n.referenceType,n.referenceId));
      })}/>
      {!n.readAt&&<AppButton label="Marcar como leída" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{await api.readNotification(n.id);query.reload();})}/>}
      <AppButton label="Ocultar notificación" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{await api.hideNotification(n.id);setExtraPages(current=>current?{...current,items:current.items.filter(item=>item.id!==n.id)}:null);query.reload();})}/>
    </PetCareCard>)}</ResponsiveGrid>:<PetCareEmptyState title="Estás al día" message="No tenés notificaciones nuevas." icon="notifications-outline"/>)}
    {!!pageCursor&&<AppButton label="Cargar más notificaciones" variant="secondary" loading={action.loading} onPress={loadMore}/>}
  </PetCareScreen>;
}
