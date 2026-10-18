import Constants from 'expo-constants';
import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'petcare-client-push-token';

export async function loadNotificationsModule() {
  if (Platform.OS === 'web' || isRunningInExpoGo()) return null;

  // expo-notifications 58 imports this Android-only native module from its
  // package entry point. Older Expo Go / development builds may not include
  // it, and importing the package then throws before any notification API is
  // used (which also prevents Expo Router from loading its routes).
  if (Platform.OS === 'android' && !requireOptionalNativeModule('ExpoTopicSubscriptionModule')) return null;

  return import('expo-notifications');
}

async function ensureAndroidChannel(notifications: NonNullable<Awaited<ReturnType<typeof loadNotificationsModule>>>): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifications.setNotificationChannelAsync('petcare-notifications', {
    name: 'Notificaciones de PetCare',
    importance: notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#def1ea',
  });
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function storedPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function clearStoredPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

export async function dismissDeviceNotifications(): Promise<void> {
  const notifications = await loadNotificationsModule();
  if (notifications) await notifications.dismissAllNotificationsAsync();
}

async function readExpoPushToken(): Promise<string> {
  if (Platform.OS === 'web') throw new Error('Las notificaciones del dispositivo solo están disponibles en la app móvil.');
  if (isRunningInExpoGo()) throw new Error('Las notificaciones push requieren una Development Build o un APK propio.');
  const id = projectId();
  if (!id) throw new Error('Falta vincular PetCare con un proyecto EAS para habilitar notificaciones push.');
  const notifications = await loadNotificationsModule();
  if (!notifications) throw new Error('Las notificaciones push no están disponibles en este entorno.');
  const token = (await notifications.getExpoPushTokenAsync({ projectId: id })).data;
  if (!token) throw new Error('Expo no devolvió un token de notificaciones válido.');
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  return token;
}

export async function requestPushPermissionAndToken(): Promise<string> {
  if (isRunningInExpoGo()) throw new Error('Las notificaciones push requieren una Development Build o un APK propio.');
  const notifications = await loadNotificationsModule();
  if (!notifications) throw new Error('Las notificaciones del dispositivo no están disponibles en esta plataforma.');
  await ensureAndroidChannel(notifications);
  let permission = await notifications.getPermissionsAsync();
  if (permission.status !== 'granted') permission = await notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('No se habilitaron las notificaciones de PetCare en este dispositivo.');
  return readExpoPushToken();
}

export async function pushTokenIfAlreadyGranted(): Promise<string | null> {
  if (Platform.OS === 'web' || isRunningInExpoGo()) return null;
  const notifications = await loadNotificationsModule();
  if (!notifications) return null;
  await ensureAndroidChannel(notifications);
  const permission = await notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return null;
  return readExpoPushToken();
}

export async function hasRegisteredPushPermission(): Promise<boolean> {
  if (Platform.OS === 'web' || isRunningInExpoGo()) return false;
  const notifications = await loadNotificationsModule();
  if (!notifications) return false;
  const [permission, token] = await Promise.all([notifications.getPermissionsAsync(), storedPushToken()]);
  return permission.status === 'granted' && Boolean(token);
}
