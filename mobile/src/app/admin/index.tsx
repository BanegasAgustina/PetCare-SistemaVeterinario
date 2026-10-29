// Panel compartido de ADMIN y SUPER_ADMIN; muestra datos y destinos autorizados por el backend.
import { useCallback } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { AppText } from '../../components/ui/AppText';
import { PetCareCard, PetCareHero, PetCareScreen, PetCareSection, PetCareEmptyState, QueryState, statusLabel, type IconName } from '../../components/client/PetCareUI';
import { useTheme } from '../../hooks/useTheme';
import { clinicDateTime } from '../../utils/clinic-date';
import { AppButton } from '../../components/ui/AppButton';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { RoleQuickAccess } from '../../components/layout/RoleQuickAccess';
import { appointmentRouteId } from '../../utils/appointment-display';

type Metric = { label:string;value:number;icon:IconName;path:string;params?:Record<string,string>;hint:string };
type BannersResult={items:{id:string;title:string|null;mobileImageUrl:string;isActive:boolean;endsAt?:string|null}[]};
function MetricCard({ label,value,icon,path,params,hint,desktop=false }:Metric&{desktop?:boolean}) {
  const {colors}=useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={()=>router.push({pathname:path as never,params} as never)} style={({pressed})=>[styles.metric,desktop&&styles.metricDesktop,{backgroundColor:colors.surface,borderColor:colors.border,opacity:pressed?0.78:1}]}>
    <View style={[styles.metricIcon,{backgroundColor:colors.accent}]}><Ionicons name={icon} size={19} color={colors.primary}/></View>
    <AppText variant="title" style={styles.metricValue}>{value}</AppText>
    <AppText variant="caption" style={styles.metricLabel}>{label}</AppText>
    <AppText variant="caption" muted>{hint}</AppText>
  </Pressable>;
}

function AppointmentRow({appointment,desktop,basePath}:{appointment:Record<string,unknown>;desktop:boolean;basePath:string}) {
  const {colors}=useTheme();
  const id=appointmentRouteId(appointment.id);
  return <Pressable disabled={!id} accessibilityRole="button" accessibilityState={{disabled:!id}} accessibilityLabel={`Abrir turno de ${String(appointment.petName??'mascota')}`} onPress={()=>id&&router.push({pathname:`${basePath}/appointment` as never,params:{id}})} style={({pressed})=>[styles.appointmentRow,{backgroundColor:colors.surface,borderColor:colors.border,opacity:pressed?0.78:1}]}>
    <View style={[styles.appointmentIcon,{backgroundColor:colors.accent}]}><Ionicons name="calendar-outline" size={18} color={colors.primary}/></View>
    <View style={styles.appointmentCopy}>
      <AppText style={styles.appointmentTitle} numberOfLines={1}>{String(appointment.petName??'Mascota')} · {String(appointment.service??'Servicio')}</AppText>
      <AppText variant="caption" muted numberOfLines={1}>{clinicDateTime(String(appointment.startsAt??''))}{appointment.status?` · ${statusLabel(String(appointment.status))}`:''}</AppText>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.muted}/>
  </Pressable>;
}

export default function AdminHome() {
  const auth=useAuth();const {request}=auth;const clinic=useClinic();
  const {colors}=useTheme();const {width}=useWindowDimensions();const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const clinicQuery=useClientQuery(clinic.home);
  const hasPermission=auth.hasPermission;
  const canSeeAppointments=hasPermission('appointments.view_all');
  const canManageBanners=hasPermission('store.banners.manage');
  const canManagePromotions=hasPermission('promotions.manage');
  const loadBanners=useCallback(()=>canManageBanners?request<BannersResult>('/clinic/store-banners/query',{method:'POST',body:{}}):Promise.resolve({items:[]}),[request,canManageBanners]);
  const bannersQuery=useClientQuery(loadBanners);
  const loadPending=useCallback(()=>canSeeAppointments?clinic.appointments({status:'REQUESTED',page:'1',sort:'priority'}):Promise.resolve([]),[clinic,canSeeAppointments]);
  const loadUpcoming=useCallback(()=>canSeeAppointments?clinic.appointments({upcomingOnly:'true',page:'1',sort:'date_asc'}):Promise.resolve([]),[clinic,canSeeAppointments]);
  const pendingQuery=useClientQuery(loadPending);
  const upcomingQuery=useClientQuery(loadUpcoming);
  const clinicMetrics:Metric[]=[];
  if(canSeeAppointments) {
    if(clinicQuery.data?.todayCount!==null&&clinicQuery.data?.todayCount!==undefined)clinicMetrics.push({label:'Turnos de hoy',value:clinicQuery.data.todayCount,icon:'calendar-outline',path:'/admin/agenda',hint:'Actividad de hoy'});
    if(clinicQuery.data?.pendingCount!==null&&clinicQuery.data?.pendingCount!==undefined)clinicMetrics.push({label:'Solicitudes pendientes',value:clinicQuery.data.pendingCount,icon:'time-outline',path:'/admin/agenda',params:{status:'REQUESTED'},hint:'Todas las fechas'});
    if(clinicQuery.data?.confirmedTodayCount!==null&&clinicQuery.data?.confirmedTodayCount!==undefined)clinicMetrics.push({label:'Turnos confirmados',value:clinicQuery.data.confirmedTodayCount,icon:'checkmark-circle-outline',path:'/admin/agenda',params:{status:'CONFIRMED'},hint:'Confirmados hoy'});
    if(clinicQuery.data?.cancelledTodayCount!==null&&clinicQuery.data?.cancelledTodayCount!==undefined)clinicMetrics.push({label:'Turnos cancelados',value:clinicQuery.data.cancelledTodayCount,icon:'close-circle-outline',path:'/admin/agenda',params:{status:'CANCELLED'},hint:'Cancelados hoy'});
  }
  return <PetCareScreen wide decoration="care">
    <View style={styles.intro}><PetCareHero eyebrow={auth.user?.role==='SUPER_ADMIN'?'ADMINISTRACIÓN PRINCIPAL':'PANEL DE ADMINISTRACIÓN'} title={auth.user?.firstName?`¡Hola, ${auth.user.firstName}!`:'Panel principal'} subtitle="Resumen de actividad de tu clínica" icon="business-outline"/></View>

    {canSeeAppointments&&<PetCareSection title="Actividad de la clínica">
      <QueryState compact={desktop} {...clinicQuery}/>
      {!!clinicMetrics.length&&<View style={styles.metrics}>{clinicMetrics.map(metric=><MetricCard key={metric.label} {...metric} desktop={desktop}/>)}</View>}
    </PetCareSection>}

    {canSeeAppointments&&<PetCareSection title="Turnos que requieren atención" action={<AppButton compact variant="secondary" label="Ver agenda" onPress={()=>router.push('/admin/agenda')}/> }>
      <QueryState compact={desktop} {...pendingQuery}/>
      {pendingQuery.data?.length?pendingQuery.data.slice(0,5).map(appointment=><AppointmentRow key={String(appointment.id)} appointment={appointment} desktop={desktop} basePath="/admin"/>):pendingQuery.data&&<PetCareEmptyState compact title="No hay solicitudes pendientes" message="Las nuevas solicitudes aparecerán aquí para su revisión." icon="checkmark-circle-outline"/>}
    </PetCareSection>}

    {canSeeAppointments&&<PetCareSection title="Próximos turnos" action={<AppButton compact variant="secondary" label="Ver agenda" onPress={()=>router.push('/admin/agenda')}/> }>
      <QueryState compact={desktop} {...upcomingQuery}/>
      {upcomingQuery.data?.length?upcomingQuery.data.slice(0,5).map(appointment=><AppointmentRow key={String(appointment.id)} appointment={appointment} desktop={desktop} basePath="/admin"/>):upcomingQuery.data&&<PetCareEmptyState compact title="No hay próximos turnos" message="Los turnos futuros aparecerán aquí cuando estén solicitados, confirmados o en atención." icon="calendar-outline"/>}
    </PetCareSection>}

    {(canManageBanners||canManagePromotions)&&<PetCareSection title="Banners y promociones">
      <View style={[styles.managementCards,desktop&&styles.managementCardsDesktop]}>
        {canManageBanners&&<PetCareCard style={styles.managementCard}><View style={styles.managementHeading}><View style={[styles.appointmentIcon,{backgroundColor:colors.accent}]}><Ionicons name="images-outline" size={18} color={colors.primary}/></View><View style={styles.appointmentCopy}><AppText variant="subtitle">Banners de tienda</AppText><AppText variant="caption" muted>Campañas visibles en la tienda</AppText></View></View><AppButton compact label="Gestionar banners" onPress={()=>router.push('/admin/store-banners')}/><QueryState compact={desktop} {...bannersQuery}/>{bannersQuery.data?.items.length===0&&<AppText variant="caption" muted>No hay banners cargados.</AppText>}{bannersQuery.data?.items.slice(0,2).map(banner=><Pressable key={banner.id} onPress={()=>router.push('/admin/store-banners')} accessibilityRole="button" style={[styles.bannerPreview,{borderColor:colors.border}]}><Image source={{uri:banner.mobileImageUrl}} resizeMode="cover" style={styles.bannerImage}/><View style={styles.bannerInfo}><AppText numberOfLines={1}>{banner.title||'Banner sin título'}</AppText><AppText variant="caption" muted>{banner.isActive?'Activo':'Inactivo'}{banner.endsAt?` · Hasta ${String(banner.endsAt).slice(0,10)}`:''}</AppText></View></Pressable>)}</PetCareCard>}
        {canManagePromotions&&<PetCareCard style={styles.managementCard}><View style={styles.managementHeading}><View style={[styles.appointmentIcon,{backgroundColor:colors.accent}]}><Ionicons name="pricetags-outline" size={18} color={colors.primary}/></View><View style={styles.appointmentCopy}><AppText variant="subtitle">Promociones y descuentos</AppText><AppText variant="caption" muted>Administrá las promociones de la tienda</AppText></View></View><AppButton compact label="Gestionar promociones" onPress={()=>router.push('/admin/catalog/promotions')}/></PetCareCard>}
      </View>
    </PetCareSection>}

    <RoleQuickAccess title="Accesos personales"/>
  </PetCareScreen>;
}

const styles=StyleSheet.create({intro:{gap:3},metrics:{width:'100%',flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47%',flexGrow:1,minWidth:140,minHeight:124,padding:13,borderWidth:1,borderRadius:14,gap:4},metricDesktop:{width:'23%',minWidth:150,minHeight:118,padding:12},metricIcon:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center'},metricValue:{fontSize:25,lineHeight:30},metricLabel:{fontWeight:'600'},managementCards:{gap:12},managementCardsDesktop:{flexDirection:'row',alignItems:'flex-start'},managementCard:{flex:1,minWidth:0,gap:10},managementHeading:{flexDirection:'row',alignItems:'center',gap:10},appointmentRow:{width:'100%',minHeight:62,paddingHorizontal:11,paddingVertical:9,borderWidth:1,borderRadius:14,flexDirection:'row',alignItems:'center',gap:10},appointmentIcon:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center',flexShrink:0},appointmentCopy:{flex:1,minWidth:0,gap:3},appointmentTitle:{fontWeight:'600'},bannerPreview:{minHeight:68,padding:8,borderWidth:1,borderRadius:12,flexDirection:'row',alignItems:'center',gap:10},bannerImage:{width:84,height:50,borderRadius:8,backgroundColor:'#dce8e2'},bannerInfo:{flex:1,minWidth:0,gap:3}});
