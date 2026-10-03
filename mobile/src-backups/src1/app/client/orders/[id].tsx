import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareBadge,QueryState,money,dateTime,statusLabel } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';
export default function OrderScreen(){const {id}=useLocalSearchParams<{id:string}>();const api=useClient();const query=useClientQuery(useCallback(()=>api.order(id),[api,id]));return <PetCareScreen><PetCareHeader title={query.data?`Pedido #${query.data.id}`:'Detalle del pedido'} back/><QueryState {...query}/>{query.data&&<><PetCareCard><PetCareBadge label={statusLabel(query.data.status)}/><AppText>{dateTime(query.data.createdAt)}</AppText><AppText variant="subtitle">Total {money(query.data.totalCents)}</AppText></PetCareCard>{query.data.items.map(item=><PetCareCard key={item.productId}><AppText variant="subtitle">{item.name}</AppText><AppText>{item.quantity} × {money(item.priceCents)}</AppText><AppText>Subtotal {money(item.subtotalCents)}</AppText></PetCareCard>)}</>}</PetCareScreen>;}
