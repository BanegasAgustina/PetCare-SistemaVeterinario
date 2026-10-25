/** Gestión de profesionales y asignaciones reales de la clínica. */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useAdmin } from '../../hooks/useAdmin';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, PetImage, QueryState, ResponsiveGrid } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { SelectionRow } from '../ui/SelectionRow';
import { FilterDisclosure } from '../ui/FilterDisclosure';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { ConfirmModal } from '../ui/ConfirmModal';
import { CompactPagination } from '../ui/CompactPagination';
import { useFeedback } from '../../contexts/FeedbackContext';
import { AppModal } from '../ui/AppModal';
import { AdminFormActions, AdminFormSection } from '../admin/AdminFormLayout';
import { FormNotice } from '../ui/FormNotice';

export function ProfessionalsScreen() {
  const { hasPermission, hasRole } = useAuth();
  const api = useClinic();
  const admin = useAdmin();
  const statusAction = useAsyncAction();
  const query = useClientQuery(api.professionals);
  const catalog = useClientQuery(api.catalog);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [active, setActive] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [newType, setNewType] = useState('');
  const [typeConfirm, setTypeConfirm] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const { showToast } = useFeedback();
  const load = useCallback((id: string) => { setSelected(id); setServices(catalog.data?.assignments.filter(item => item.professionalId === id).map(item => String(item.serviceId)) ?? []); }, [catalog.data]);
  const professionals = useMemo(() => [...(query.data ?? [])]
    .filter(person => String(person.name).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (!type || person.typeId === type) && (active === '' || Boolean(person.isActive) === (active === '1')))
    .sort((a, b) => sort === 'az' ? String(a.name).localeCompare(String(b.name), 'es') : sort === 'za' ? String(b.name).localeCompare(String(a.name), 'es') : sort === 'oldest' ? String(a.createdAt).localeCompare(String(b.createdAt)) : String(b.createdAt).localeCompare(String(a.createdAt))), [query.data, search, type, active, sort]);
  const activeCount = (type ? 1 : 0) + (active ? 1 : 0) + (sort !== 'recent' ? 1 : 0);
  const pageSize = 20;
  const visibleProfessionals = professionals.slice((page - 1) * pageSize, page * pageSize);
  const selectedProfessional = query.data?.find(person => person.id === selected);

  async function changeActiveStatus() {
    if (!selectedProfessional) return;
    const saved = await statusAction.run(async () => {
      const user = await admin.user(selectedProfessional.id);
      await admin.updateUser(selectedProfessional.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roleId: user.roleId,
        isActive: !selectedProfessional.isActive,
      });
    });
    setStatusConfirm(false);
    if (!saved) return;
    setSelected('');
    showToast(selectedProfessional.isActive ? 'Profesional desactivado' : 'Profesional reactivado', 'success');
    query.reload();
    catalog.reload();
  }

  return <PetCareScreen wide><PetCareHeader title="Profesionales" back hideForAdmin/>
    {hasPermission('users.manage') && <AppButton label="Crear profesional / secretario" onPress={() => router.push({pathname:'/admin/users',params:{create:'1'}})}/>}
    {hasPermission('veterinarians.manage') && <AppButton label="Veterinarios" variant="secondary" onPress={() => router.push('/admin/veterinarians')}/>}
    <SearchFilterBar>
      <AppInput icon="search-outline" label="Buscar profesionales" placeholder="Nombre" value={search} onChangeText={value => { setSearch(value); setPage(1); }}/>
      <FilterDisclosure fullWidth activeCount={activeCount} onApply={() => { setPage(1); void query.reload(); }} onClear={() => { setType(''); setActive(''); setSort('recent'); setPage(1); }}>
        <AppText variant="subtitle">Tipo</AppText><SelectionRow label="Todos los tipos" checked={!type} onPress={() => setType('')}/>{catalog.data?.types.map(item => <SelectionRow key={item.id} label={String(item.name)} checked={type === item.id} onPress={() => setType(item.id)}/>)}
        <AppText variant="subtitle">Estado</AppText>{[['', 'Todos los estados'], ['1', 'Activos'], ['0', 'Inactivos']].map(([value, label]) => <SelectionRow key={value || 'all'} label={label} checked={active === value} onPress={() => setActive(value)}/>)}
        <AppText variant="subtitle">Ordenar por</AppText>{[['recent', 'Más recientes'], ['oldest', 'Más antiguos'], ['az', 'Nombre A-Z'], ['za', 'Nombre Z-A']].map(([value, label]) => <SelectionRow radio key={value} label={label} checked={sort === value} onPress={() => setSort(value)}/>)}
      </FilterDisclosure>
    </SearchFilterBar>
    <QueryState {...catalog}/><QueryState {...query}/>
    {query.data && (professionals.length ? <ResponsiveGrid>{visibleProfessionals.map(person => <PetCareCard key={person.id}><View style={{flexDirection:'row',alignItems:'center',gap:14}}><PetImage uri={typeof person.profilePhotoUrl==='string'?person.profilePhotoUrl:null} size={56}/><View style={{flex:1,minWidth:0}}><AppText variant="subtitle" numberOfLines={1}>{String(person.name)}</AppText><AppText muted>{String(person.typeName)} · {person.isActive?'Activo':'Inactivo'}</AppText>{Boolean(person.specialties)&&<AppText muted numberOfLines={1}>{String(person.specialties)}</AppText>}</View><Pressable accessibilityRole="button" accessibilityLabel={`Ver ${String(person.name)}`} onPress={()=>load(person.id)} style={{padding:10}}><Ionicons name="eye-outline" size={22}/></Pressable></View></PetCareCard>)}</ResponsiveGrid> : <PetCareEmptyState title="No hay profesionales para estos filtros"/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={page * pageSize < professionals.length} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)} summary={`${professionals.length} profesionales`}/>
    <AppModal size="wide" visible={Boolean(selected)} dismissible onClose={() => { setSelected(''); setNewType(''); }}>
      {Boolean(selected) && catalog.data && selectedProfessional && <>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><AppText variant="title">Detalle del profesional</AppText>{hasPermission('users.manage')&&<Pressable accessibilityRole="button" accessibilityLabel="Editar profesional" onPress={()=>{const id=selected;setSelected('');router.push({pathname:'/admin/users/[id]',params:{id}});}} style={{padding:10}}><Ionicons name="create-outline" size={22}/></Pressable>}</View>
        <PetImage uri={typeof selectedProfessional.profilePhotoUrl === 'string' ? selectedProfessional.profilePhotoUrl : null} size={76}/>
        <AppText variant="subtitle">{String(selectedProfessional.name)}</AppText>
        <AppText>Tipo: {String(selectedProfessional.typeName)}</AppText>
        <AppText>Estado: {selectedProfessional.isActive ? 'Activo' : 'Inactivo'}</AppText>
        {Boolean(selectedProfessional.specialties) && <AppText>Especialidad: {String(selectedProfessional.specialties)}</AppText>}
        {selectedProfessional.emailVerified !== undefined && <AppText>Correo: {selectedProfessional.emailVerified ? 'Verificado' : 'Sin verificar'}</AppText>}
        {hasPermission('users.manage') && hasRole('SUPER_ADMIN') && <AppButton label={selectedProfessional.isActive ? 'Desactivar profesional' : 'Reactivar profesional'} destructive={Boolean(selectedProfessional.isActive)} variant={selectedProfessional.isActive ? 'secondary' : 'primary'} onPress={() => setStatusConfirm(true)} />}
        <FormNotice error message={statusAction.error} />
        <AdminFormSection title="Tipo profesional" description="Cambiarlo puede quitar servicios incompatibles. Primero reprogramá los turnos vigentes.">
          {catalog.data.types.filter(item => Boolean(item.isClinical) === Boolean(query.data?.find(person => person.id === selected)?.isClinical)).map(item => <SelectionRow key={item.id} radio label={String(item.name)} checked={newType === item.id} onPress={() => setNewType(item.id)}/>)}
          <AdminFormActions><AppButton label="Revisar cambio de tipo" variant="secondary" disabled={!newType} onPress={() => setTypeConfirm(true)}/></AdminFormActions>
        </AdminFormSection>
        <AdminFormSection title="Servicios asignados" description="Seleccioná qué servicios puede atender este profesional.">
          {catalog.data.services.filter(service => service.typeId === query.data?.find(person => person.id === selected)?.typeId).map(service => <SelectionRow key={service.id} label={String(service.name)} checked={services.includes(service.id)} onPress={() => setServices(current => current.includes(service.id) ? current.filter(id => id !== service.id) : [...current, service.id])}/>)}
          <AdminFormActions><AppButton label="Revisar asignación" onPress={() => setConfirm(true)}/><AppButton label="Cerrar" variant="secondary" onPress={() => setSelected('')}/></AdminFormActions>
        </AdminFormSection>
      </>}
    </AppModal>
    <ConfirmModal visible={confirm} title="Asignar servicios" message="Se verificará que los servicios sean compatibles con el tipo profesional y sus especialidades." confirmLabel="Guardar" onCancel={() => setConfirm(false)} onConfirm={async () => { await api.assignServices(selected, services); setConfirm(false); setSelected(''); showToast('Servicios asignados', 'success'); catalog.reload(); }}/>
    <ConfirmModal visible={typeConfirm} title="Cambiar tipo profesional" message="Se quitarán asignaciones incompatibles. Primero deben reprogramarse los turnos vigentes." confirmLabel="Cambiar" onCancel={() => setTypeConfirm(false)} onConfirm={async () => { await api.assignType(selected, newType); setTypeConfirm(false); setSelected(''); setNewType(''); query.reload(); catalog.reload(); showToast('Tipo profesional actualizado', 'success'); }}/>
    <ConfirmModal visible={statusConfirm} title={selectedProfessional?.isActive ? 'Desactivar profesional' : 'Reactivar profesional'} message={selectedProfessional?.isActive ? 'La cuenta dejará de acceder a PetCare. Se conservarán sus datos, turnos e historial.' : 'El profesional volverá a tener acceso a PetCare con sus datos e historial actuales.'} destructive={Boolean(selectedProfessional?.isActive)} confirmLabel={selectedProfessional?.isActive ? 'Desactivar' : 'Reactivar'} onCancel={() => setStatusConfirm(false)} onConfirm={async() => { await changeActiveStatus(); }} />
  </PetCareScreen>;
}
