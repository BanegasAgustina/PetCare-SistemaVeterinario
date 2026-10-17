import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { pushTokenIfAlreadyGranted } from '../../services/push-notifications';
import { notificationPath } from '../../services/notification-path';
import { publishNotificationChange } from '../../services/notification-events';

Notifications.setNotificationHandler({handleNotification:async()=>({
  shouldPlaySound:false,shouldSetBadge:true,shouldShowBanner:true,shouldShowList:true,
})});

export function NotificationBridge() {
  const { user, request } = useAuth();
  const [pendingResponse, setPendingResponse] = useState<Notifications.NotificationResponse | null>(
    () => Notifications.getLastNotificationResponse(),
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(setPendingResponse);
    const receivedSubscription = Notifications.addNotificationReceivedListener(publishNotificationChange);
    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !pendingResponse || user?.role !== 'CLIENT') return;
    const data = pendingResponse.notification.request.content.data ?? {};
    const notificationId = typeof data.notificationId === 'string' && /^[1-9]\d*$/.test(data.notificationId)
      ? data.notificationId
      : null;
    let active=true;
    void (async()=>{
      let ownedNotification=true;
      if(notificationId)try{
        await request(`/client/notifications/${notificationId}/read`,{method:'PATCH'});
        publishNotificationChange();
      }catch{
        ownedNotification=false;
        console.error('No se pudo validar la propiedad de una notificación abierta.');
      }
      if(!active)return;
      router.push(ownedNotification?notificationPath(data.referenceType,data.referenceId):'/client/notifications');
      Notifications.clearLastNotificationResponse();
      setPendingResponse(null);
    })();
    return ()=>{active=false;};
  }, [pendingResponse, request, user?.role]);

  useEffect(() => {
    if (Platform.OS === 'web' || user?.role !== 'CLIENT') return;
    let active = true;
    void pushTokenIfAlreadyGranted()
      .then(async token => {
        if (active && token) await request('/client/notifications/push-token', { method: 'POST', body: { token, platform: Platform.OS } });
      })
      .catch(() => console.error('No se pudo registrar este dispositivo para las notificaciones push.'));
    return () => { active = false; };
  }, [request, user?.id, user?.role]);

  return null;
}
