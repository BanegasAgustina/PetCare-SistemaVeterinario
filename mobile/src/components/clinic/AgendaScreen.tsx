/** Agenda compartida. Sus filtros y resultados provienen de /clinic/appointments. */
import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinic } from '../../hooks/useClinic';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, QueryState, statusLabel, ResponsiveGrid } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppInput } from '../forms/AppInput';
import { CalendarDateField } from '../forms/CalendarDateField';
import { SelectionRow } from '../ui/SelectionRow';
import { FilterDisclosure } from '../ui/FilterDisclosure';
import { CompactPagination } from '../ui/CompactPagination';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { clinicDate,clinicDateFilterToApi, clinicDateTime,clinicToday } from '../../utils/clinic-date';
import { useTheme } from '../../hooks/useTheme';
import { softSurfaceShadow } from '../../constants/surface';

export function AgendaScreen() {
  const routeParams=useLocalSearchParams<{status?:string|string[]}>();
  const requestedStatus=Array.isArray(routeParams.status)?routeParams.status[0]??'':routeParams.status??'';
  const api = useClinic();
  const { colors } = useTheme();
  const { user, hasPermission } = useAuth();
  const veterinarian = user?.role === 'VETERINARIAN';
  const professional = veterinarian||user?.role==='GROOMER';
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
  const monthLength=new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()+1,0)).getUTCDate();
  const monthOffset=(new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth(),1)).getUTCDay()+6)%7;
  const monthDays=[...Array(monthOffset).fill(''),...Array.from({length:monthLength},(_,index)=>apiDate(new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth(),index+1))))];
  const catalog = useClientQuery(api.catalog);
  const query = useClientQuery(useCallback(() => {const date=new Date(`${focusDate}T12:00:00Z`);const start=period==='month'?new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1)):period==='week'?new Date(date.getTime()-((date.getUTCDay()+6)%7)*86400000):date;const end=period==='month'?new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)):period==='week'?new Date(start.getTime()+6*86400000):date;return api.appointments({ ...filters, ...(professional?{fromDate:apiDate(start),toDate:apiDate(end)}:{fromDate:clinicDateFilterToApi(filters.fromDate ?? ''),toDate:clinicDateFilterToApi(filters.toDate ?? '')}), search: debouncedSearch, page: String(page) });}, [api, filters, debouncedSearch, page,professional,focusDate,period]));
  const visibleAppointments=period==='month'&&professional?(query.data??[]).filter(appointment=>clinicDate(String(appointment.startsAt))===focusDate):query.data??[];
  const updateFilter = (key: string, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const activeCount = Object.values(filters).filter(Boolean).length;

  return <PetCareScreen wide>
    <PetCareHeader title={user?.role==='GROOMER'?'Mi agenda':'Agenda y turnos'} subtitle={professional?'Turnos asignados a tu agenda':'Horarios compartidos con la clínica'} back hideForAdmin/>
    {professional&&<PetCareCard>
      <View style={styles.agendaIntro}>
        <View style={[styles.agendaIcon,{backgroundColor:colors.accent}]}><Ionicons name="calendar" size={21} color={colors.primary}/></View>
        <View style={{flex:1,minWidth:0}}><AppText variant="subtitle">Calendario</AppText><AppText variant="caption" muted>Elegí un período</AppText></View>
        <Ionicons name="sparkles-outline" size={21} color={colors.primary}/>
      </View>
      <View accessibilityRole="radiogroup" style={[styles.periodPicker,{backgroundColor:colors.background,borderColor:colors.border}]}>
        {([{id:'day',label:'Día',icon:'sunny-outline'},{id:'week',label:'Semana',icon:'calendar-outline'},{id:'month',label:'Mes',icon:'calendar-number-outline'}] as const).map(item=>{
          const selected=period===item.id;
          return <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{checked:selected}} onPress={()=>{setPeriod(item.id);setPage(1);}} style={[styles.periodOption,selected&&{backgroundColor:colors.surface,borderColor:colors.primary},selected&&softSurfaceShadow(colors.primary)]}>
            <Ionicons name={item.icon} size={17} color={selected?colors.primary:colors.muted}/><AppText numberOfLines={1} style={[styles.periodLabel,{color:selected?colors.text:colors.muted}]}>{item.label}</AppText>
          </Pressable>;
        })}
      </View>
      <View style={[styles.dateNavigator,{backgroundColor:colors.accent}]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Período anterior" onPress={()=>{const next=period==='month'?new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()-1,1)):new Date(focusUtc);if(period!=='month')next.setUTCDate(next.getUTCDate()-(period==='day'?1:7));setFocusDate(apiDate(next));setPage(1);}} style={[styles.dateArrow,{backgroundColor:colors.surface}]}><Ionicons name="chevron-back" size={20} color={colors.primary}/></Pressable>
        <View style={styles.dateText}><AppText variant="subtitle" numberOfLines={1} style={styles.dateTitle}>{period==='day'?clinicDate(focusDate):`${clinicDate(apiDate(rangeStart))} – ${clinicDate(apiDate(rangeEnd))}`}</AppText><AppText variant="caption" muted>{period==='day'?'Vista diaria':period==='week'?'Vista semanal':'Vista mensual'}</AppText></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Período siguiente" onPress={()=>{const next=period==='month'?new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()+1,1)):new Date(focusUtc);if(period!=='month')next.setUTCDate(next.getUTCDate()+(period==='day'?1:7));setFocusDate(apiDate(next));setPage(1);}} style={[styles.dateArrow,{backgroundColor:colors.surface}]}><Ionicons name="chevron-forward" size={20} color={colors.primary}/></Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={()=>{setFocusDate(clinicToday());setPage(1);}} style={[styles.todayButton,{borderColor:colors.primary}]}><Ionicons name="locate-outline" size={17} color={colors.primary}/><AppText style={{color:colors.primary,fontWeight:'600'}}>Ir a hoy</AppText></Pressable>
      {professional&&period==='month'&&<View style={styles.monthCalendar}>
        {['L','M','M','J','V','S','D'].map((day,index)=><AppText key={`${day}-${index}`} variant="caption" muted style={styles.calendarWeekday}>{day}</AppText>)}
        {monthDays.map((day,index)=>{if(!day)return <View key={`blank-${index}`} style={styles.calendarDay}/>;const selected=day===focusDate,today=day===clinicToday(),hasAppointments=(query.data??[]).some(item=>clinicDate(String(item.startsAt))===day);return <Pressable key={day} accessibilityRole="button" accessibilityLabel={`${day}${hasAppointments?', tiene turnos':''}`} accessibilityState={{selected}} onPress={()=>{setFocusDate(day);setPage(1);}} style={[styles.calendarDay,selected&&{backgroundColor:colors.accent,borderColor:colors.primary},today&&!selected&&{borderColor:colors.primary}]}><AppText variant="caption" style={{color:selected?colors.primary:colors.text,fontWeight:selected||today?'700':'500'}}>{String(Number(day.slice(-2)))}</AppText>{hasAppointments&&<View style={[styles.calendarDot,{backgroundColor:selected?colors.primary:colors.highlight}]}/>}</Pressable>;})}
      </View>}
    </PetCareCard>}
    <SearchFilterBar>
      <AppInput label="Buscar turnos" placeholder={user?.role==='GROOMER'?'Mascota o servicio':veterinarian?(hasPermission('users.view_basic')?'Paciente, propietario o servicio':'Paciente o servicio'):'Paciente, profesional o servicio'} value={search} onChangeText={value => { setSearch(value); setPage(1); }} returnKeyType="search" onSubmitEditing={() => setPage(1)}/>
      <FilterDisclosure fullWidth activeCount={activeCount} onApply={() => setPage(1)} onClear={() => { setFilters({}); setPage(1); }}>
        <AppText variant="subtitle">Fecha del turno</AppText>
        {!professional&&<><CalendarDateField label="Desde" value={clinicDateFilterToApi(filters.fromDate ?? '')} onChange={value => updateFilter('fromDate', value)}/>
        <CalendarDateField label="Hasta" value={clinicDateFilterToApi(filters.toDate ?? '')} onChange={value => updateFilter('toDate', value)}/></>}
        <AppText variant="subtitle">Estado</AppText>
        {['', 'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => <SelectionRow key={status || 'all-status'} label={status ? statusLabel(status) : 'Todos los estados'} checked={(filters.status ?? '') === status} onPress={() => updateFilter('status', status)}/>)}
        <QueryState {...catalog}/>
        {catalog.data && <>
          <AppText variant="subtitle">Servicio</AppText><SelectionRow label="Todos" checked={!filters.serviceId} onPress={() => updateFilter('serviceId', '')}/>
          {catalog.data.services.filter(service=>!professional||catalog.data?.assignments.some(link=>String(link.professionalId)===user?.id&&String(link.serviceId)===String(service.id))).map(service => <SelectionRow key={service.id} label={String(service.name)} checked={filters.serviceId === service.id} onPress={() => updateFilter('serviceId', service.id)}/>)}
          {hasPermission('appointments.view_all') && <><AppText variant="subtitle">Profesional</AppText><SelectionRow label="Todos" checked={!filters.professionalId} onPress={() => updateFilter('professionalId', '')}/>{catalog.data.professionals.map(professional => <SelectionRow key={professional.id} label={String(professional.name)} checked={filters.professionalId === professional.id} onPress={() => updateFilter('professionalId', professional.id)}/>)}</>}
        </>}
      </FilterDisclosure>

    </SearchFilterBar>
    <QueryState {...catalog}/><QueryState {...query}/>
    {query.data && (visibleAppointments.length ? <ResponsiveGrid>{visibleAppointments.slice(0,200).map(appointment => <PetCareCard key={appointment.id}><View style={{flexDirection:'row',alignItems:'center',gap:14}}><View style={{flex:1,minWidth:0,gap:4}}><AppText variant="subtitle">{clinicDateTime(String(appointment.startsAt))}</AppText><AppText>{String(appointment.service)} · {String(appointment.petName)}</AppText><AppText muted numberOfLines={1}>{String(appointment.veterinarian)} · {statusLabel(String(appointment.status))}</AppText></View><Pressable accessibilityRole="button" accessibilityLabel={`Ver turno de ${String(appointment.petName)}`} onPress={() => router.push({ pathname: `${base}/appointment` as never, params: { id: appointment.id } })} style={{padding:10}}><Ionicons name="eye-outline" size={23}/></Pressable></View></PetCareCard>)}</ResponsiveGrid> : <PetCareEmptyState title={period==='month'&&professional?'No hay turnos para este día':'No hay turnos en esta consulta'} message="Probá con otra fecha o cambiá los filtros para encontrar turnos." icon="calendar-outline"/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={Boolean(query.data && query.data.length>200)} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)}/>
  </PetCareScreen>;
}

const styles=StyleSheet.create({
  agendaIntro:{flexDirection:'row',alignItems:'center',gap:11},
  agendaIcon:{width:42,height:42,borderRadius:15,alignItems:'center',justifyContent:'center'},
  periodPicker:{flexDirection:'row',gap:4,padding:5,borderRadius:18,borderWidth:1},
  periodOption:{flex:1,minWidth:0,minHeight:44,paddingHorizontal:4,borderRadius:14,borderWidth:1,borderColor:'transparent',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},
  periodLabel:{fontSize:14,fontWeight:'600',flexShrink:0},
  dateNavigator:{minHeight:72,padding:10,borderRadius:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:7},
  dateArrow:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center'},
  dateText:{flex:1,minWidth:0,alignItems:'center'},
  dateTitle:{fontSize:18,textAlign:'center'},
  todayButton:{minHeight:46,borderRadius:15,borderWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  monthCalendar:{flexDirection:'row',flexWrap:'wrap'},calendarWeekday:{width:'14.2857%',height:28,textAlign:'center',textAlignVertical:'center',fontWeight:'700'},calendarDay:{width:'14.2857%',height:38,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'transparent',borderRadius:12,gap:2},calendarDot:{width:5,height:5,borderRadius:3},
});
