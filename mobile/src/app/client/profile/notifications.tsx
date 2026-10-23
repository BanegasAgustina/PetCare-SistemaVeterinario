import { useEffect, useState } from 'react';
import { Linking, Platform, Switch, View } from 'react-native';
import { PetCareScreen, PetCareHeader, PetCareCard, QueryState } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';
import { FormNotice } from '../../../components/ui/FormNotice';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useAuth } from '../../../hooks/useAuth';
import { clearStoredPushToken, devicePushPermissionStatus, requestPushPermissionAndToken, storedPushToken } from '../../../services/push-notifications';

export default function NotificationPreferencesScreen(){
  const api=useClient();const query=useClientQuery(api.notificationPreferences);const action=useAsyncAction();const {request}=useAuth();
  const [permission,setPermission]=useState<'granted'|'denied'|'unavailable'>('unavailable');
  useEffect(()=>{let active=true;void devicePushPermissionStatus().then(value=>{if(active)setPermission(value);});return()=>{active=false;};},[]);
  const setValue=(key:'pushEnabled'|'appointmentRemindersEnabled'|'orderUpdatesEnabled',value:boolean)=>void action.run(async()=>{
    if(key==='pushEnabled'&&value){
      const token=await requestPushPermissionAndToken();
      await request('/client/notifications/push-token',{method:'POST',body:{token,platform:Platform.OS}});
      await api.updateNotificationPreferences({pushEnabled:true});setPermission('granted');
    }else if(key==='pushEnabled'){
      await api.updateNotificationPreferences({pushEnabled:false});
      const token=await storedPushToken();if(token)await request('/client/notifications/push-token/revoke',{method:'POST',body:{token}});
      await clearStoredPushToken();
    }else await api.updateNotificationPreferences({[key]:value});
    query.reload();
  });
  const row=(label:string,value:boolean,onChange:(v:boolean)=>void)=><View style={{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14}}><AppText style={{flex:1}}>{label}</AppText><Switch value={value} disabled={action.loading} onValueChange={onChange}/></View>;
  return <PetCareScreen><PetCareHeader title="Preferencias de notificaciones" back/><AppText muted>Elegí qué avisos querés recibir. El historial de notificaciones sigue disponible aunque desactives los avisos push.</AppText><QueryState {...query}/>{query.data&&<PetCareCard>
    {row('Notificaciones push en este dispositivo',query.data.pushEnabled,value=>setValue('pushEnabled',value))}
    <AppText variant="caption" muted>Permiso del dispositivo: {permission==='granted'?'concedido':permission==='denied'?'denegado':'no disponible en este entorno'}.</AppText>
    {permission==='denied'&&Platform.OS!=='web'&&<AppText accessibilityRole="link" onPress={()=>void Linking.openSettings()} style={{textDecorationLine:'underline'}}>Abrir ajustes del dispositivo</AppText>}
    {row('Recordatorios de turnos (24 y 4 horas antes)',query.data.appointmentRemindersEnabled,value=>setValue('appointmentRemindersEnabled',value))}
    {row('Avisos de pedidos',query.data.orderUpdatesEnabled,value=>setValue('orderUpdatesEnabled',value))}
  </PetCareCard>}<FormNotice error message={action.error}/></PetCareScreen>;
}
