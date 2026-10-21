/** Agenda compartida. Sus filtros y resultados provienen de /clinic/appointments. */
import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinic } from '../../hooks/useClinic';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, QueryState, statusLabel, ResponsiveGrid } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { CalendarDateField } from '../forms/CalendarDateField';
import { SelectionRow } from '../ui/SelectionRow';
import { FilterDisclosure } from '../ui/FilterDisclosure';
import { CompactPagination } from '../ui/CompactPagination';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { clinicDate,clinicDateFilterToApi, clinicDateTime,clinicToday } from '../../utils/clinic-date';

export function AgendaScreen() {
  const routeParams=useLocalSearchParams<{status?:string|string[]}>();
  const requestedStatus=Array.isArray(routeParams.status)?routeParams.status[0]??'':routeParams.status??'';
  const api = useClinic();
  const { user, hasPermission } = useAuth();
  const veterinarian = user?.role === 'VETERINARIAN';
  const base = user?.role === 'VETERINARIAN' ? '/vet' : user?.role === 'GROOMER' ? '/professional' : user?.role === 'SECRETARY' ? '/secretary' : '/admin';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [filters, setFilters] = useState<Record<string, string>>(()=>requestedStatus?{status:requestedStatus}:{} as Record<string,string>);
  const [page, setPage] = useState(1);
  const [period,setPeriod]=useState<'day'|'week'|'month'>('day');
  const [focusDate,setFocusDate]=useState(clinicToday);
  const focusUtc=new Date(`${focusDate}T12:00:00Z`);
  const weekStart=new Date(focusUtc);weekStart.setUTCDate(weekStart.getUTCDate()-((weekStart.getUTCDay()+6)%7));
  const rangeStart=period==='day'?focusUtc:period==='week'?weekStart:new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth(),1));
  const rangeEnd=period==='day'?focusUtc:period==='week'?new Date(weekStart.getTime()+6*86400000):new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()+1,0));
  const apiDate=(date:Date)=>date.toISOString().slice(0,10);
  const rangeStartText=apiDate(rangeStart),rangeEndText=apiDate(rangeEnd);
  const catalog = useClientQuery(api.catalog);
  const query = useClientQuery(useCallback(() => api.appointments({ ...filters, ...(veterinarian?{fromDate:rangeStartText,toDate:rangeEndText}:{fromDate:clinicDateFilterToApi(filters.fromDate ?? ''),toDate:clinicDateFilterToApi(filters.toDate ?? '')}), search: debouncedSearch, page: String(page) }), [api, filters, debouncedSearch, page,veterinarian,rangeStartText,rangeEndText]));
  const updateFilter = (key: string, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const activeCount = Object.values(filters).filter(Boolean).length;

  return <PetCareScreen wide>
    <PetCareHeader title="Agenda y turnos" subtitle={veterinarian?'Turnos asignados a tu agenda':'Horarios compartidos con la clínica'} back hideForAdmin/>
    {veterinarian&&<PetCareCard>
      <View style={{flexDirection:'row',gap:8}}>{([{id:'day',label:'Día'},{id:'week',label:'Semana'},{id:'month',label:'Mes'}] as const).map(item=><View key={item.id} style={{flex:1}}><SelectionRow radio label={item.label} checked={period===item.id} onPress={()=>{setPeriod(item.id);setPage(1);}}/></View>)}</View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <Pressable accessibilityRole="button" accessibilityLabel="Período anterior" onPress={()=>{const next=period==='month'?new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()-1,1)):new Date(focusUtc);if(period!=='month')next.setUTCDate(next.getUTCDate()-(period==='day'?1:7));setFocusDate(apiDate(next));setPage(1);}} style={{padding:10}}><Ionicons name="chevron-back" size={22}/></Pressable>
        <AppText variant="subtitle">{period==='day'?clinicDate(focusDate):`${clinicDate(apiDate(rangeStart))} – ${clinicDate(apiDate(rangeEnd))}`}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Período siguiente" onPress={()=>{const next=period==='month'?new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()+1,1)):new Date(focusUtc);if(period!=='month')next.setUTCDate(next.getUTCDate()+(period==='day'?1:7));setFocusDate(apiDate(next));setPage(1);}} style={{padding:10}}><Ionicons name="chevron-forward" size={22}/></Pressable>
      </View>
      <AppButton label="Ir a hoy" variant="secondary" onPress={()=>{setFocusDate(clinicToday());setPage(1);}}/>
    </PetCareCard>}
    <SearchFilterBar>
      <AppInput label="Buscar turnos" placeholder={veterinarian?(hasPermission('users.view_basic')?'Paciente, propietario o servicio':'Paciente o servicio'):'Paciente, profesional o servicio'} value={search} onChangeText={value => { setSearch(value); setPage(1); }} returnKeyType="search" onSubmitEditing={() => setPage(1)}/>
      <FilterDisclosure fullWidth activeCount={activeCount} onApply={() => setPage(1)} onClear={() => { setFilters({}); setPage(1); }}>
        <AppText variant="subtitle">Fecha del turno</AppText>
        {!veterinarian&&<><CalendarDateField label="Desde" value={clinicDateFilterToApi(filters.fromDate ?? '')} onChange={value => updateFilter('fromDate', value)}/>
        <CalendarDateField label="Hasta" value={clinicDateFilterToApi(filters.toDate ?? '')} onChange={value => updateFilter('toDate', value)}/></>}
        <AppText variant="subtitle">Estado</AppText>
        {['', 'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => <SelectionRow key={status || 'all-status'} label={status ? statusLabel(status) : 'Todos los estados'} checked={(filters.status ?? '') === status} onPress={() => updateFilter('status', status)}/>)}
        <QueryState {...catalog}/>
        {catalog.data && <>
          <AppText variant="subtitle">Servicio</AppText><SelectionRow label="Todos" checked={!filters.serviceId} onPress={() => updateFilter('serviceId', '')}/>
          {catalog.data.services.map(service => <SelectionRow key={service.id} label={String(service.name)} checked={filters.serviceId === service.id} onPress={() => updateFilter('serviceId', service.id)}/>)}
          {hasPermission('appointments.view_all') && <><AppText variant="subtitle">Profesional</AppText><SelectionRow label="Todos" checked={!filters.professionalId} onPress={() => updateFilter('professionalId', '')}/>{catalog.data.professionals.map(professional => <SelectionRow key={professional.id} label={String(professional.name)} checked={filters.professionalId === professional.id} onPress={() => updateFilter('professionalId', professional.id)}/>)}</>}
        </>}
      </FilterDisclosure>

    </SearchFilterBar>
    <QueryState {...catalog}/><QueryState {...query}/>
    {query.data && (query.data.length ? <ResponsiveGrid>{query.data.slice(0,200).map(appointment => <PetCareCard key={appointment.id}><View style={{flexDirection:'row',alignItems:'center',gap:14}}><View style={{flex:1,minWidth:0,gap:4}}><AppText variant="subtitle">{clinicDateTime(String(appointment.startsAt))}</AppText><AppText>{String(appointment.service)} · {String(appointment.petName)}</AppText><AppText muted numberOfLines={1}>{String(appointment.veterinarian)} · {statusLabel(String(appointment.status))}</AppText></View><Pressable accessibilityRole="button" accessibilityLabel={`Ver turno de ${String(appointment.petName)}`} onPress={() => router.push({ pathname: `${base}/appointment` as never, params: { id: appointment.id } })} style={{padding:10}}><Ionicons name="eye-outline" size={23}/></Pressable></View></PetCareCard>)}</ResponsiveGrid> : <PetCareEmptyState title="No hay turnos en esta consulta" icon="calendar-outline"/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={Boolean(query.data && query.data.length>200)} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)}/>
  </PetCareScreen>;
}
