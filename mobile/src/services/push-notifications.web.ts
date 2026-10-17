export async function storedPushToken(): Promise<string | null> { return null; }
export async function clearStoredPushToken(): Promise<void> {}
export async function dismissDeviceNotifications(): Promise<void> {}
export async function requestPushPermissionAndToken(): Promise<string> {
  throw new Error('Las notificaciones del dispositivo solo están disponibles en la app móvil.');
}
export async function pushTokenIfAlreadyGranted(): Promise<string | null> { return null; }
export async function hasRegisteredPushPermission(): Promise<boolean> { return false; }
