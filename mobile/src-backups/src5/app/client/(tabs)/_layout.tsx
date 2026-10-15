/**
 * Navegador del módulo client/(tabs), para CLIENT autenticado. Organiza las rutas; el backend comprueba nuevamente autorización y ownership.
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
export default function ClientTabs(){const {colors}=useTheme();const insets=useSafeAreaInsets();return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:String(colors.primary),tabBarInactiveTintColor:String(colors.muted),tabBarStyle:{backgroundColor:String(colors.background),borderTopColor:String(colors.border),height:76+insets.bottom,paddingBottom:Math.max(insets.bottom,8),paddingTop:4},tabBarItemStyle:{borderRadius:18,marginHorizontal:3,marginVertical:2},tabBarLabelStyle:{fontSize:11,lineHeight:16,fontWeight:'600'},tabBarActiveBackgroundColor:String(colors.accent)}}>
  <Tabs.Screen name="index" options={{title:'Inicio',tabBarIcon:({color,size})=><Ionicons name="home-outline" color={String(color)} size={size}/>}}/>
  <Tabs.Screen name="pets" options={{title:'Mascotas',tabBarIcon:({color,size})=><Ionicons name="paw-outline" color={String(color)} size={size}/>}}/>
  <Tabs.Screen name="appointments" options={{title:'Turnos',tabBarIcon:({color,size})=><Ionicons name="calendar-outline" color={String(color)} size={size}/>}}/>
  <Tabs.Screen name="store" options={{title:'Tienda',tabBarIcon:({color,size})=><Ionicons name="bag-handle-outline" color={String(color)} size={size}/>}}/>
  <Tabs.Screen name="profile" options={{title:'Perfil',tabBarIcon:({color,size})=><Ionicons name="person-outline" color={String(color)} size={size}/>}}/>
</Tabs>;}
