/** Agenda compartida. Sus filtros y resultados provienen de /clinic/appointments. */
import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, QueryState, statusLabel } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { SelectionRow } from '../ui/SelectionRow';
import { FilterDisclosure } from '../ui/FilterDisclosure';
import { CompactPagination } from '../ui/CompactPagination';
import { clinicDateTime } from '../../utils/clinic-date';

export function AgendaScreen() {
  const api = useClinic();
  const { user, hasPermission } = useAuth();
  const base = user?.role === 'VETERINARIAN' ? '/vet' : user?.role === 'GROOMER' ? '/professional' : user?.role === 'SECRETARY' ? '/secretary' : '/admin';
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const catalog = useClientQuery(api.catalog);
  const query = useClientQuery(useCallback(() => api.appointments({ ...filters, search: submittedSearch, page: String(page) }), [api, filters, submittedSearch, page]));
  const updateFilter = (key: string, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const activeCount = Object.values(filters).filter(Boolean).length;

  return <PetCareScreen>
    <PetCareHeader title="Agenda y turnos" subtitle="Horarios compartidos con la clínica" back/>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
      <View style={{ flex: 1, minWidth: 180 }}><AppInput label="Buscar turnos" placeholder="Paciente, profesional o servicio" value={search} onChangeText={setSearch}/></View>
      <FilterDisclosure activeCount={activeCount} onApply={() => setPage(1)} onClear={() => { setFilters({}); setPage(1); }}>
        <AppText variant="subtitle">Fecha del turno</AppText>
        <AppInput label="Desde (AAAA-MM-DD)" value={filters.fromDate ?? ''} onChangeText={value => updateFilter('fromDate', value)}/>
        <AppInput label="Hasta (AAAA-MM-DD)" value={filters.toDate ?? ''} onChangeText={value => updateFilter('toDate', value)}/>
        <AppText variant="subtitle">Estado</AppText>
        {['', 'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => <SelectionRow key={status || 'all-status'} label={status ? statusLabel(status) : 'Todos los estados'} checked={(filters.status ?? '') === status} onPress={() => updateFilter('status', status)}/>)}
        <QueryState {...catalog}/>
        {catalog.data && <>
          <AppText variant="subtitle">Servicio</AppText><SelectionRow label="Todos" checked={!filters.serviceId} onPress={() => updateFilter('serviceId', '')}/>
          {catalog.data.services.map(service => <SelectionRow key={service.id} label={String(service.name)} checked={filters.serviceId === service.id} onPress={() => updateFilter('serviceId', service.id)}/>)}
          {hasPermission('appointments.view_all') && <><AppText variant="subtitle">Profesional</AppText><SelectionRow label="Todos" checked={!filters.professionalId} onPress={() => updateFilter('professionalId', '')}/>{catalog.data.professionals.map(professional => <SelectionRow key={professional.id} label={String(professional.name)} checked={filters.professionalId === professional.id} onPress={() => updateFilter('professionalId', professional.id)}/>)}</>}
        </>}
      </FilterDisclosure>
      <AppButton compact label="Buscar" onPress={() => { setSubmittedSearch(search.trim()); setPage(1); }}/>
    </View>
    <QueryState {...catalog}/><QueryState {...query}/>
    {query.data && (query.data.length ? query.data.map(appointment => <PetCareCard key={appointment.id}>
      <AppText variant="subtitle">{String(appointment.petName)} · {String(appointment.service)}</AppText>
      <AppText>{clinicDateTime(String(appointment.startsAt))}</AppText>
      <AppText>{String(appointment.veterinarian)} · {statusLabel(String(appointment.status))}</AppText>
      <AppButton label="Ver turno" variant="secondary" onPress={() => router.push({ pathname: `${base}/appointment` as never, params: { id: appointment.id } })}/>
    </PetCareCard>) : <PetCareEmptyState title="No hay turnos en esta consulta" icon="calendar-outline"/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={Boolean(query.data?.length === 200)} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)}/>
  </PetCareScreen>;
}
