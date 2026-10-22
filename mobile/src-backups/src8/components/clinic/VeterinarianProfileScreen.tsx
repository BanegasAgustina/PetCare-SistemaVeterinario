/** Perfil propio del veterinario. Matrícula y especialidades se muestran como datos sujetos a verificación. */
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { PetCareScreen,PetCareHeader,PetCareCard,ResponsiveGrid } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppInput } from '../forms/AppInput';
import { AppButton } from '../ui/AppButton';
import { FormNotice } from '../ui/FormNotice';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ProfilePhotoInput,type PickedProfilePhoto } from '../forms/ProfilePhotoInput';

export default function VeterinarianProfileScreen(){
 const auth=useAuth(),user=auth.user;const {showToast}=useFeedback();const profileAction=useAsyncAction(),photoAction=useAsyncAction(),passwordAction=useAsyncAction();
 const [logout,setLogout]=useState(false);
 const [firstName,setFirstName]=useState(user?.firstName??''),[lastName,setLastName]=useState(user?.lastName??''),[phone,setPhone]=useState(user?.phone??''),[description,setDescription]=useState(user?.veterinarian?.professionalDescription??'');
 const [photo,setPhoto]=useState<PickedProfilePhoto|null>(null),[removePhoto,setRemovePhoto]=useState(false);
 const [currentPassword,setCurrentPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[passwordError,setPasswordError]=useState<string|null>(null);
 if(!user)return null;
 async function saveProfile(){const saved=await profileAction.run(async()=>{await auth.request('/vet/profile',{method:'PATCH',body:{firstName:firstName.trim(),lastName:lastName.trim(),phone:phone.trim()||null,professionalDescription:description.trim()}});await auth.refreshProfile();});if(saved)showToast('Perfil actualizado','success');}
 async function savePhoto(){if(!photo&&!removePhoto)return;const saved=await photoAction.run(async()=>{await auth.request('/vet/profile/photo',{method:'PUT',body:photo?{photoBase64:photo.base64}:{removePhoto:true}});await auth.refreshProfile();setPhoto(null);setRemovePhoto(false);});if(saved)showToast('Foto de perfil actualizada','success');}
 async function changePassword(){if(!currentPassword||!newPassword||newPassword!==confirmPassword){setPasswordError('Completá los campos y verificá que las contraseñas nuevas coincidan.');return;}setPasswordError(null);const saved=await passwordAction.run(()=>auth.request('/vet/profile/password',{method:'PUT',body:{currentPassword,newPassword}}));if(saved){showToast('Contraseña actualizada. Iniciá sesión nuevamente.','success');await auth.signOut();}}
 return <PetCareScreen wide><PetCareHeader title="Mi perfil" subtitle="Datos profesionales y seguridad" back/><ResponsiveGrid>
  <PetCareCard><AppText variant="subtitle">Foto de perfil</AppText><ProfilePhotoInput currentUri={removePhoto?null:user.profilePhotoUrl??null} photo={photo} onSelect={value=>{setPhoto(value);setRemovePhoto(false);}} onRemove={()=>{setPhoto(null);setRemovePhoto(true);}} disabled={photoAction.loading}/>{(photo||removePhoto)&&<><FormNotice error message={photoAction.error}/><AppButton label="Guardar foto" loading={photoAction.loading} onPress={()=>void savePhoto()}/></>}</PetCareCard>
  <PetCareCard><AppText variant="subtitle">Datos personales</AppText><AppInput label="Nombre" required value={firstName} onChangeText={setFirstName} maxLength={100}/><AppInput label="Apellido" required value={lastName} onChangeText={setLastName} maxLength={100}/><AppInput label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={40}/><AppInput label="Correo electrónico" value={user.email} editable={false}/><FormNotice error message={profileAction.error}/><AppButton label="Guardar perfil" loading={profileAction.loading} onPress={()=>void saveProfile()}/></PetCareCard>
  <PetCareCard><AppText variant="subtitle">Datos profesionales</AppText><AppText>Especialidad{(user.veterinarian?.specialties.length??0)===1?'':'es'}: {user.veterinarian?.specialties.map(item=>item.name).join(', ')||'Sin especialidad registrada'}</AppText><AppText>Matrícula: {user.veterinarian?.licenseNumber||'Sin matrícula registrada'}</AppText><AppInput label="Descripción profesional" multiline value={description} onChangeText={setDescription} maxLength={2000}/><AppText muted>La matrícula y las especialidades sujetas a validación se gestionan con la administración.</AppText></PetCareCard>
  <PetCareCard><AppText variant="subtitle">Seguridad</AppText><AppText muted>Al cambiar la contraseña se cerrarán tus sesiones activas.</AppText><AppInput label="Contraseña actual" password value={currentPassword} onChangeText={setCurrentPassword}/><AppInput label="Nueva contraseña" password value={newPassword} onChangeText={setNewPassword}/><AppText variant="caption" muted>Al menos 8 caracteres, mayúscula, minúscula, número y carácter especial.</AppText><AppInput label="Repetir nueva contraseña" password value={confirmPassword} error={passwordError??undefined} onChangeText={setConfirmPassword}/><FormNotice error message={passwordAction.error}/><AppButton label="Cambiar contraseña" loading={passwordAction.loading} onPress={()=>void changePassword()}/></PetCareCard>
  </ResponsiveGrid>
  <AppButton label="Cerrar sesión" destructive onPress={()=>setLogout(true)}/>
  <ConfirmModal visible={logout} title="Cerrar sesión" message="Podés volver a ingresar cuando quieras." confirmLabel="Cerrar sesión" destructive onCancel={()=>setLogout(false)} onConfirm={auth.signOut}/>
  <AppButton label="Volver al inicio" variant="secondary" onPress={()=>router.replace('/vet' as never)}/>
 </PetCareScreen>;
}
