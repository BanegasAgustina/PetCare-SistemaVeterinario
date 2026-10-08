/**
 * Pantalla de cambio de contraseña para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useClient } from '../../../hooks/useClient';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { PetCareScreen,PetCareHeader,PetCareCard } from '../../../components/client/PetCareUI';
import { AppInput } from '../../../components/forms/AppInput';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { FormNotice } from '../../../components/ui/FormNotice';
export default function Security(){const auth=useAuth();const api=useClient();const action=useAsyncAction();const {showToast}=useFeedback();const [current,setCurrent]=useState('');const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');const [error,setError]=useState<string|null>(null);return <PetCareScreen><PetCareHeader title="Seguridad" back/><PetCareCard><AppText muted>Cambiar tu contraseña cierra todas tus sesiones. Después tendrás que ingresar nuevamente.</AppText><AppInput label="Contraseña actual" password value={current} editable={!action.loading} onChangeText={setCurrent}/><AppInput label="Nueva contraseña" password value={password} editable={!action.loading} onChangeText={setPassword}/><AppText variant="caption" muted>Al menos 8 caracteres, mayúscula, minúscula, número y símbolo.</AppText><AppInput label="Repetir nueva contraseña" password value={confirm} error={error??undefined} editable={!action.loading} onChangeText={setConfirm}/></PetCareCard><FormNotice error message={action.error}/><AppButton label="Cambiar contraseña" loading={action.loading} onPress={()=>{if(!current||!password||password!==confirm){setError('Completá las contraseñas y verificá que coincidan.');return;}setError(null);void action.run(async()=>{await api.changePassword(current,password);await auth.signOut();showToast('Contraseña actualizada. Iniciá sesión nuevamente.','success');});}}/></PetCareScreen>;}
