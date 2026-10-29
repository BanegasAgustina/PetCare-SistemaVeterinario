// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/** Detalle del pedido propio; el backend verifica el propietario a partir de la sesión. */
import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareCard, PetCareHeader, PetCareScreen, QueryState, money } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { deliveryStatusLabel, orderStatusLabel, paymentStatusLabel, reservationStatusLabel } from '../../../utils/display-labels';

// Función ClientOrderDetail: concentra la lógica dentro de este módulo.
export default function ClientOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useClient();
  const query = useClientQuery(useCallback(() => api.order(id), [api, id]));
  return <PetCareScreen>
    <PetCareHeader title="Comprobante" subtitle={query.data ? `Pedido #${query.data.id}` : undefined} back />
    
<QueryState {...query} />
    {query.data && <PetCareCard>
      <AppText variant="subtitle">Pedido #{query.data.id}</AppText>
      <AppText>Operación: {query.data.isStoreOrder ? 'Pedido de tienda' : query.data.orderType === 'DEMO_PURCHASE' ? 'Pedido de demostración' : 'Registro histórico'}</AppText>
      <AppText>Fecha: {new Date(query.data.createdAt).toLocaleString('es-AR')}</AppText>
      <AppText>Estado: {query.data.isStoreOrder?orderStatusLabel(query.data.storeOrderStatus??''):query.data.orderType==='RESERVATION'?reservationStatusLabel(query.data.status):orderStatusLabel(query.data.status)}</AppText>
      {query.data.isStoreOrder&&<><AppText>Pago: {paymentStatusLabel(query.data.storePaymentStatus)} · Entrega: {deliveryStatusLabel(query.data.deliveryStatus)}</AppText><AppText>Método de entrega: {query.data.fulfillmentMethod==='PICKUP'?'Retiro en el local':'Envío a domicilio'}</AppText>{query.data.fulfillmentMethod==='DELIVERY'&&<AppText>Dirección: {query.data.deliveryStreet} {query.data.deliveryNumber}{query.data.deliveryUnit?`, ${query.data.deliveryUnit}`:''}, {query.data.deliveryCity}, {query.data.deliveryProvince} · CP {query.data.deliveryPostalCode}</AppText>}</>}
      {query.data.orderType === 'DEMO_PURCHASE' && <AppText>Estado del pago: {paymentStatusLabel(query.data.paymentStatus)}</AppText>}
      {query.data.orderType==='STORE_PURCHASE'&&<><AppText>Pago: {paymentStatusLabel(query.data.storePaymentStatus)}</AppText>{query.data.proofSubmittedAt&&<AppText>Comprobante enviado: {new Date(query.data.proofSubmittedAt).toLocaleString('es-AR')}</AppText>}{query.data.paymentIntentId&&query.data.storePaymentStatus==='PENDING'&&<AppButton label="Ver transferencia y plazo" onPress={()=>router.push({pathname:'/client/payment-intents/[id]',params:{id:query.data!.id}})}/>}</>}
      {query.data.items.map(item => <AppText key={item.productId}>{item.name} · {item.quantity} × {money(item.priceCents)} = {money(item.subtotalCents)}</AppText>)}
      <AppText variant="subtitle">Total: {money(query.data.totalCents)}</AppText>
      {query.data.orderType==='RESERVATION'&&<AppText muted>Operación del sistema anterior. Se conserva como historial y ya no se gestiona desde PetCare.</AppText>}
      {query.data.orderType==='DEMO_PURCHASE'&&<AppText muted>Comprobante informativo de PetCare. No representa una aprobación bancaria. El stock no se reservó ni se descontó.</AppText>}
    </PetCareCard>}
  </PetCareScreen>;
}
