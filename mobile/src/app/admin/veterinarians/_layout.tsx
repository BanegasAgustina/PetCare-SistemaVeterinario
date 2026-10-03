import { Stack } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
export default function VeterinariansLayout() {const auth=useAuth();return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Screen name="[id]"/><Stack.Protected guard={auth.hasPermission('specialties.manage')}><Stack.Screen name="specialties"/></Stack.Protected></Stack>; }
