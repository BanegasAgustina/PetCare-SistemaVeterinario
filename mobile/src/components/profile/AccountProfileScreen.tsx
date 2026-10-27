import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClient } from '../../hooks/useClient';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useTheme } from '../../hooks/useTheme';
import { useFeedback } from '../../contexts/FeedbackContext';
import { ApiError } from '../../services/api';
import { firstInvalidField, validateIdentityForm, validatePasswordForm } from '../../utils/auth-validation';
import type { AuthUser } from '../../types/auth';
import { roleHome } from '../../utils/role-home';
import { roleLabel } from '../../utils/role-label';
import { PetCareCard, PetCareHeader, PetCareScreen, PetImage, PetCareAction, PetCareSection, QueryState } from '../client/PetCareUI';
import { AppInput } from '../forms/AppInput';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { FormNotice } from '../ui/FormNotice';
import { ConfirmModal } from '../ui/ConfirmModal';
import { SelectionRow } from '../ui/SelectionRow';
import { ProfilePhotoInput, type PickedProfilePhoto } from '../forms/ProfilePhotoInput';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { responsiveLayout } from '../../constants/responsive';
import { AdminFormActions,AdminFormField,AdminFormGrid,AdminFormSection } from '../admin/AdminFormLayout';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

type ProfileSection = 'all' | 'personal' | 'security' | 'theme';
type ProfileValues = { firstName: string; lastName: string; phone: string };
type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;
type PasswordValues = { currentPassword: string; password: string; confirmPassword: string };
type PasswordErrors = Partial<Record<keyof PasswordValues, string>>;

export function AccountProfileScreen({ section = 'all' }: { section?: ProfileSection }) {
  const auth = useAuth();
  const user = auth.user;
  const client = useClient();
  const { colors, preference, setPreference } = useTheme();
  const { showToast } = useFeedback();
  const profileAction = useAsyncAction();
  const passwordAction = useAsyncAction();
  const photoAction = useAsyncAction();
  const [values, setValues] = useState<ProfileValues>({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [password, setPassword] = useState<PasswordValues>({ currentPassword: '', password: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const profileInputs = useRef<Partial<Record<keyof ProfileValues, ComponentRef<typeof TextInput> | null>>>({});
  const passwordInputs = useRef<Partial<Record<keyof PasswordValues, ComponentRef<typeof TextInput> | null>>>({});
  const [professionalDescription, setProfessionalDescription] = useState(user?.veterinarian?.professionalDescription ?? '');
  const [photo, setPhoto] = useState<PickedProfilePhoto | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [initialProfile, setInitialProfile] = useState(JSON.stringify({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' }));
  const [initialDescription, setInitialDescription] = useState(user?.veterinarian?.professionalDescription ?? '');
  const initialPassword = JSON.stringify({ currentPassword: '', password: '', confirmPassword: '' });

  useEffect(() => {
    if (!user) return;
    const profile = { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' };
    const description = user.veterinarian?.professionalDescription ?? '';
    setValues(profile);
    setInitialProfile(JSON.stringify(profile));
    setProfessionalDescription(description);
    setInitialDescription(description);
  }, [user]);

  const hasUnsavedChanges = section === 'personal'
    ? JSON.stringify(values) !== initialProfile || professionalDescription !== initialDescription || Boolean(photo) || removePhoto
    : section === 'security' && JSON.stringify(password) !== initialPassword;
  const { confirmation: unsavedChangesPrompt, allowNavigation } = useUnsavedChangesGuard(hasUnsavedChanges);

  if (!user) return null;
  const isClient = user.role === 'CLIENT';
  const isVet = user.role === 'VETERINARIAN';
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const canEditProfile = isClient || isVet || isAdmin || auth.hasPermission('personal.profile.manage');
  const canEditPassword = canEditProfile;
  const showPersonal = section === 'personal';
  const showSecurity = section === 'security';
  const showTheme = section === 'theme';
  const personalEditPath = isClient ? '/client/profile/edit' : '/account?section=personal';
  const securityEditPath = isClient ? '/client/profile/security' : '/account?section=security';
  const themePath = isClient ? '/client/profile/appearance' : '/account?section=theme';

  async function saveProfile() {
    setErrors({});
    const validation = validateIdentityForm({ ...values, email: user?.email ?? '' });
    const nextErrors: ProfileErrors = {
      ...(validation.firstName ? { firstName: validation.firstName } : {}),
      ...(validation.lastName ? { lastName: validation.lastName } : {}),
      ...(validation.phone ? { phone: validation.phone } : {}),
    };
    setErrors(nextErrors);
    const firstInvalid = firstInvalidField(['firstName', 'lastName', 'phone'] as const, nextErrors);
    if (firstInvalid) {
      profileInputs.current[firstInvalid]?.focus();
      return;
    }

    const saved = await profileAction.run(async () => {
      const identity = { firstName: values.firstName.normalize('NFC').trim().replace(/\s+/g, ' '), lastName: values.lastName.normalize('NFC').trim().replace(/\s+/g, ' '), phone: values.phone.trim() };
      if (isAdmin) {
        await auth.request('/admin/account', { method: 'PUT', body: { ...identity, phone: identity.phone || null } });
      } else if (isVet) {
        await auth.request('/vet/profile', { method: 'PATCH', body: { ...identity, phone: identity.phone || null, professionalDescription: professionalDescription.trim() } });
      } else {
        await client.updateProfile(identity);
      }
      await auth.refreshProfile();
    });
    if (saved) {
      setInitialProfile(JSON.stringify(values));
      setInitialDescription(professionalDescription);
      showToast('Datos actualizados', 'success');
    }
  }

  async function savePhoto() {
    if (!isVet || (!photo && !removePhoto)) return;
    const saved = await photoAction.run(async () => {
      await auth.request('/vet/profile/photo', { method: 'PUT', body: photo ? { photoBase64: photo.base64 } : { removePhoto: true } });
      await auth.refreshProfile();
      setPhoto(null);
      setRemovePhoto(false);
    });
    if (saved) showToast('Foto de perfil actualizada', 'success');
  }

  async function changePassword() {
    const fieldErrors: PasswordErrors = {};
    if (!password.currentPassword) fieldErrors.currentPassword = 'Ingresá tu contraseña actual.';
    const validation = validatePasswordForm(password);
    if (validation.password) fieldErrors.password = validation.password;
    if (validation.confirmPassword) fieldErrors.confirmPassword = validation.confirmPassword;
    setPasswordErrors(fieldErrors);
    const firstInvalid = firstInvalidField(['currentPassword', 'password', 'confirmPassword'] as const, fieldErrors);
    if (firstInvalid) {
      passwordInputs.current[firstInvalid]?.focus();
      return;
    }

    const saved = await passwordAction.run(async () => {
      try {
        if (isAdmin) await auth.request('/admin/account/password', { method: 'PUT', body: { currentPassword: password.currentPassword, newPassword: password.password } });
        else if (isVet) await auth.request('/vet/profile/password', { method: 'PUT', body: { currentPassword: password.currentPassword, newPassword: password.password } });
        else await client.changePassword(password.currentPassword, password.password);
      } catch (error) {
        if (error instanceof ApiError && error.code === 'CURRENT_PASSWORD_INVALID') setPasswordErrors(current => ({ ...current, currentPassword: error.message }));
        throw error;
      }
    });
    if (saved) {
      showToast('Contraseña actualizada. Iniciá sesión nuevamente.', 'success');
      setPassword({ currentPassword: '', password: '', confirmPassword: '' });
      allowNavigation();
      await auth.signOut();
      router.replace('/login');
    } else if (passwordAction.error && passwordAction.error.toLowerCase().includes('contraseña actual')) {
      setPasswordErrors(previous => ({ ...previous, currentPassword: passwordAction.error ?? undefined }));
      passwordInputs.current.currentPassword?.focus();
    }
  }

  async function saveProfessionalDescription() {
    if (!isVet) return;
    const saved = await profileAction.run(async () => {
      await auth.request('/vet/profile', { method: 'PATCH', body: { firstName: values.firstName.trim(), lastName: values.lastName.trim(), phone: values.phone.trim() || null, professionalDescription: professionalDescription.trim() } });
      await auth.refreshProfile();
    });
    if (saved) {
      setInitialDescription(professionalDescription);
      showToast('Descripción profesional actualizada', 'success');
    }
  }

  const title = section === 'personal' ? 'Mis datos' : section === 'security' ? 'Seguridad' : section === 'theme' ? 'Tema' : 'Mi perfil';
  return <PetCareScreen wide>
    <PetCareHeader title={title} subtitle={section === 'all' ? 'Información y configuración de tu cuenta' : undefined} back={section !== 'all' || !isClient}/>
    {section === 'all' && <PetCareCard>
      <View style={styles.identity}>
        <PetImage uri={user.profilePhotoUrl ?? null} size={68}/>
        <View style={styles.identityCopy}>
          <AppText variant="subtitle">{user.firstName || 'Pendiente de completar'} {user.lastName || ''}</AppText>
          <AppText muted>{roleLabel(user.role, user.roleName ?? user.role)}</AppText>
          <AppText>{user.email || 'Correo pendiente de completar'}</AppText>
          <AppText muted>{user.phone || 'Teléfono pendiente de completar'}</AppText>
        </View>
      </View>
    </PetCareCard>}

    {showPersonal && <PetCareSection title="Datos personales">
      {isVet && <VetPhotoCard user={user} photo={photo} removePhoto={removePhoto} action={photoAction} onSelect={value => { setPhoto(value); setRemovePhoto(false); }} onRemove={() => { setPhoto(null); setRemovePhoto(true); }} onSave={() => void savePhoto()}/>}
      <PetCareCard>
        <AdminFormGrid columns={2}>
          <AdminFormField><AppInput ref={input => { profileInputs.current.firstName = input; }} label="Nombre" required value={values.firstName} error={errors.firstName} editable={canEditProfile && !profileAction.loading} autoCapitalize="words" maxLength={100} onChangeText={firstName => { setValues(current => ({ ...current, firstName })); setErrors(current => ({ ...current, firstName: undefined })); }}/></AdminFormField>
          <AdminFormField><AppInput ref={input => { profileInputs.current.lastName = input; }} label="Apellido" required value={values.lastName} error={errors.lastName} editable={canEditProfile && !profileAction.loading} autoCapitalize="words" maxLength={100} onChangeText={lastName => { setValues(current => ({ ...current, lastName })); setErrors(current => ({ ...current, lastName: undefined })); }}/></AdminFormField>
          <AdminFormField><AppInput ref={input => { profileInputs.current.phone = input; }} label="Teléfono" value={values.phone} error={errors.phone} editable={canEditProfile && !profileAction.loading} keyboardType="phone-pad" maxLength={40} onChangeText={phone => { setValues(current => ({ ...current, phone })); setErrors(current => ({ ...current, phone: undefined })); }}/></AdminFormField>
          <AdminFormField><AppInput label="Correo electrónico" value={user.email} editable={false} autoCapitalize="none" keyboardType="email-address"/></AdminFormField>
          <AdminFormField fullWidth><AppText variant="caption" muted>El correo electrónico identifica tu cuenta y no puede modificarse desde el perfil.</AppText></AdminFormField>
          {!canEditProfile && <AdminFormField fullWidth><AppText muted>No tenés permiso para editar los datos de tu perfil.</AppText></AdminFormField>}
          <AdminFormField fullWidth><FormNotice error message={profileAction.error}/></AdminFormField>
        </AdminFormGrid>
        {canEditProfile && <AdminFormActions><AppButton label="Guardar datos" loading={profileAction.loading} disabled={profileAction.loading} onPress={() => void saveProfile()}/></AdminFormActions>}
      </PetCareCard>
    </PetCareSection>}

    {isVet && section === 'personal' && <VeterinarianDetails user={user} description={professionalDescription} setDescription={setProfessionalDescription} onSave={() => void saveProfessionalDescription()} loading={profileAction.loading} error={profileAction.error}/>}

    {showSecurity && <PetCareSection title="Seguridad">
      <PetCareCard>
        <AdminFormSection title="Actualizar contraseña" columns={2}>
          <AdminFormField><AppInput ref={input => { passwordInputs.current.currentPassword = input; }} label="Contraseña actual" required password autoComplete="current-password" value={password.currentPassword} error={passwordErrors.currentPassword} editable={canEditPassword && !passwordAction.loading} onChangeText={currentPassword => { setPassword(current => ({ ...current, currentPassword })); setPasswordErrors(current => ({ ...current, currentPassword: undefined })); }}/></AdminFormField>
          <AdminFormField><AppInput ref={input => { passwordInputs.current.password = input; }} label="Nueva contraseña" required password autoComplete="new-password" value={password.password} error={passwordErrors.password} editable={canEditPassword && !passwordAction.loading} onChangeText={next => { setPassword(current => ({ ...current, password: next })); setPasswordErrors(current => ({ ...current, password: undefined })); }}/></AdminFormField>
          <AdminFormField fullWidth><AppText variant="caption" muted>Al menos 8 caracteres, mayúscula, minúscula, número y símbolo. Al cambiarla se cerrarán tus sesiones activas.</AppText></AdminFormField>
          <AdminFormField><AppInput ref={input => { passwordInputs.current.confirmPassword = input; }} label="Repetir nueva contraseña" required password autoComplete="new-password" value={password.confirmPassword} error={passwordErrors.confirmPassword} editable={canEditPassword && !passwordAction.loading} onChangeText={confirmPassword => { setPassword(current => ({ ...current, confirmPassword })); setPasswordErrors(current => ({ ...current, confirmPassword: undefined })); }}/></AdminFormField>
          {!canEditPassword && <AdminFormField fullWidth><AppText muted>No tenés permiso para cambiar la contraseña desde el perfil.</AppText></AdminFormField>}
          <AdminFormField fullWidth><FormNotice error message={passwordAction.error}/></AdminFormField>
        </AdminFormSection>
        {canEditPassword && <AdminFormActions><AppButton label="Cambiar contraseña" loading={passwordAction.loading} disabled={passwordAction.loading} onPress={() => void changePassword()}/></AdminFormActions>}
      </PetCareCard>
    </PetCareSection>}

    {showTheme && <PetCareSection title="Tema">
      <PetCareCard>
        <SelectionRow label="Usar tema del dispositivo" checked={preference === 'system'} onPress={() => setPreference('system')}/>
        <SelectionRow label="Modo oscuro" checked={preference === 'dark'} onPress={() => setPreference('dark')}/>
        <SelectionRow label="Modo claro" checked={preference === 'light'} onPress={() => setPreference('light')}/>
      </PetCareCard>
    </PetCareSection>}

    {section === 'all' && <PetCareSection title="Configuración de cuenta">
      <PetCareAction title="Editar datos personales" icon="person-outline" onPress={() => router.push(personalEditPath as never)}/>
      <PetCareAction title="Cambiar contraseña" icon="lock-closed-outline" onPress={() => router.push(securityEditPath as never)}/>
      <PetCareAction title="Tema" icon="contrast-outline" onPress={() => router.push(themePath as never)}/>
    </PetCareSection>}

    {section === 'all' && <PetCareSection title="Sesión">
      {!isClient && <AppButton label="Volver a mi espacio" variant="secondary" onPress={() => router.replace(roleHome(user) as never)}/>}
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={() => setLogoutOpen(true)} style={({ pressed }) => [styles.logout, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}>
        <AppText style={{ color: colors.text, fontWeight: '600' }}>Cerrar sesión</AppText>
      </Pressable>
    </PetCareSection>}
    <ConfirmModal visible={logoutOpen} title="Cerrar sesión" message="Podés volver a ingresar cuando quieras." confirmLabel="Cerrar sesión" onCancel={() => setLogoutOpen(false)} onConfirm={auth.signOut}/>
    {unsavedChangesPrompt}
  </PetCareScreen>;
}

function VetPhotoCard({ user, photo, removePhoto, action, onSelect, onRemove, onSave }: { user: AuthUser; photo: PickedProfilePhoto | null; removePhoto: boolean; action: ReturnType<typeof useAsyncAction>; onSelect: (value: PickedProfilePhoto) => void; onRemove: () => void; onSave: () => void }) {
  return <PetCareCard>
    <AppText variant="subtitle">Foto de perfil</AppText>
    <ProfilePhotoInput currentUri={removePhoto ? null : user.profilePhotoUrl ?? null} photo={photo} onSelect={onSelect} onRemove={onRemove} disabled={action.loading}/>
    {(photo || removePhoto) && <><FormNotice error message={action.error}/><AppButton label="Guardar foto" loading={action.loading} disabled={action.loading} onPress={onSave}/></>}
  </PetCareCard>;
}

function VeterinarianDetails({ user, description, setDescription, onSave, loading, error }: { user: AuthUser; description: string; setDescription: (value: string) => void; onSave: () => void; loading: boolean; error: string | null }) {
  const clinic = useClinic();
  const loadCatalog = useCallback(() => clinic.catalog(), [clinic]);
  const catalog = useClientQuery(loadCatalog);
  const serviceIds = user.professional?.serviceIds ?? [];
  const services = catalog.data?.services.filter(service => serviceIds.includes(String(service.id))) ?? [];
  return <PetCareSection title="Información profesional">
    <PetCareCard>
      <AppText variant="subtitle">Especialidades</AppText>
      <AppText>{user.veterinarian?.specialties.map(specialty => specialty.name).join(', ') || 'Pendiente de completar'}</AppText>
      <AppText variant="subtitle">Matrícula</AppText>
      <AppText>{user.veterinarian?.licenseNumber || 'Pendiente de completar'}</AppText>
      <AppText variant="subtitle">Servicios asignados</AppText>
      <QueryState {...catalog}/>
      {!catalog.loading && !catalog.error && <>{services.length ? services.map(service => <AppText key={service.id}>{service.name}</AppText>) : <AppText muted>Sin servicios asignados.</AppText>}</>}
      <AppText muted>La matrícula, las especialidades y los servicios se gestionan con la administración.</AppText>
    </PetCareCard>
    <PetCareCard>
      <AppInput label="Descripción profesional" multiline value={description} maxLength={2000} onChangeText={setDescription}/>
      <FormNotice error message={error}/>
      <AppButton label="Guardar descripción" loading={loading} disabled={loading} onPress={onSave}/>
    </PetCareCard>
  </PetCareSection>;
}

export function ProfileEditRoute() { return <AccountProfileScreen section="personal"/>; }
export function ProfileSecurityRoute() { return <AccountProfileScreen section="security"/>; }

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: responsiveLayout.grid.gap },
  identityCopy: { flex: 1, minWidth: 0, gap: responsiveLayout.form.gap / 3 },
  logout: { minHeight: 50, width: '100%', paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
