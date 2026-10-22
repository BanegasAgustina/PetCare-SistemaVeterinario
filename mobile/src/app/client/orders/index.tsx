/** Historial consultado desde pedidos reales del cliente autenticado. */
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareCard, PetCareEmptyState, PetCareHeader, PetCareScreen, QueryState, money } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { router } from 'expo-router';

export default function ClientOrders() {
  const api = useClient();
  const query = useClientQuery(api.orders);
  return <PetCareScreen>
    <PetCareHeader title="Mis pedidos" subtitle="Historial de operaciones" back />
    <QueryState {...query} />
    {query.data && query.data.length === 0 && <PetCareEmptyState title="Todavía no hay pedidos" message="Cuando haya una operación registrada, vas a poder consultar acá su estado y detalle." icon="receipt-outline" />}
    {query.data?.map(order => <PetCareCard key={order.id}>
      <AppText variant="subtitle">Pedido #{order.id}</AppText>
      <AppText>{order.isStoreOrder ? `Entrega: ${order.fulfillmentMethod==='PICKUP'?'Retiro en el local':'Envío a domicilio'}` : order.orderType === 'DEMO_PURCHASE' ? 'Operación: Pedido de demostración' : 'Operación: Reserva de retiro'}</AppText>
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
