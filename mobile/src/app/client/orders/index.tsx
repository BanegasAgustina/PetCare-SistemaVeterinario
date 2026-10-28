// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/** Historial consultado desde pedidos reales del cliente autenticado. */
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareCard, PetCareEmptyState, PetCareHeader, PetCareScreen, QueryState, money } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { router } from 'expo-router';
import { Platform,useWindowDimensions } from 'react-native';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import { isWebAtLeast,responsiveLayout } from '../../../constants/responsive';

// Función ClientOrders: concentra la lógica dentro de este módulo.
export default function ClientOrders() {
  const api = useClient();
  const {width}=useWindowDimensions();
  const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const query = useClientQuery(api.orders);
  return <PetCareScreen>
    <PetCareHeader title="Mis pedidos" subtitle="Historial de operaciones" back />
    
<QueryState {...query} />
    {query.data && query.data.length === 0 && <PetCareEmptyState title="Todavía no hay pedidos" message="Cuando haya una operación registrada, vas a poder consultar acá su estado y detalle." icon="receipt-outline" />}
    {Boolean(query.data?.length)&&desktop?<AdminDataTable rows={query.data??[]} rowKey={order=>order.id} columns={[
      {key:'order',label:'Pedido',flex:.7,minWidth:90,render:order=><AppText variant="subtitle" numberOfLines={1}>#{order.id}</AppText>},
      {key:'operation',label:'Operación',flex:1.3,minWidth:170,render:order=><AppText numberOfLines={2}>{order.isStoreOrder?`Tienda · ${order.fulfillmentMethod==='PICKUP'?'Retiro':'Envío'}`:order.orderType==='DEMO_PURCHASE'?'Pedido de demostración':'Registro histórico'}</AppText>},
      {key:'status',label:'Estado',flex:1,minWidth:130,render:order=><AppText numberOfLines={2}>{order.isStoreOrder?order.storeOrderStatus:order.status}</AppText>},
      {key:'payment',label:'Pago y entrega',flex:1,minWidth:135,render:order=><AppText variant="caption" muted numberOfLines={2}>{order.isStoreOrder?`${order.storePaymentStatus} · ${order.deliveryStatus}`:order.orderType==='DEMO_PURCHASE'?(order.paymentStatus==='DEMO_NOT_PAID'?'No realizado':order.paymentStatus):order.orderType==='STORE_PURCHASE'?(order.storePaymentStatus==='PENDING'?'Pendiente de verificación':order.storePaymentStatus):'—'}</AppText>},
      {key:'date',label:'Fecha',flex:1,minWidth:145,render:order=><AppText variant="caption" muted numberOfLines={1}>{new Date(order.createdAt).toLocaleString('es-AR')}</AppText>},
      {key:'total',label:'Total',flex:.7,minWidth:95,render:order=><AppText numberOfLines={1}>{money(order.totalCents)}</AppText>},
      {key:'action',label:'',flex:.55,minWidth:70,align:'right',render:order=><AppButton compact label="Ver" variant="secondary" accessibilityLabel={`Ver pedido ${order.id}`} onPress={() => router.push({ pathname: '/client/orders/[id]', params: { id: order.id } })}/>},
    ]}/>:query.data?.map(order => <PetCareCard key={order.id}>
      <AppText variant="subtitle">Pedido #{order.id}</AppText>
      <AppText>{order.isStoreOrder ? `Entrega: ${order.fulfillmentMethod==='PICKUP'?'Retiro en el local':'Envío a domicilio'}` : order.orderType === 'DEMO_PURCHASE' ? 'Operación: Pedido de demostración' : 'Operación: Registro histórico'}</AppText>
      {order.orderType==='RESERVATION'&&<AppText variant="caption" muted>Operación del sistema anterior; se conserva como historial.</AppText>}
      <AppText>Estado: {order.isStoreOrder ? order.storeOrderStatus : order.status}</AppText>
      {order.isStoreOrder&&<AppText>Pago: {order.storePaymentStatus} · Entrega: {order.deliveryStatus}</AppText>}
      {order.orderType === 'DEMO_PURCHASE' && <AppText>Pago: {order.paymentStatus === 'DEMO_NOT_PAID' ? 'No realizado' : order.paymentStatus}</AppText>}
      {order.orderType==='STORE_PURCHASE'&&<AppText>Pago: {order.storePaymentStatus==='PENDING'?'Pendiente de verificación':order.storePaymentStatus}</AppText>}
      <AppText>Fecha: {new Date(order.createdAt).toLocaleString('es-AR')}</AppText>
      <AppText>Total: {money(order.totalCents)}</AppText>
      <AppButton label="Ver comprobante" variant="secondary" onPress={() => router.push({ pathname: '/client/orders/[id]', params: { id: order.id } })} />
    </PetCareCard>)}
  </PetCareScreen>;
}
