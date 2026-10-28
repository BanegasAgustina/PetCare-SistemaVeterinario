// Este archivo se encarga de lo siguiente: Componente reutilizable del área clínica; permite al personal gestionar agenda, pacientes y atención.

/** Agenda compartida. Sus filtros y resultados provienen de /clinic/appointments. */
import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
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
import { appointmentDisplayValue,appointmentRouteId } from '../../utils/appointment-display';
import { agendaScreenConfig } from '../../utils/agenda-screen-config';
import { AdminDataTable } from '../admin/AdminDataTable';
import { AdminStatusBadge } from '../admin/AdminStatusBadge';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

// Función AgendaScreen: concentra la lógica dentro de este módulo.
export function AgendaScreen() {
  const routeParams=useLocalSearchParams<{status?:string|string[]}>();
  const requestedStatus=Array.isArray(routeParams.status)?routeParams.status[0]??'':routeParams.status??'';
  const api = useClinic();
  const { width } = useWindowDimensions();
  const desktop = isWebAtLeast(Platform.OS, width, responsiveLayout.breakpoints.desktop);
  const { colors } = useTheme();
  const { user, hasPermission } = useAuth();
  const agendaConfig = agendaScreenConfig(user?.role ?? '', hasPermission);
  const { personalAgenda, canSearchOwner, basePath:base } = agendaConfig;
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [filters, setFilters] = useState<Record<string, string>>(()=>requestedStatus?{status:requestedStatus}:{} as Record<string,string>);
  const [hoveredStatus,setHoveredStatus]=useState<string|null>(null);
  const [page, setPage] = useState(1);
  const [period,setPeriod]=useState<'day'|'week'|'month'>('day');
  const [focusDate,setFocusDate]=useState(clinicToday);
  const focusUtc=new Date(`${focusDate}T12:00:00Z`);
  const weekStart=new Date(focusUtc);weekStart.setUTCDate(weekStart.getUTCDate()-((weekStart.getUTCDay()+6)%7));
  const rangeStart=period==='day'?focusUtc:period==='week'?weekStart:new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth(),1));
  const rangeEnd=period==='day'?focusUtc:period==='week'?new Date(weekStart.getTime()+6*86400000):new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()+1,0));
  // Función apiDate: agrupa una operación que este módulo puede ejecutar o reutilizar.
const apiDate=(date:Date)=>date.toISOString().slice(0,10);
  const monthLength=new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()+1,0)).getUTCDate();
  const monthOffset=(new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth(),1)).getUTCDay()+6)%7;
  const monthDays=[...Array(monthOffset).fill(''),...Array.from({length:monthLength},(_,index)=>apiDate(new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth(),index+1))))];
  const catalog = useClientQuery(api.catalog);
  const query = useClientQuery(useCallback(() => {const date=new Date(`${focusDate}T12:00:00Z`);const start=period==='month'?new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1)):period==='week'?new Date(date.getTime()-((date.getUTCDay()+6)%7)*86400000):date;const end=period==='month'?new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)):period==='week'?new Date(start.getTime()+6*86400000):date;return api.appointments({ ...filters, ...(personalAgenda?{fromDate:apiDate(start),toDate:apiDate(end)}:{fromDate:clinicDateFilterToApi(filters.fromDate ?? ''),toDate:clinicDateFilterToApi(filters.toDate ?? '')}), search: debouncedSearch, page: String(page) });}, [api, filters, debouncedSearch, page,personalAgenda,focusDate,period]));
  const visibleAppointments=period==='month'&&personalAgenda?(query.data??[]).filter(appointment=>clinicDate(String(appointment.startsAt))===focusDate):query.data??[];
  // Función updateFilter: agrupa una operación que este módulo puede ejecutar o reutilizar.
const updateFilter = (key: string, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const activeCount = Object.values(filters).filter(Boolean).length;
  const statusFilters = ['', 'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  return <PetCareScreen wide>
    <PetCareHeader title={agendaConfig.title} subtitle={personalAgenda?'Turnos asignados a tu agenda':'Horarios compartidos con la clínica'} back/>
    {personalAgenda&&<PetCareCard style={desktop&&styles.calendarCard}>
      <View style={[styles.agendaIntro,desktop&&styles.agendaIntroDesktop]}>
        <View style={[styles.agendaIcon,{backgroundColor:colors.accent}]}><Ionicons name="calendar" size={21} color={colors.primary}/></View>
        <View style={{flex:1,minWidth:0}}><AppText variant="subtitle">Calendario</AppText><AppText variant="caption" muted>Elegí un período</AppText></View>
        <Ionicons name="sparkles-outline" size={21} color={colors.primary}/>
      </View>
      <View style={desktop&&styles.desktopCalendarControls}>
      <View accessibilityRole="radiogroup" style={[styles.periodPicker,desktop&&styles.periodPickerDesktop,{backgroundColor:colors.background,borderColor:colors.border}]}>
        {([{id:'day',label:'Día',icon:'sunny-outline'},{id:'week',label:'Semana',icon:'calendar-outline'},{id:'month',label:'Mes',icon:'calendar-number-outline'}] as const).map(item=>{
          const selected=period===item.id;
          return <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{checked:selected}} onPress={()=>{setPeriod(item.id);setPage(1);}} style={[styles.periodOption,desktop&&styles.periodOptionDesktop,selected&&{backgroundColor:colors.surface,borderColor:colors.primary},selected&&softSurfaceShadow(colors.primary)]}>
            <Ionicons name={item.icon} size={17} color={selected?colors.primary:colors.muted}/><AppText numberOfLines={1} style={[styles.periodLabel,{color:selected?colors.text:colors.muted}]}>{item.label}</AppText>
          </Pressable>;
        })}
      </View>
      <View style={[styles.dateNavigator,desktop&&styles.dateNavigatorDesktop,{backgroundColor:colors.accent}]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Período anterior" onPress={()=>{const next=period==='month'?new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()-1,1)):new Date(focusUtc);if(period!=='month')next.setUTCDate(next.getUTCDate()-(period==='day'?1:7));setFocusDate(apiDate(next));setPage(1);}} style={[styles.dateArrow,{backgroundColor:colors.surface}]}><Ionicons name="chevron-back" size={20} color={colors.primary}/></Pressable>
        <View style={styles.dateText}><AppText variant="subtitle" numberOfLines={1} style={styles.dateTitle}>{period==='day'?clinicDate(focusDate):`${clinicDate(apiDate(rangeStart))} – ${clinicDate(apiDate(rangeEnd))}`}</AppText>{!desktop&&<AppText variant="caption" muted>{period==='day'?'Vista diaria':period==='week'?'Vista semanal':'Vista mensual'}</AppText>}</View>
        <Pressable accessibilityRole="button" accessibilityLabel="Período siguiente" onPress={()=>{const next=period==='month'?new Date(Date.UTC(focusUtc.getUTCFullYear(),focusUtc.getUTCMonth()+1,1)):new Date(focusUtc);if(period!=='month')next.setUTCDate(next.getUTCDate()+(period==='day'?1:7));setFocusDate(apiDate(next));setPage(1);}} style={[styles.dateArrow,{backgroundColor:colors.surface}]}><Ionicons name="chevron-forward" size={20} color={colors.primary}/></Pressable>
      </View>
      {!desktop&&<Pressable accessibilityRole="button" onPress={()=>{setFocusDate(clinicToday());setPage(1);}} style={[styles.todayButton,{borderColor:colors.primary}]}><Ionicons name="locate-outline" size={17} color={colors.primary}/><AppText style={{color:colors.primary,fontWeight:'600'}}>Ir a hoy</AppText></Pressable>}
      {desktop&&<Pressable accessibilityRole="button" onPress={()=>{setFocusDate(clinicToday());setPage(1);}} style={[styles.todayButton,styles.todayButtonDesktop,{borderColor:colors.primary}]}><Ionicons name="locate-outline" size={16} color={colors.primary}/><AppText style={{color:colors.primary,fontWeight:'600'}}>Hoy</AppText></Pressable>}
      </View>
      {personalAgenda&&period==='month'&&<View style={[styles.monthCalendar,desktop&&styles.monthCalendarDesktop]}>
        {['L','M','M','J','V','S','D'].map((day,index)=><AppText key={`${day}-${index}`} variant="caption" muted style={[styles.calendarWeekday,desktop&&styles.calendarWeekdayDesktop]}>{day}</AppText>)}
        {monthDays.map((day,index)=>{if(!day)return <View key={`blank-${index}`} style={[styles.calendarDay,desktop&&styles.calendarDayDesktop]}/>;const selected=day===focusDate,today=day===clinicToday(),hasAppointments=(query.data??[]).some(item=>clinicDate(String(item.startsAt))===day);return <Pressable key={day} accessibilityRole="button" accessibilityLabel={`${day}${hasAppointments?', tiene turnos':''}`} accessibilityState={{selected}} onPress={()=>{setFocusDate(day);setPage(1);}} style={[styles.calendarDay,desktop&&styles.calendarDayDesktop,selected&&{backgroundColor:colors.accent,borderColor:colors.primary},today&&!selected&&{borderColor:colors.primary}]}><AppText variant="caption" style={{color:selected?colors.primary:colors.text,fontWeight:selected||today?'700':'500'}}>{String(Number(day.slice(-2)))}</AppText>{hasAppointments&&<View style={[styles.calendarDot,{backgroundColor:selected?colors.primary:colors.highlight}]}/>}</Pressable>;})}
      </View>}
    </PetCareCard>}
    <SearchFilterBar>
      <AppInput compact={desktop} label="Buscar turnos" placeholder={user?.role==='GROOMER'?'Mascota o servicio':personalAgenda&&!canSearchOwner?'Paciente o servicio':canSearchOwner?'Paciente, propietario o servicio':'Paciente, profesional o servicio'} value={search} onChangeText={value => { setSearch(value); setPage(1); }} returnKeyType="search" onSubmitEditing={() => setPage(1)}/>
      <FilterDisclosure compact={desktop} fullWidth={!desktop} activeCount={activeCount} onApply={() => setPage(1)} onClear={() => { setFilters({}); setPage(1); }}>
        <AppText variant="subtitle">Fecha del turno</AppText>
        {!personalAgenda&&<><CalendarDateField label="Desde" value={clinicDateFilterToApi(filters.fromDate ?? '')} onChange={value => updateFilter('fromDate', value)}/>
        <CalendarDateField label="Hasta" value={clinicDateFilterToApi(filters.toDate ?? '')} onChange={value => updateFilter('toDate', value)}/></>}
        <AppText variant="subtitle">Estado</AppText>
        {!desktop&&statusFilters.map(status => <SelectionRow key={status || 'all-status'} label={status ? statusLabel(status) : 'Todos los estados'} checked={(filters.status ?? '') === status} onPress={() => updateFilter('status', status)}/>)}

<QueryState compact={desktop} {...catalog}/>
        {catalog.data && <>
          <AppText variant="subtitle">Servicio</AppText><SelectionRow label="Todos" checked={!filters.serviceId} onPress={() => updateFilter('serviceId', '')}/>
          {catalog.data.services.filter(service=>!personalAgenda||catalog.data?.assignments.some(link=>String(link.professionalId)===user?.id&&String(link.serviceId)===String(service.id))).map(service => <SelectionRow key={service.id} label={String(service.name)} checked={filters.serviceId === service.id} onPress={() => updateFilter('serviceId', service.id)}/>)}
          {hasPermission('appointments.view_all') && <><AppText variant="subtitle">Profesional</AppText><SelectionRow label="Todos" checked={!filters.professionalId} onPress={() => updateFilter('professionalId', '')}/>{catalog.data.professionals.map(professional => <SelectionRow key={professional.id} label={String(professional.name)} checked={filters.professionalId === professional.id} onPress={() => updateFilter('professionalId', professional.id)}/>)}</>}
        </>}
      </FilterDisclosure>

    </SearchFilterBar>
    {desktop&&<View accessibilityRole="toolbar" style={styles.quickFilters}>
      {statusFilters.map(status=>{const selected=(filters.status??'')===status,hovered=hoveredStatus===status;return <Pressable key={status||'all-status'} accessibilityRole="button" accessibilityLabel={`Filtrar por ${status?statusLabel(status):'todos los estados'}`} accessibilityState={{selected}} onHoverIn={()=>setHoveredStatus(status)} onHoverOut={()=>setHoveredStatus(null)} onFocus={()=>setHoveredStatus(status)} onBlur={()=>setHoveredStatus(null)} onPress={()=>updateFilter('status',status)} style={({pressed})=>[styles.statusChip,{backgroundColor:selected?colors.primary:hovered?colors.accent:colors.surface,borderColor:selected||hovered?colors.primary:colors.border,opacity:pressed?0.82:1}]}><AppText style={{color:selected?colors.onPrimary:colors.text,fontSize:13,fontWeight:selected?'700':'500'}}>{status?statusLabel(status):'Todos'}</AppText></Pressable>;})}
    </View>}

<QueryState compact={desktop} {...query}/>
    {query.data && (visibleAppointments.length ? desktop
      ? <AdminDataTable compact rows={visibleAppointments.slice(0,200)} rowKey={appointment=>String(appointment.id)} columns={[
        {key:'pet',label:'Paciente y servicio',flex:1.3,minWidth:170,render:appointment=><View style={styles.tableStack}><AppText numberOfLines={1} style={styles.tablePrimary}>{appointmentDisplayValue(appointment.petName,'Mascota sin nombre')}</AppText><AppText variant="caption" muted numberOfLines={1}>{appointmentDisplayValue(appointment.service,'Servicio no disponible')}</AppText></View>},
        {key:'date',label:'Fecha y hora',flex:1.15,minWidth:160,render:appointment=><AppText numberOfLines={2} style={styles.tablePrimary}>{appointment.startsAt?clinicDateTime(String(appointment.startsAt)):'Fecha y horario no disponibles'}</AppText>},
        {key:'professional',label:'Profesional',flex:1,minWidth:118,render:appointment=><AppText numberOfLines={2}>{appointmentDisplayValue(appointment.veterinarian,'No asignado')}</AppText>},
        {key:'status',label:'Estado',flex:0.82,minWidth:100,render:appointment=><AdminStatusBadge status={String(appointment.status??'')}/>},
        {key:'action',label:'Detalle',flex:0.58,minWidth:88,align:'right',render:appointment=>{const id=appointmentRouteId(appointment.id);return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir turno de ${appointmentDisplayValue(appointment.petName,'mascota sin nombre')}`} accessibilityState={{disabled:!id}} disabled={!id} onPress={()=>id&&router.push({pathname:`${base}/appointment` as never,params:{id}})} style={[styles.tableAction,{backgroundColor:colors.accent}]}><Ionicons name="eye-outline" size={17} color={colors.primary}/><AppText variant="caption" style={{color:colors.primary,fontWeight:'700'}}>Ver</AppText></Pressable>;}}
      ]}/>
      : <ResponsiveGrid>{visibleAppointments.slice(0,200).map(appointment => {const id=appointmentRouteId(appointment.id);return <PetCareCard key={String(appointment.id)} style={styles.appointmentCard}><View style={styles.mobileCardHeading}><View style={styles.tableStack}><AppText variant="subtitle">{appointment.startsAt?clinicDateTime(String(appointment.startsAt)):'Fecha y horario no disponibles'}</AppText><AppText>{appointmentDisplayValue(appointment.petName,'Mascota sin nombre')} · {appointmentDisplayValue(appointment.service,'Servicio no disponible')}</AppText></View><AdminStatusBadge status={String(appointment.status??'')}/></View><AppText variant="caption" muted numberOfLines={1}>{appointmentDisplayValue(appointment.veterinarian,'Profesional no informado')}</AppText>{!id&&<AppText variant="caption" muted>El turno no tiene un identificador válido. Actualizá la agenda.</AppText>}<Pressable accessibilityRole="button" accessibilityLabel={`Ver turno de ${appointmentDisplayValue(appointment.petName,'mascota sin nombre')}`} accessibilityState={{disabled:!id}} disabled={!id} onPress={() => id&&router.push({ pathname: `${base}/appointment` as never, params: { id } })} style={styles.mobileCardAction}><AppText style={{color:colors.primary,fontWeight:'700'}}>Ver detalle</AppText><Ionicons name="arrow-forward" size={17} color={colors.primary}/></Pressable></PetCareCard>;})}</ResponsiveGrid>
      : <PetCareEmptyState compact={desktop} title={period==='month'&&personalAgenda?'No hay turnos para este día':'No hay turnos en esta consulta'} message="Probá con otra fecha o cambiá los filtros para encontrar turnos." icon="calendar-outline"/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={Boolean(query.data && query.data.length>200)} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)}/>
  </PetCareScreen>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({
  agendaIntro:{flexDirection:'row',alignItems:'center',gap:11},calendarCard:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:10,padding:14,borderRadius:18},agendaIntroDesktop:{display:'none'},desktopCalendarControls:{flex:1,minWidth:590,flexDirection:'row',alignItems:'center',gap:10},
  agendaIcon:{width:42,height:42,borderRadius:15,alignItems:'center',justifyContent:'center'},
  periodPicker:{flexDirection:'row',gap:4,padding:5,borderRadius:18,borderWidth:1},periodPickerDesktop:{flexGrow:0,flexShrink:0,width:254,padding:3,borderRadius:13},
  periodOption:{flex:1,minWidth:0,minHeight:44,paddingHorizontal:4,borderRadius:14,borderWidth:1,borderColor:'transparent',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},periodOptionDesktop:{minHeight:36,borderRadius:10},
  periodLabel:{fontSize:14,fontWeight:'600',flexShrink:0},
  dateNavigator:{minHeight:72,padding:10,borderRadius:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:7},dateNavigatorDesktop:{flex:1,minWidth:230,minHeight:42,padding:4,borderRadius:13,gap:2},
  dateArrow:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center'},
  dateText:{flex:1,minWidth:0,alignItems:'center'},
  dateTitle:{fontSize:18,textAlign:'center'},
  todayButton:{minHeight:46,borderRadius:15,borderWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},todayButtonDesktop:{minHeight:38,paddingHorizontal:12,borderRadius:11,flexShrink:0},
  quickFilters:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:7},statusChip:{minHeight:34,paddingHorizontal:13,borderWidth:1,borderRadius:18,alignItems:'center',justifyContent:'center'},
  tableStack:{flex:1,minWidth:0,gap:3},tablePrimary:{fontWeight:'700'},tableAction:{minWidth:72,height:32,paddingHorizontal:8,borderRadius:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4},
  appointmentCard:{gap:10},mobileCardHeading:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:10},mobileCardAction:{minHeight:40,paddingHorizontal:4,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:'#c6ded4',marginTop:2},
  monthCalendar:{flexDirection:'row',flexWrap:'wrap'},monthCalendarDesktop:{width:238,flex:0},calendarWeekday:{width:'14.2857%',height:28,textAlign:'center',textAlignVertical:'center',fontWeight:'700'},calendarWeekdayDesktop:{height:20,fontSize:11},calendarDay:{width:'14.2857%',height:38,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'transparent',borderRadius:12,gap:2},calendarDayDesktop:{height:27,borderRadius:8,borderWidth:1},calendarDot:{width:4,height:4,borderRadius:2},
});
