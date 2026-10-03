/** Una sola home para todos los profesionales, construida con módulos de MySQL/API. */
import { useCallback,useRef,useState } from 'react';
import { router,useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { FormNotice } from '../../components/ui/FormNotice';
import { useAuth } from '../../hooks/useAuth';
import { friendlyError } from '../../services/api';
type Home={modules:{code:string;name:string}[];clinicalAvailable:boolean};
export default function VetHome() {
  const auth=useAuth();const {request,refreshProfile}=auth;const [home,setHome]=useState<Home|null>(null);const [error,setError]=useState<string|null>(null);const sequence=useRef(0);
  const permissions=auth.user?.permissions;
  useFocusEffect(useCallback(()=>{void refreshProfile().catch(()=>undefined);},[refreshProfile]));
  const load=useCallback(()=>{
    const attempt=++sequence.current;setHome(null);setError(null);
    if (!permissions) return ()=>{sequence.current++;};
    // /me también cambia al reabrir la app: el nuevo array vuelve a consultar navegación,
    // sin que esta consulta dispare otro /me y forme un bucle de refresh.
    void request<Home>('/vet/home').then(value=>{if(attempt===sequence.current)setHome(value);}).catch(err=>{if(attempt===sequence.current)setError(friendlyError(err));});
    return ()=>{sequence.current++;};
  },[permissions,request]);
  useFocusEffect(load);
  return <ScreenContainer>
    <AppText variant="caption" muted>PETCARE · PANEL VETERINARIO</AppText>
    <AppText variant="title">Hola, {auth.user?.firstName}</AppText>
    <AppText muted>{auth.user?.veterinarian?.specialties.map(s=>s.name).join(' · ')||'Sin especialidades registradas'}</AppText>
    <FormNotice error message={error} />
    {!home&&!error&&<AppText muted>Consultando accesos…</AppText>}
    {home&&<>
      {home.modules.some(m=>m.code==='appointments')&&<><AppText variant="subtitle">Próximo turno</AppText><AppText muted>La agenda clínica estará disponible en una próxima etapa.</AppText></>}
      {home.modules.some(m=>m.code==='pets')&&<><AppText variant="subtitle">Pacientes del día</AppText><AppText muted>El registro clínico estará disponible en una próxima etapa.</AppText></>}
      <AppText variant="subtitle">Tus accesos</AppText>
      {home.modules.map(module=><AppButton key={module.code} label={module.name} onPress={()=>router.push({pathname:'/vet/[module]',params:{module:module.code}})} />)}
      {!home.modules.length&&<AppText muted>Tu cuenta no tiene módulos habilitados. Consultá al administrador.</AppText>}
    </>}
    <AppButton label="Actualizar permisos" variant="secondary" onPress={load} />
    <AppButton label="Mi cuenta" variant="secondary" onPress={()=>router.push('/account')} />
  </ScreenContainer>;
}
