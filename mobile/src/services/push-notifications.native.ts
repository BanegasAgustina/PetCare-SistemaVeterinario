import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'petcare-client-push-token';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('petcare-notifications', {
    name: 'Notificaciones de PetCare',
    importance: AndroidImportance.DEFAULT,
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
  if (Platform.OS !== 'web') await Notifications.dismissAllNotificationsAsync();
}

async function readExpoPushToken(): Promise<string> {
  if (Platform.OS === 'web') throw new Error('Las notificaciones del dispositivo solo están disponibles en la app móvil.');
  const id = projectId();
  if (!id) throw new Error('Falta vincular PetCare con un proyecto EAS para habilitar notificaciones push.');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  if (!token) throw new Error('Expo no devolvió un token de notificaciones válido.');
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  return token;
}

export async function requestPushPermissionAndToken(): Promise<string> {
  await ensureAndroidChannel();
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('No se habilitaron las notificaciones de PetCare en este dispositivo.');
  return readExpoPushToken();
}

export async function pushTokenIfAlreadyGranted(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  await ensureAndroidChannel();
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return null;
  return readExpoPushToken();
}

export async function hasRegisteredPushPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const [permission, token] = await Promise.all([Notifications.getPermissionsAsync(), storedPushToken()]);
  return permission.status === 'granted' && Boolean(token);
}
