/** Acceso manual también consulta al backend; sin permiso devuelve 403. No implementa clínica futura. */
import { useCallback,useRef,useState } from 'react';
import { router,useFocusEffect,useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { FormNotice } from '../../components/ui/FormNotice';
import { useAuth } from '../../hooks/useAuth';
import { friendlyError } from '../../services/api';
export default function VetModule() {
  const {module}=useLocalSearchParams<{module:string}>();const {request}=useAuth();const sequence=useRef(0);
  const [result,setResult]=useState<{module:{name:string};message:string}|null>(null);const [error,setError]=useState<string|null>(null);
  useFocusEffect(useCallback(()=>{
    const attempt=++sequence.current;setResult(null);setError(null);
    void request<{module:{name:string};message:string}>(`/vet/modules/${encodeURIComponent(module)}`).then(value=>{if(attempt===sequence.current)setResult(value);}).catch(err=>{if(attempt===sequence.current)setError(friendlyError(err));});
    return ()=>{sequence.current++;};
  },[request,module]));
  return <ScreenContainer><AppButton label="Volver al panel" variant="secondary" onPress={()=>router.replace('/vet')} />
    <FormNotice error message={error} />{result&&<><AppText variant="title">{result.module.name}</AppText><AppText muted>{result.message}</AppText></>}
  </ScreenContainer>;
}
