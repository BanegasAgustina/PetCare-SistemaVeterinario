import { useCallback } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { AppText } from '../../components/ui/AppText';
import { PetCareCard, PetCareHero, PetCareScreen, QueryState, type IconName } from '../../components/client/PetCareUI';
import { useTheme } from '../../hooks/useTheme';
import { clinicDateTime } from '../../utils/clinic-date';
import { AppButton } from '../../components/ui/AppButton';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { RoleQuickAccess } from '../../components/layout/RoleQuickAccess';

type Metric = { label:string;value:number;icon:IconName;path:string;params?:Record<string,string> };
type BannersResult={items:{id:string;title:string|null;mobileImageUrl:string;isActive:boolean;startsAt?:string|null;endsAt?:string|null}[]};

function MetricCard({ label,value,icon,path,params,desktop=false }:Metric&{desktop?:boolean}) {
  const {colors}=useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={()=>router.push({pathname:path as never,params} as never)} style={({pressed})=>[styles.metric,desktop&&styles.metricDesktop,{backgroundColor:colors.surface,borderColor:colors.border,opacity:pressed?0.78:1}]}>
    <View style={[styles.metricIcon,{backgroundColor:colors.accent}]}><Ionicons name={icon} size={19} color={colors.primary}/></View>
    <AppText variant="title" style={styles.metricValue}>{value}</AppText>
    <AppText variant="caption" muted>{label}</AppText>
  </Pressable>;
}
export default function AdminHome() {
  const auth=useAuth();const {request}=auth;const clinic=useClinic();
  const {colors}=useTheme();const {width}=useWindowDimensions();const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const clinicQuery=useClientQuery(clinic.home);
  const { hasPermission } = auth;
  const canManageBanners=hasPermission('store.banners.manage');
  const loadBanners=useCallback(()=>request<BannersResult>('/clinic/store-banners/query',{method:'POST',body:{}}),[request]);
  const bannersQuery=useClientQuery(loadBanners);
  const clinicMetrics:Metric[]=[];
  if(auth.hasPermission('appointments.view_all')) {
    if(clinicQuery.data?.todayCount!==null&&clinicQuery.data?.todayCount!==undefined)clinicMetrics.push({label:'Turnos de hoy',value:clinicQuery.data.todayCount,icon:'calendar-outline',path:'/admin/agenda'});
    if(clinicQuery.data?.pendingCount!==null&&clinicQuery.data?.pendingCount!==undefined)clinicMetrics.push({label:'Solicitudes pendientes',value:clinicQuery.data.pendingCount,icon:'time-outline',path:'/admin/agenda',params:{status:'REQUESTED'}});
    if(clinicQuery.data?.confirmedTodayCount!==null&&clinicQuery.data?.confirmedTodayCount!==undefined)clinicMetrics.push({label:'Turnos confirmados',value:clinicQuery.data.confirmedTodayCount,icon:'checkmark-circle-outline',path:'/admin/agenda',params:{status:'CONFIRMED'}});
    if(clinicQuery.data?.cancelledTodayCount!==null&&clinicQuery.data?.cancelledTodayCount!==undefined)clinicMetrics.push({label:'Turnos cancelados',value:clinicQuery.data.cancelledTodayCount,icon:'close-circle-outline',path:'/admin/agenda',params:{status:'CANCELLED'}});
  }
  return <PetCareScreen wide decoration="care">
    <View style={styles.intro}><PetCareHero eyebrow={auth.user?.role==='SUPER_ADMIN'?'ADMINISTRACIÓN PRINCIPAL':'PANEL DE ADMINISTRACIÓN'} title={auth.user?.firstName?`¡Hola, ${auth.user.firstName}!`:'Panel principal'} subtitle="Resumen de actividad de tu clínica" icon="business-outline"/></View>
    <View style={[styles.dashboardSections,desktop&&styles.dashboardSectionsDesktop]}>
    {(auth.hasPermission('appointments.view_all')||auth.hasPermission('appointments.view_own'))&&<View style={[styles.section,desktop&&styles.clinicColumn]}>
      <AppText variant="subtitle">Actividad de la clínica</AppText><QueryState {...clinicQuery}/>
      {!!clinicMetrics.length&&<View style={styles.metrics}>{clinicMetrics.map(metric=><MetricCard key={metric.label} {...metric} desktop={desktop}/>)}</View>}
      {clinicQuery.data?.nextAppointment&&<PetCareCard><AppText variant="caption" muted>Próximo turno</AppText><AppText variant="subtitle">{clinicDateTime(String(clinicQuery.data.nextAppointment.startsAt))}</AppText><AppText muted>{String(clinicQuery.data.nextAppointment.petName)} · {String(clinicQuery.data.nextAppointment.service)}</AppText></PetCareCard>}
      {!!clinicQuery.data?.upcomingAppointments?.length&&<View style={styles.section}><AppText variant="subtitle">Próximos turnos</AppText>{clinicQuery.data.upcomingAppointments.map((appointment,index)=><Pressable key={`${appointment.startsAt}-${index}`} accessibilityRole="button" onPress={()=>router.push({pathname:'/admin/agenda',params:{date:String(appointment.startsAt).slice(0,10)}} as never)} style={[styles.activityRow,desktop&&{borderBottomColor:colors.border}]}><View style={[styles.activityDot,desktop&&{backgroundColor:colors.primary}]}/><View style={styles.activityText}><AppText>{clinicDateTime(String(appointment.startsAt))} · {String(appointment.petName)}</AppText><AppText variant="caption" muted>{String(appointment.service)} · {String(appointment.status)}</AppText></View><Ionicons name="chevron-forward" size={17} color={desktop?colors.muted:'#6d7b75'}/></Pressable>)}</View>}
    </View>}
    {canManageBanners&&<View style={[styles.section,desktop&&styles.secondaryColumn]}><View style={styles.bannerHeading}><AppText variant="subtitle">Banners y slider</AppText><AppButton compact label="Gestionar" onPress={()=>router.push('/admin/store-banners')}/></View><QueryState {...bannersQuery}/>{bannersQuery.data?.items.length===0&&<PetCareCard><AppText muted>No hay banners todavía. Creá el primero para mostrar campañas en la tienda.</AppText></PetCareCard>}{bannersQuery.data?.items.slice(0,3).map(banner=><Pressable key={banner.id} onPress={()=>router.push('/admin/store-banners')} accessibilityRole="button" style={[styles.bannerPreview,desktop&&{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1}]}><Image source={{uri:banner.mobileImageUrl}} resizeMode="cover" style={[styles.bannerImage,desktop&&{backgroundColor:colors.accent}]}/><View style={styles.bannerInfo}><AppText variant="subtitle" numberOfLines={1}>{banner.title||'Banner sin título'}</AppText><AppText variant="caption" muted>{banner.isActive?'Activo':'Inactivo'}{banner.endsAt?` · Hasta ${String(banner.endsAt).slice(0,10)}`:''}</AppText></View><Ionicons name="chevron-forward" size={18} color={desktop?colors.muted:'#6d7b75'}/></Pressable>)}</View>}
    </View>
    <RoleQuickAccess/>
  </PetCareScreen>;
}

const styles=StyleSheet.create({intro:{gap:3},section:{gap:12},dashboardSections:{gap:22},dashboardSectionsDesktop:{flexDirection:'row',alignItems:'flex-start'},clinicColumn:{flex:1.7,minWidth:0},secondaryColumn:{flex:1,minWidth:260},bannerHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},bannerPreview:{minHeight:86,padding:9,borderRadius:15,flexDirection:'row',alignItems:'center',gap:12},bannerImage:{width:112,height:64,borderRadius:10,backgroundColor:'#dce8e2'},bannerInfo:{flex:1,minWidth:0,gap:4},metrics:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'48%',flexGrow:1,minWidth:145,minHeight:112,padding:13,borderWidth:1,borderRadius:14,gap:5},metricDesktop:{width:'23%',minHeight:92,padding:10},metricIcon:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center'},metricValue:{fontSize:25,lineHeight:30},activityRow:{minHeight:52,paddingHorizontal:12,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#dce5e1',flexDirection:'row',alignItems:'center',gap:10},activityDot:{width:9,height:9,borderRadius:5,backgroundColor:'#218065'},activityText:{flex:1,minWidth:0,gap:2}});
