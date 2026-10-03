import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useClient } from '../../../hooks/useClient';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { validateIdentityForm } from '../../../utils/auth-validation';
import { PetCareScreen,PetCareHeader,PetCareCard } from '../../../components/client/PetCareUI';
import { AppInput } from '../../../components/forms/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { FormNotice } from '../../../components/ui/FormNotice';
export default function EditProfile(){const auth=useAuth();const api=useClient();const action=useAsyncAction();const {showToast}=useFeedback();const [values,setValues]=useState({firstName:auth.user?.firstName??'',lastName:auth.user?.lastName??'',phone:auth.user?.phone??''});const [errors,setErrors]=useState<Partial<Record<keyof typeof values,string>>>({});return <PetCareScreen><PetCareHeader title="Mis datos" back/><PetCareCard><AppInput label="Nombre" value={values.firstName} error={errors.firstName} maxLength={100} editable={!action.loading} onChangeText={firstName=>setValues(v=>({...v,firstName}))}/><AppInput label="Apellido" value={values.lastName} error={errors.lastName} maxLength={100} editable={!action.loading} onChangeText={lastName=>setValues(v=>({...v,lastName}))}/><AppInput label="Teléfono (opcional)" value={values.phone} error={errors.phone} keyboardType="phone-pad" maxLength={40} editable={!action.loading} onChangeText={phone=>setValues(v=>({...v,phone}))}/><AppText muted>Correo verificado: {auth.user?.email}</AppText></PetCareCard><FormNotice error message={action.error}/><AppButton label="Guardar mis datos" loading={action.loading} onPress={()=>{const validation=validateIdentityForm({...values,email:auth.user?.email??''});setErrors(validation);if(Object.values(validation).some(Boolean))return;void action.run(async()=>{await api.updateProfile(values);await auth.refreshProfile();showToast('Datos actualizados','success');});}}/></PetCareScreen>;}
