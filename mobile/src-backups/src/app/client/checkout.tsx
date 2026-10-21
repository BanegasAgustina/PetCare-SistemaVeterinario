/** Checkout visual sin integración: los datos son efímeros y jamás se envían ni se persisten. */
import { useRef } from 'react';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareCard, PetCareHeader, PetCareScreen, QueryState, money } from '../../components/client/PetCareUI';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { FormNotice } from '../../components/ui/FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';

export default function DemoCheckout() {
  const api = useClient();
  const cart = useClientQuery(api.cart);
  const requestKey = useRef(Crypto.randomUUID());
  const action = useAsyncAction();
  const totalItems = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  async function confirm() {
    const result: { order: Awaited<ReturnType<typeof api.checkout>> | null } = { order: null };
    const saved = await action.run(async () => { result.order = await api.checkout(requestKey.current); });
    if (saved && result.order) router.replace({ pathname: '/client/orders/[id]', params: { id: result.order.id } });
  }

  return <PetCareScreen>
    <PetCareHeader title="Checkout de demostración" subtitle="Pago no disponible" back />
    <FormNotice message="Pedido de demostración. No ingreses datos de tarjeta: no se realizará ningún cobro y el stock no se reserva ni se descuenta." />
    <QueryState {...cart} />
    {cart.data && cart.data.items.length === 0 && <PetCareCard><AppText>El carrito está vacío.</AppText><AppButton label="Volver a la tienda" onPress={() => router.replace('/client/store')} /></PetCareCard>}
    {!!cart.data?.items.length && <>
      <PetCareCard>
        <AppText variant="subtitle">Resumen de la compra</AppText>
        {cart.data.items.map(item => <AppText key={item.id}>{item.name} · {item.quantity} × {money(item.priceCents)} = {money(item.subtotalCents)}</AppText>)}
        <AppText variant="subtitle">Total: {money(cart.data.totalCents)}</AppText>
      </PetCareCard>
      <PetCareCard>
        <AppText variant="subtitle">Confirmación sin pago</AppText>
        <AppText>Al confirmar se guardará un comprobante con estado “Demostración creada · pago no realizado”. El pedido se guarda con el precio y stock validados por el servidor.</AppText>
        <FormNotice error message={action.error} />
        <AppButton label="Crear pedido de demostración" loading={action.loading} onPress={() => void confirm()} />
        <AppButton label="Volver al carrito" variant="secondary" onPress={() => router.replace('/client/cart')} />
      </PetCareCard>
    </>}
    {cart.data && totalItems > 0 && <AppText muted>Los importes se recalculan en el backend al crear el comprobante. Esta operación no procesa pagos.</AppText>}
  </PetCareScreen>;
}
