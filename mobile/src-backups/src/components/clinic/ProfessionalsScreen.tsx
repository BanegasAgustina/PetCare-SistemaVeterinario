/** Gestión de profesionales y asignaciones reales de la clínica. */
import { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, PetImage, QueryState } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { SelectionRow } from '../ui/SelectionRow';
import { FilterDisclosure } from '../ui/FilterDisclosure';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { ConfirmModal } from '../ui/ConfirmModal';
import { CompactPagination } from '../ui/CompactPagination';
import { useFeedback } from '../../contexts/FeedbackContext';

export function ProfessionalsScreen() {
  const { hasPermission } = useAuth();
  const api = useClinic();
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
  const { showToast } = useFeedback();
  const load = useCallback((id: string) => { setSelected(id); setServices(catalog.data?.assignments.filter(item => item.professionalId === id).map(item => String(item.serviceId)) ?? []); }, [catalog.data]);
  const professionals = useMemo(() => [...(query.data ?? [])]
    .filter(person => String(person.name).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (!type || person.typeId === type) && (active === '' || Boolean(person.isActive) === (active === '1')))
    .sort((a, b) => sort === 'az' ? String(a.name).localeCompare(String(b.name), 'es') : sort === 'za' ? String(b.name).localeCompare(String(a.name), 'es') : sort === 'oldest' ? String(a.createdAt).localeCompare(String(b.createdAt)) : String(b.createdAt).localeCompare(String(a.createdAt))), [query.data, search, type, active, sort]);
  const activeCount = (type ? 1 : 0) + (active ? 1 : 0) + (sort !== 'recent' ? 1 : 0);
  const pageSize = 20;
  const visibleProfessionals = professionals.slice((page - 1) * pageSize, page * pageSize);

  return <PetCareScreen><PetCareHeader title="Profesionales" back/>
    {hasPermission('users.manage') && <AppButton label="Crear profesional / secretario" onPress={() => router.push({pathname:'/admin/users',params:{create:'1'}})}/>}
    {hasPermission('veterinarians.manage') && <AppButton label="Veterinarios" variant="secondary" onPress={() => router.push('/admin/veterinarians')}/>}
    <SearchFilterBar>
      <AppInput label="Buscar profesionales" placeholder="Nombre" value={search} onChangeText={value => { setSearch(value); setPage(1); }}/>
      <FilterDisclosure fullWidth activeCount={activeCount} onApply={() => { setPage(1); void query.reload(); }} onClear={() => { setType(''); setActive(''); setSort('recent'); setPage(1); }}>
        <AppText variant="subtitle">Tipo</AppText><SelectionRow label="Todos los tipos" checked={!type} onPress={() => setType('')}/>{catalog.data?.types.map(item => <SelectionRow key={item.id} label={String(item.name)} checked={type === item.id} onPress={() => setType(item.id)}/>)}
        <AppText variant="subtitle">Estado</AppText>{[['', 'Todos los estados'], ['1', 'Activos'], ['0', 'Inactivos']].map(([value, label]) => <SelectionRow key={value || 'all'} label={label} checked={active === value} onPress={() => setActive(value)}/>)}
        <AppText variant="subtitle">Ordenar por</AppText>{[['recent', 'Más recientes'], ['oldest', 'Más antiguos'], ['az', 'Nombre A-Z'], ['za', 'Nombre Z-A']].map(([value, label]) => <SelectionRow radio key={value} label={label} checked={sort === value} onPress={() => setSort(value)}/>)}
      </FilterDisclosure>
    </SearchFilterBar>
    <QueryState {...catalog}/><QueryState {...query}/>
    {query.data && (professionals.length ? visibleProfessionals.map(person => <PetCareCard key={person.id}>
      <PetImage uri={typeof person.profilePhotoUrl==='string'?person.profilePhotoUrl:null} size={56}/>
      <AppText variant="subtitle">{String(person.name)}</AppText><AppText>{String(person.typeName)} · {person.isActive ? 'Activo' : 'Inactivo'}</AppText>
      {hasPermission('users.manage') && <AppButton label="Editar cuenta e invitación" variant="secondary" onPress={() => router.push({ pathname: '/admin/users/[id]', params: { id: person.id } })}/>}
      <AppButton label="Asignar servicios" onPress={() => load(person.id)}/>
    </PetCareCard>) : <PetCareEmptyState title="No hay profesionales para estos filtros"/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={page * pageSize < professionals.length} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)} summary={`${professionals.length} profesionales`}/>
    {selected && catalog.data && <PetCareCard>
      <AppText variant="subtitle">Tipo del profesional seleccionado</AppText>
      {catalog.data.types.filter(item => Boolean(item.isClinical) === Boolean(query.data?.find(person => person.id === selected)?.isClinical)).map(item => <SelectionRow key={item.id} radio label={String(item.name)} checked={newType === item.id} onPress={() => setNewType(item.id)}/>)}
      <AppButton label="Cambiar tipo" disabled={!newType} onPress={() => setTypeConfirm(true)}/>
      <AppText variant="subtitle">Servicios asignados</AppText>
      {catalog.data.services.filter(service => service.typeId === query.data?.find(person => person.id === selected)?.typeId).map(service => <SelectionRow key={service.id} label={String(service.name)} checked={services.includes(service.id)} onPress={() => setServices(current => current.includes(service.id) ? current.filter(id => id !== service.id) : [...current, service.id])}/>)}
      <AppButton label="Guardar asignación" onPress={() => setConfirm(true)}/>
    </PetCareCard>}
    <ConfirmModal visible={confirm} title="Asignar servicios" message="El backend comprobará el tipo profesional y las especialidades requeridas." confirmLabel="Guardar" onCancel={() => setConfirm(false)} onConfirm={async () => { await api.assignServices(selected, services); setConfirm(false); setSelected(''); showToast('Servicios asignados', 'success'); catalog.reload(); }}/>
    <ConfirmModal visible={typeConfirm} title="Cambiar tipo profesional" message="Se quitarán asignaciones incompatibles. Primero deben reprogramarse los turnos vigentes." confirmLabel="Cambiar" onCancel={() => setTypeConfirm(false)} onConfirm={async () => { await api.assignType(selected, newType); setTypeConfirm(false); setSelected(''); setNewType(''); query.reload(); catalog.reload(); showToast('Tipo profesional actualizado', 'success'); }}/>
  </PetCareScreen>;
}
