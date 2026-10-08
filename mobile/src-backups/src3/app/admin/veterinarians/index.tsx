/** Listado paginado: búsqueda/filtros consultan MySQL mediante la API. */
import { useCallback,useRef,useState } from 'react';
import { router,useFocusEffect } from 'expo-router';
import { View,StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppInput } from '../../../components/forms/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { FormNotice } from '../../../components/ui/FormNotice';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import type { VetCatalog,VetPage } from '../../../types/veterinarian';
import { friendlyError } from '../../../services/api';
export default function VeterinariansScreen() {
  const auth=useAuth();const {request}=auth;const {colors}=useTheme();
  const [search,setSearch]=useState('');const [status,setStatus]=useState('all');const [order,setOrder]=useState('asc');
  const [specialty,setSpecialty]=useState('');const [catalog,setCatalog]=useState<VetCatalog|null>(null);
  const [page,setPage]=useState(1);const [result,setResult]=useState<VetPage|null>(null);const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);const sequence=useRef(0);
  const load=useCallback(()=>{
    const attempt=++sequence.current;setLoading(true);setError(null);setResult(null);
    const query=new URLSearchParams({search,status,order,page:String(page),...(specialty?{specialtyId:specialty}:{})});
    void Promise.all([request<VetPage>(`/admin/veterinarians?${query}`),request<VetCatalog>('/admin/veterinarians/catalog')])
      .then(([value,options])=>{if(attempt===sequence.current){setResult(value);setCatalog(options);}})
      .catch(err=>{if(attempt===sequence.current)setError(friendlyError(err));}).finally(()=>{if(attempt===sequence.current)setLoading(false);});
    return ()=>{sequence.current++;};
  },[request,search,status,order,page,specialty]);
  useFocusEffect(useCallback(()=>{const timer=setTimeout(load,300);return ()=>{clearTimeout(timer);sequence.current++;};},[load]));
  return <ScreenContainer>
    <AppButton label="Volver a Gestión" variant="secondary" onPress={()=>router.replace('/admin')} />
    <AppText variant="title">Veterinarios</AppText>
    <AppInput label="Buscar veterinario" placeholder="Nombre, apellido, matrícula o email" value={search} onChangeText={value=>{setSearch(value);setPage(1);}} />
    <View style={styles.row}>{[{code:'all',name:'Todos'},{code:'active',name:'Activos'},{code:'inactive',name:'Inactivos'}].map(item=><View key={item.code} style={styles.flex}><AppButton compact label={`${status===item.code?'✓ ':''}${item.name}`} variant="secondary" onPress={()=>{setStatus(item.code);setPage(1);}} /></View>)}</View>
    <AppButton label={`Orden: ${order==='asc'?'A–Z':'Z–A'}`} variant="secondary" onPress={()=>{setOrder(order==='asc'?'desc':'asc');setPage(1);}} />
    <AppText variant="subtitle">Especialidad</AppText>
    <SelectionRow label="Todas" checked={!specialty} onPress={()=>{setSpecialty('');setPage(1);}} />
    {catalog?.specialties.map(item=><SelectionRow key={item.id} label={item.name} checked={specialty===item.id} onPress={()=>{setSpecialty(item.id);setPage(1);}} />)}
    {auth.hasPermission('veterinarians.manage') && <AppButton label="+ Crear veterinario" onPress={()=>router.push('/admin/veterinarians/new')} />}
    <FormNotice error message={error} />
    {error && <AppButton label="Reintentar" onPress={load} />}
    {loading && <AppText muted>Consultando veterinarios…</AppText>}
    {result && <AppText muted>{result.total} profesionales · Página {result.page}</AppText>}
    {result?.items.map(vet=><View key={vet.id} style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
      <AppText variant="subtitle">{vet.firstName} {vet.lastName}</AppText>
      <AppText muted>{vet.specialties.map(item=>item.name).join(' · ')}</AppText>
      <AppText>{vet.isActive?'● Activa':'○ Inactiva'}</AppText><AppText variant="caption" muted>Matrícula {vet.licenseNumber}</AppText>
      <AppButton label="Ver / Editar" variant="secondary" onPress={()=>router.push({pathname:'/admin/veterinarians/[id]',params:{id:vet.id}})} />
    </View>)}
    {result && !result.items.length && <AppText muted>No hay veterinarios para estos filtros.</AppText>}
    <AppButton label="Página anterior" variant="secondary" disabled={loading||page===1} onPress={()=>setPage(page-1)} />
    <AppButton label="Página siguiente" variant="secondary" disabled={loading||!result?.hasMore} onPress={()=>setPage(page+1)} />
    {auth.hasPermission('specialties.manage') && <AppButton label="Gestionar especialidades" variant="secondary" onPress={()=>router.push('/admin/specialties')} />}
  </ScreenContainer>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',gap:6},flex:{flex:1},card:{padding:18,borderWidth:1,borderRadius:20,gap:12}});
