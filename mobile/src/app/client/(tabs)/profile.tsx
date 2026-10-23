/**
 * Pantalla de perfil autenticado para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareAction } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useTheme } from '../../../hooks/useTheme';
export default function ProfileScreen(){const auth=useAuth();const {colors}=useTheme();const [logout,setLogout]=useState(false);return <PetCareScreen><PetCareHeader title="Mi perfil" subtitle="Un espacio para vos"/><PetCareCard><AppText variant="subtitle">{auth.user?.firstName} {auth.user?.lastName}</AppText><AppText>{auth.user?.email}</AppText><AppText muted>{auth.user?.phone??'Sin teléfono registrado'}</AppText></PetCareCard><PetCareAction title="Mis datos" icon="person-outline" onPress={()=>router.push('/client/profile/edit')}/><PetCareAction title="Seguridad" icon="lock-closed-outline" onPress={()=>router.push('/client/profile/security')}/><PetCareAction title="Mis pedidos" icon="receipt-outline" onPress={()=>router.push('/client/orders')}/><PetCareAction title="Notificaciones" icon="notifications-outline" onPress={()=>router.push('/client/notifications')}/><PetCareAction title="Preferencias de notificaciones" icon="options-outline" onPress={()=>router.push('/client/profile/notifications')}/><PetCareAction title="Apariencia" icon="contrast-outline" onPress={()=>router.push('/client/profile/appearance')}/><Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={()=>setLogout(true)} style={({pressed})=>({minHeight:50,width:'100%',paddingHorizontal:18,borderRadius:16,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,opacity:pressed?.82:1})}><Ionicons name="log-out-outline" size={20} color={colors.primary}/><AppText style={{color:colors.primary,fontWeight:'600'}}>Cerrar sesión</AppText></Pressable><ConfirmModal visible={logout} title="Cerrar sesión" message="Podés volver a ingresar cuando quieras." confirmLabel="Cerrar sesión" onCancel={()=>setLogout(false)} onConfirm={auth.signOut}/></PetCareScreen>;}
