/** Vista de cuenta para clientes y profesionales; Admin usa la estructura de perfil compartida. */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FormNotice } from '../components/ui/FormNotice';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { router } from 'expo-router';
import { roleHome } from '../utils/role-home';
import { AdminFormActions, AdminFormSection } from '../components/admin/AdminFormLayout';
import { OAuthLinks } from '../components/ui/OAuthLinks';
import { roleLabel } from '../utils/role-label';
import { AppInput } from '../components/forms/AppInput';
import { useFeedback } from '../contexts/FeedbackContext';
import { PetCareCard, PetCareHeader, PetCareScreen, ResponsiveGrid } from '../components/client/PetCareUI';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function AccountScreen() {
  const auth = useAuth();
  const { colors, mode, setPreference } = useTheme();
  const action = useAsyncAction();
  const { showToast } = useFeedback();
  const [firstName,setFirstName]=useState(auth.user?.firstName??'');const [lastName,setLastName]=useState(auth.user?.lastName??'');const [phone,setPhone]=useState(auth.user?.phone??'');
  const [profileError,setProfileError]=useState<string|null>(null);const [savingProfile,setSavingProfile]=useState(false);
  const [currentPassword,setCurrentPassword]=useState('');const [newPassword,setNewPassword]=useState('');const [confirmPassword,setConfirmPassword]=useState('');const [passwordError,setPasswordError]=useState<string|null>(null);const [savingPassword,setSavingPassword]=useState(false);
  const [confirmLogout,setConfirmLogout]=useState(false);
  if (!auth.user) return null;
  const isAdmin=auth.user.role==='ADMIN'||auth.user.role==='SUPER_ADMIN';
  const isClient=auth.user.role==='CLIENT';
  if(isAdmin)return <PetCareScreen wide>
    <PetCareHeader title="Mi perfil" subtitle="Datos personales y seguridad" back/>
    <ResponsiveGrid>
      <PetCareCard>
        <AppText variant="subtitle">Información de la cuenta</AppText>
        <AppText>{auth.user.firstName} {auth.user.lastName}</AppText>
        <AppText>{auth.user.email}</AppText>
        <AppText muted>{auth.user.phone ?? 'Sin teléfono registrado'}</AppText>
        <AppText variant="caption">{roleLabel(auth.user.role,auth.user.roleName ?? auth.user.role)} · Cuenta activa</AppText>
      </PetCareCard>
      <PetCareCard>
        <AppText variant="subtitle">Datos personales</AppText>
        <AppInput label="Nombre" required value={firstName} onChangeText={setFirstName} autoCapitalize="words" maxLength={100}/>
        <AppInput label="Apellido" required value={lastName} onChangeText={setLastName} autoCapitalize="words" maxLength={100}/>
        <AppInput label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={40}/>
        <AppInput label="Correo electrónico" value={auth.user.email} editable={false}/>
        <FormNotice message={profileError} error/>
        <AppButton label="Guardar perfil" loading={savingProfile} disabled={savingProfile} onPress={()=>void (async()=>{setProfileError(null);if(!firstName.trim()||!lastName.trim()){setProfileError('Completá nombre y apellido.');return;}setSavingProfile(true);try{await auth.request('/admin/account',{method:'PUT',body:{firstName:firstName.trim(),lastName:lastName.trim(),phone:phone.trim()||null}});await auth.refreshProfile();showToast('Perfil actualizado','success');}catch(error){setProfileError(error instanceof Error?error.message:'No se pudo guardar el perfil.');}finally{setSavingProfile(false);}})()}/>
      </PetCareCard>
      <PetCareCard>
        <AppText variant="subtitle">Seguridad</AppText>
        <AppText muted>Al cambiar la contraseña se cerrarán tus sesiones activas.</AppText>
        <AppInput label="Contraseña actual" required password value={currentPassword} onChangeText={setCurrentPassword} autoComplete="current-password"/>
        <AppInput label="Nueva contraseña" required password value={newPassword} onChangeText={setNewPassword} autoComplete="new-password"/>
        <AppText variant="caption" muted>Al menos 8 caracteres, mayúscula, minúscula, número y símbolo.</AppText>
        <AppInput label="Repetir nueva contraseña" required password value={confirmPassword} onChangeText={setConfirmPassword} autoComplete="new-password"/>
        <FormNotice message={passwordError} error/>
        <AppButton label="Cambiar contraseña" loading={savingPassword} disabled={savingPassword} onPress={()=>void (async()=>{setPasswordError(null);if(!currentPassword||!newPassword||!confirmPassword){setPasswordError('Completá los tres campos.');return;}if(newPassword!==confirmPassword){setPasswordError('Las contraseñas nuevas no coinciden.');return;}setSavingPassword(true);try{await auth.request('/admin/account/password',{method:'PUT',body:{currentPassword,newPassword}});showToast('Contraseña actualizada. Iniciá sesión nuevamente.','success');await auth.signOut();router.replace('/login');}catch(error){setPasswordError(error instanceof Error?error.message:'No se pudo cambiar la contraseña.');}finally{setSavingPassword(false);}})()}/>
      </PetCareCard>
      <PetCareCard>
        <AppText variant="subtitle">Preferencias y sesión</AppText>
        <AppButton label={mode === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'} variant="secondary" onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')} />
        <AppButton label="Cerrar sesión" variant="secondary" onPress={() => setConfirmLogout(true)} />
        <AppButton label="Volver al panel" variant="secondary" onPress={() => router.replace(roleHome(auth.user))} />
      </PetCareCard>
    </ResponsiveGrid>
    <ConfirmModal visible={confirmLogout} title="Cerrar sesión" message="Podés volver a ingresar cuando quieras." confirmLabel="Cerrar sesión" destructive onCancel={()=>setConfirmLogout(false)} onConfirm={auth.signOut}/>
  </PetCareScreen>;
  return <ScreenContainer>
    <AppText variant="caption" muted>PETCARE · TU CUENTA</AppText>
    <AppText variant="title">Hola, {auth.user.firstName}</AppText>
    <AppText muted>Tu sesión está activa. Estos son los datos de tu cuenta.</AppText>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="subtitle">{auth.user.firstName} {auth.user.lastName}</AppText>
      <AppText>{auth.user.email}</AppText>
      <AppText muted>{auth.user.phone ?? 'Sin teléfono registrado'}</AppText>
      <AppText variant="caption">{roleLabel(auth.user.role,auth.user.roleName ?? auth.user.role)}</AppText>
    </View>
    <FormNotice message={action.error} error />
    {isClient?<>
      <OAuthLinks />
      <AppButton label="Volver a mi panel" variant="secondary" onPress={()=>router.replace(roleHome(auth.user))} />
      <AppButton label={action.loading ? 'Procesando…' : 'Volver a consultar mis datos'} loading={action.loading} onPress={() => void action.run(auth.refreshProfile)} />
      <AppButton label="Cerrar sesión" variant="secondary" disabled={action.loading} onPress={() => void action.run(auth.signOut)} />
      <AppButton label={mode === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'} variant="secondary" onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')} />
    </>:<AdminFormSection title="Acciones de la cuenta">
      <AdminFormActions><AppButton label="Volver a mi panel" variant="secondary" onPress={()=>router.replace(roleHome(auth.user))} />
      <AppButton label={action.loading ? 'Procesando…' : 'Volver a consultar mis datos'} loading={action.loading} onPress={() => void action.run(auth.refreshProfile)} />
      <AppButton label="Cerrar sesión" variant="secondary" disabled={action.loading} onPress={() => void action.run(auth.signOut)} />
      <AppButton label={mode === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'} variant="secondary" onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')} /></AdminFormActions>
    </AdminFormSection>}
  </ScreenContainer>;
}
const styles = StyleSheet.create({ card: { padding: 20, borderWidth: 1, borderRadius: 24, gap: 12 } });
