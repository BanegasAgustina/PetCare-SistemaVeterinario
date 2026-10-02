import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,QueryState,money } from '../../components/client/PetCareUI';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { FormNotice } from '../../components/ui/FormNotice';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
export default function CartScreen(){const api=useClient();const query=useClientQuery(api.cart);const action=useAsyncAction();const [confirm,setConfirm]=useState(false);const [remove,setRemove]=useState<string|null>(null);
  function update(id:string,quantity:number){void action.run(async()=>{await api.updateCart(id,quantity);query.reload();});}
  return <PetCareScreen><PetCareHeader title="Tu carrito" subtitle="Revisá su próximo cuidado" back/><QueryState {...query}/><FormNotice error message={action.error}/>{query.data&&(query.data.items.length?<>
    {query.data.items.map(item=><PetCareCard key={item.id}><AppText variant="subtitle">{item.name}</AppText><AppText>{money(item.priceCents)} por unidad</AppText><AppText>Cantidad: {item.quantity} · Subtotal {money(item.subtotalCents)}</AppText>{(!item.isActive||item.stock<item.quantity)&&<AppText muted>Este producto requiere revisar disponibilidad.</AppText>}<View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><AppButton label="−" accessibilityLabel={`Disminuir cantidad de ${item.name}`} variant="secondary" disabled={action.loading||item.quantity<=1} onPress={()=>update(item.id,item.quantity-1)}/></View><View style={{flex:1}}><AppButton label="+" accessibilityLabel={`Aumentar cantidad de ${item.name}`} variant="secondary" disabled={action.loading||item.quantity>=99||item.quantity>=item.stock} onPress={()=>update(item.id,item.quantity+1)}/></View></View><AppButton label="Eliminar" variant="secondary" disabled={action.loading} onPress={()=>setRemove(item.id)}/></PetCareCard>)}
    <PetCareCard><AppText variant="subtitle">Total {money(query.data.totalCents)}</AppText><AppText muted>El precio y el stock se validan al confirmar el pedido. No se realiza un cobro en esta pantalla.</AppText><AppButton label="Confirmar pedido" loading={action.loading} disabled={query.loading||query.data.items.some(i=>!i.isActive||i.quantity>i.stock)} onPress={()=>setConfirm(true)}/></PetCareCard>
  </>:<PetCareEmptyState title="Tu carrito está vacío" icon="cart-outline" label="Ir a la tienda" action={()=>router.replace('/client/store')}/>)}
  <AppButton label="Mis pedidos" variant="secondary" onPress={()=>router.push('/client/orders')}/>
  <ConfirmModal visible={Boolean(remove)} title="Eliminar del carrito" message="¿Querés quitar este producto?" confirmLabel="Eliminar" destructive onCancel={()=>setRemove(null)} onConfirm={async()=>{if(remove)await api.updateCart(remove,0);setRemove(null);query.reload();}}/>
  <ConfirmModal visible={confirm} title="Confirmar pedido" message="Se registrará el pedido con el precio vigente y la disponibilidad de los productos." confirmLabel="Crear pedido" onCancel={()=>setConfirm(false)} onConfirm={async()=>{if(!query.data)return;const order=await api.checkout(query.data.checkoutKey);setConfirm(false);router.replace({pathname:'/client/orders/[id]',params:{id:order.id}});}}/>
  </PetCareScreen>;
}
