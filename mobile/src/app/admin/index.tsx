import { useCallback } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { AppText } from '../../components/ui/AppText';
import { PetCareCard, PetCareHeader, PetCareScreen, QueryState, money, type IconName } from '../../components/client/PetCareUI';
import { useTheme } from '../../hooks/useTheme';
import { clinicDateTime } from '../../utils/clinic-date';
import { AppButton } from '../../components/ui/AppButton';

type StoreStats = { newOrders:number;preparingOrders:number;pendingDelivery:number;ordersInTransit:number;salesTodayCents:number;ordersToday:number;pendingPayments:number;outOfStockProducts:number;lowStockProducts:number;promotionsExpiring?:number;expiredBanners?:number;scheduledBanners?:number };
type AdminHomeData = { modules:{code:string;name:string;path:string}[];storeStats?:StoreStats;recentActivity?:{id:string;orderId:string;clientName:string;stateType:string;newStatus:string;occurredAt:string}[] };
type Metric = { label:string;value:number;icon:IconName;path:string;params?:Record<string,string> };
type RecentActivity=NonNullable<AdminHomeData['recentActivity']>[number];
type BannersResult={items:{id:string;title:string|null;mobileImageUrl:string;isActive:boolean;startsAt?:string|null;endsAt?:string|null}[]};

function MetricCard({ label,value,icon,path,params }:Metric) {
  const {colors}=useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={()=>router.push({pathname:path as never,params} as never)} style={({pressed})=>[styles.metric,{backgroundColor:colors.surface,borderColor:colors.border,opacity:pressed?0.78:1}]}>
    <View style={[styles.metricIcon,{backgroundColor:colors.accent}]}><Ionicons name={icon} size={19} color={colors.primary}/></View>
    <AppText variant="title" style={styles.metricValue}>{value}</AppText>
    <AppText variant="caption" muted>{label}</AppText>
  </Pressable>;
}
function activityLabel(event:RecentActivity){
  const map:Record<string,string>={PLACED:'Nuevo pedido',PAID:'Pago confirmado',PROCESSING:'Pedido en preparación',READY:'Pedido listo para retirar',IN_TRANSIT:'Pedido en camino',DELIVERED:'Pedido entregado',PICKED_UP:'Pedido retirado',CANCELLED:'Pedido cancelado',FAILED:'Pago rechazado',REFUNDED:'Pago reembolsado'};
  return map[event.newStatus]??`${event.stateType}: ${event.newStatus}`;
}

export default function AdminHome() {
  const auth=useAuth();const {request}=auth;const clinic=useClinic();
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const clinicQuery=useClientQuery(clinic.home);
  const loadAdmin=useCallback(()=>request<AdminHomeData>('/admin/home'),[request]);
  const adminQuery=useClientQuery(loadAdmin);
  const loadBanners=useCallback(()=>request<BannersResult>('/clinic/store-banners'),[request]);
  const bannersQuery=useClientQuery(loadBanners);
  const stats=adminQuery.data?.storeStats;
  const clinicMetrics:Metric[]=[];
  if(auth.hasPermission('appointments.view_all')) {
    if(clinicQuery.data?.todayCount!==null&&clinicQuery.data?.todayCount!==undefined)clinicMetrics.push({label:'Turnos de hoy',value:clinicQuery.data.todayCount,icon:'calendar-outline',path:'/admin/agenda'});
    if(clinicQuery.data?.pendingCount!==null&&clinicQuery.data?.pendingCount!==undefined)clinicMetrics.push({label:'Solicitudes pendientes',value:clinicQuery.data.pendingCount,icon:'time-outline',path:'/admin/agenda',params:{status:'REQUESTED'}});
    if(clinicQuery.data?.confirmedTodayCount!==null&&clinicQuery.data?.confirmedTodayCount!==undefined)clinicMetrics.push({label:'Turnos confirmados',value:clinicQuery.data.confirmedTodayCount,icon:'checkmark-circle-outline',path:'/admin/agenda',params:{status:'CONFIRMED'}});
    if(clinicQuery.data?.cancelledTodayCount!==null&&clinicQuery.data?.cancelledTodayCount!==undefined)clinicMetrics.push({label:'Turnos cancelados',value:clinicQuery.data.cancelledTodayCount,icon:'close-circle-outline',path:'/admin/agenda',params:{status:'CANCELLED'}});
  }
  const storeMetrics:Metric[]=[];
  if(stats&&auth.hasPermission('orders.view_all'))storeMetrics.push(
    {label:'Pedidos nuevos',value:stats.newOrders,icon:'bag-handle-outline',path:'/admin/store-orders',params:{status:'PLACED'}},
    {label:'En preparación',value:stats.preparingOrders,icon:'cube-outline',path:'/admin/store-orders',params:{status:'PROCESSING'}},
    {label:'Pendientes de entrega',value:stats.pendingDelivery,icon:'bicycle-outline',path:'/admin/store-orders',params:{fulfillmentMethod:'DELIVERY'}},
    {label:'En camino',value:stats.ordersInTransit,icon:'navigate-outline',path:'/admin/store-orders',params:{status:'IN_TRANSIT'}},
    {label:'Pedidos de hoy',value:stats.ordersToday,icon:'receipt-outline',path:'/admin/store-orders'},
    {label:'Pagos por verificar',value:stats.pendingPayments,icon:'card-outline',path:'/admin/store-orders',params:{paymentStatus:'PENDING'}},
  );
  if(stats&&auth.hasPermission('products.update_stock'))storeMetrics.push({label:'Productos agotados',value:stats.outOfStockProducts,icon:'alert-circle-outline',path:'/admin/products'});
  if(stats&&auth.hasPermission('products.update_stock'))storeMetrics.push({label:'Stock bajo',value:stats.lowStockProducts,icon:'warning-outline',path:'/admin/products',params:{stock:'low'}});
  if(stats?.promotionsExpiring!==undefined)storeMetrics.push({label:'Promociones por vencer',value:stats.promotionsExpiring,icon:'pricetag-outline',path:'/admin/catalog/promotions'});
  if(stats?.expiredBanners!==undefined)storeMetrics.push({label:'Banners vencidos',value:stats.expiredBanners,icon:'images-outline',path:'/admin/store-banners'});
  if(stats?.scheduledBanners!==undefined)storeMetrics.push({label:'Banners programados',value:stats.scheduledBanners,icon:'calendar-outline',path:'/admin/store-banners'});
  const attention=storeMetrics.filter(metric=>['Pedidos nuevos','En preparación','Pendientes de entrega','Pagos por verificar','Productos agotados','Stock bajo','Promociones por vencer','Banners vencidos'].includes(metric.label)&&metric.value>0);

  return <PetCareScreen wide>
    <View style={styles.intro}><PetCareHeader title="Panel principal" subtitle="Resumen de actividad de tu clínica y tienda"/><AppButton compact variant="secondary" label="Actualizar indicadores" onPress={()=>{clinicQuery.reload();adminQuery.reload();if(auth.hasPermission('store.banners.manage'))bannersQuery.reload();}}/></View>
    {(auth.hasPermission('appointments.view_all')||auth.hasPermission('appointments.view_own'))&&<View style={styles.section}>
      <AppText variant="subtitle">Actividad de la clínica</AppText><QueryState {...clinicQuery}/>
      {!!clinicMetrics.length&&<View style={styles.metrics}>{clinicMetrics.map(metric=><MetricCard key={metric.label} {...metric}/>)}</View>}
      {clinicQuery.data?.nextAppointment&&<PetCareCard><AppText variant="caption" muted>Próximo turno</AppText><AppText variant="subtitle">{clinicDateTime(String(clinicQuery.data.nextAppointment.startsAt))}</AppText><AppText muted>{String(clinicQuery.data.nextAppointment.petName)} · {String(clinicQuery.data.nextAppointment.service)}</AppText></PetCareCard>}
      {!!clinicQuery.data?.upcomingAppointments?.length&&<View style={styles.section}><AppText variant="subtitle">Próximos turnos</AppText>{clinicQuery.data.upcomingAppointments.map((appointment,index)=><Pressable key={`${appointment.startsAt}-${index}`} accessibilityRole="button" onPress={()=>router.push({pathname:'/admin/agenda',params:{date:String(appointment.startsAt).slice(0,10)}} as never)} style={styles.activityRow}><View style={styles.activityDot}/><View style={styles.activityText}><AppText>{clinicDateTime(String(appointment.startsAt))} · {String(appointment.petName)}</AppText><AppText variant="caption" muted>{String(appointment.service)} · {String(appointment.status)}</AppText></View><Ionicons name="chevron-forward" size={17} color="#6d7b75"/></Pressable>)}</View>}
    </View>}
    {auth.hasPermission('orders.view_all')&&<View style={styles.section}>
      <AppText variant="subtitle">Actividad de la tienda</AppText><QueryState {...adminQuery}/>
      {stats&&<>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ventas de hoy: ${money(stats.salesTodayCents)}. Ver pedidos del día`} onPress={()=>router.push({pathname:'/admin/store-orders',params:{from:today,to:today}} as never)} style={({pressed})=>[styles.salesCard,{opacity:pressed?0.82:1}]}><View><AppText variant="caption" style={{color:'#e0f3eb'}}>Ventas de hoy · pagos confirmados</AppText><AppText variant="title" style={styles.salesValue}>{money(stats.salesTodayCents)}</AppText></View><View style={[styles.metricIcon,{backgroundColor:'rgba(255,255,255,0.16)'}]}><Ionicons name="trending-up-outline" size={21} color="#fff"/></View></Pressable>
        {!!storeMetrics.length&&<View style={styles.metrics}>{storeMetrics.map(metric=><MetricCard key={metric.label} {...metric}/>)}</View>}
        <View style={styles.section}><AppText variant="subtitle">Requiere tu atención</AppText>{attention.length?attention.map(metric=><Pressable key={metric.label} accessibilityRole="button" onPress={()=>router.push({pathname:metric.path as never,params:metric.params} as never)} style={styles.alertRow}><Ionicons name={metric.icon} size={19} color="#b05d1b"/><AppText style={styles.alertText}>{metric.value} · {metric.label}</AppText><Ionicons name="chevron-forward" size={17} color="#b05d1b"/></Pressable>):<PetCareCard><AppText variant="subtitle">Todo al día</AppText><AppText muted>No hay pedidos, pagos, campañas o productos que requieran atención.</AppText></PetCareCard>}</View>
        <View style={styles.section}><AppText variant="subtitle">Actividad reciente</AppText>{adminQuery.data?.recentActivity?.length?adminQuery.data.recentActivity.map(event=><Pressable key={event.id} accessibilityRole="button" onPress={()=>router.push({pathname:'/admin/store-orders',params:{search:event.orderId}} as never)} style={styles.activityRow}><View style={styles.activityDot}/><View style={styles.activityText}><AppText>{activityLabel(event)} · #{event.orderId}</AppText><AppText variant="caption" muted>{event.clientName} · {String(event.occurredAt)}</AppText></View><Ionicons name="chevron-forward" size={17} color="#6d7b75"/></Pressable>):<PetCareCard><AppText muted>No hay actividad de pedidos para mostrar.</AppText></PetCareCard>}</View>
      </>}
    </View>}
    {auth.hasPermission('store.banners.manage')&&<View style={styles.section}><View style={styles.bannerHeading}><AppText variant="subtitle">Banners y slider</AppText><AppButton compact label="Gestionar" onPress={()=>router.push('/admin/store-banners')}/></View><QueryState {...bannersQuery}/>{bannersQuery.data?.items.length===0&&<PetCareCard><AppText muted>No hay banners todavía. Creá el primero para mostrar campañas en la tienda.</AppText></PetCareCard>}{bannersQuery.data?.items.slice(0,3).map(banner=><Pressable key={banner.id} onPress={()=>router.push('/admin/store-banners')} accessibilityRole="button" style={[styles.bannerPreview,{backgroundColor:'#eaf2ee'}]}><Image source={{uri:banner.mobileImageUrl}} resizeMode="cover" style={styles.bannerImage}/><View style={styles.bannerInfo}><AppText variant="subtitle" numberOfLines={1}>{banner.title||'Banner sin título'}</AppText><AppText variant="caption" muted>{banner.isActive?'Activo':'Inactivo'}{banner.endsAt?` · Hasta ${String(banner.endsAt).slice(0,10)}`:''}</AppText></View><Ionicons name="chevron-forward" size={18} color="#6d7b75"/></Pressable>)}</View>}
  </PetCareScreen>;
}

const styles=StyleSheet.create({intro:{gap:3},section:{gap:12},bannerHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},bannerPreview:{minHeight:86,padding:9,borderRadius:15,flexDirection:'row',alignItems:'center',gap:12},bannerImage:{width:112,height:64,borderRadius:10,backgroundColor:'#dce8e2'},bannerInfo:{flex:1,minWidth:0,gap:4},metrics:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'48%',flexGrow:1,minWidth:145,minHeight:112,padding:13,borderWidth:1,borderRadius:14,gap:5},metricIcon:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center'},metricValue:{fontSize:25,lineHeight:30},salesCard:{padding:18,borderRadius:16,backgroundColor:'#176b52',flexDirection:'row',alignItems:'center',justifyContent:'space-between'},salesValue:{fontSize:28,lineHeight:34,color:'#fff'},alertRow:{minHeight:48,paddingHorizontal:12,borderRadius:12,backgroundColor:'#fff5e9',flexDirection:'row',alignItems:'center',gap:9},alertText:{flex:1,color:'#653d1d'},activityRow:{minHeight:52,paddingHorizontal:12,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#dce5e1',flexDirection:'row',alignItems:'center',gap:10},activityDot:{width:9,height:9,borderRadius:5,backgroundColor:'#218065'},activityText:{flex:1,minWidth:0,gap:2}});
