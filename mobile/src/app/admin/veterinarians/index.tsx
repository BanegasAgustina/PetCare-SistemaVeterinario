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
import { FilterDisclosure } from '../../../components/ui/FilterDisclosure';
import { CompactPagination } from '../../../components/ui/CompactPagination';
export default function VeterinariansScreen() {
  const auth=useAuth();const {request}=auth;const {colors}=useTheme();
  const [search,setSearch]=useState('');const [submittedSearch,setSubmittedSearch]=useState('');const [status,setStatus]=useState('all');const [sort,setSort]=useState('recent');
  const [specialty,setSpecialty]=useState('');const [catalog,setCatalog]=useState<VetCatalog|null>(null);
  const [page,setPage]=useState(1);const [result,setResult]=useState<VetPage|null>(null);const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);const sequence=useRef(0);
  const load=useCallback(()=>{
    const attempt=++sequence.current;setLoading(true);setError(null);setResult(null);
    const query=new URLSearchParams({search:submittedSearch,status,sort,page:String(page),...(specialty?{specialtyId:specialty}:{})});
    void Promise.all([request<VetPage>(`/admin/veterinarians?${query}`),request<VetCatalog>('/admin/veterinarians/catalog')])
      .then(([value,options])=>{if(attempt===sequence.current){setResult(value);setCatalog(options);}})
      .catch(err=>{if(attempt===sequence.current)setError(friendlyError(err));}).finally(()=>{if(attempt===sequence.current)setLoading(false);});
    return ()=>{sequence.current++;};
  },[request,submittedSearch,status,sort,page,specialty]);
  useFocusEffect(useCallback(()=>{const timer=setTimeout(load,300);return ()=>{clearTimeout(timer);sequence.current++;};},[load]));
  return <ScreenContainer>
    <AppButton label="Volver a Gestión" variant="secondary" onPress={()=>router.replace('/admin')} />
    <AppText variant="title">Veterinarios</AppText>
    <View style={styles.searchRow}><View style={styles.flex}><AppInput label="Buscar veterinario" placeholder="Nombre, apellido, matrícula o email" value={search} onChangeText={setSearch}/></View><FilterDisclosure activeCount={(status!=='all'?1:0)+(sort!=='recent'?1:0)+(specialty?1:0)} onApply={()=>{setPage(1);}} onClear={()=>{setStatus('all');setSort('recent');setSpecialty('');setPage(1);}}>
      <AppText variant="subtitle">Estado</AppText>{[{code:'all',name:'Todos'},{code:'active',name:'Activos'},{code:'inactive',name:'Inactivos'}].map(item=><SelectionRow key={item.code} label={item.name} checked={status===item.code} onPress={()=>{setStatus(item.code);setPage(1);}}/>)}
      <AppText variant="subtitle">Ordenar por</AppText>{[{code:'recent',name:'Más recientes'},{code:'oldest',name:'Más antiguos'},{code:'az',name:'Nombre A-Z'},{code:'za',name:'Nombre Z-A'}].map(item=><SelectionRow radio key={item.code} label={item.name} checked={sort===item.code} onPress={()=>{setSort(item.code);setPage(1);}}/>)}
      <AppText variant="subtitle">Especialidad</AppText><SelectionRow label="Todas" checked={!specialty} onPress={()=>{setSpecialty('');setPage(1);}}/>{catalog?.specialties.map(item=><SelectionRow key={item.id} label={item.name} checked={specialty===item.id} onPress={()=>{setSpecialty(item.id);setPage(1);}}/>)}
    </FilterDisclosure><AppButton compact label="Buscar" onPress={()=>{setSubmittedSearch(search.trim());setPage(1);}}/></View>
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
    <CompactPagination page={page} canPrevious={!loading&&page>1} canNext={!loading&&Boolean(result?.hasMore)} onPrevious={()=>setPage(value=>value-1)} onNext={()=>setPage(value=>value+1)} summary={result?`${result.total} veterinarios`:undefined}/>
  </ScreenContainer>;
}
const styles=StyleSheet.create({searchRow:{flexDirection:'row',alignItems:'flex-end',gap:8,flexWrap:'wrap'},flex:{flex:1,minWidth:180},card:{padding:16,borderWidth:1,borderRadius:8,gap:12}});
