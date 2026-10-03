import { Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
export default function AdminLayout() {
  const { user }=useAuth();
  const canManage=user?.role==='SUPER_ADMIN' && user.permissions?.includes('veterinarians.manage');
  return <Stack screenOptions={{headerShown:false}}>
    <Stack.Screen name="index" />
    <Stack.Protected guard={Boolean(canManage)}><Stack.Screen name="veterinarians" /></Stack.Protected>
  </Stack>;
}
