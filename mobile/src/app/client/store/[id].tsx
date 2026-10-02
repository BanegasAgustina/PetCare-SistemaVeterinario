import { useCallback } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareBadge,PetImage,QueryState,money } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { FormNotice } from '../../../components/ui/FormNotice';
export default function ProductDetail(){const {id}=useLocalSearchParams<{id:string}>();const api=useClient();const query=useClientQuery(useCallback(()=>api.product(id),[api,id]));const action=useAsyncAction();const {showToast}=useFeedback();return <PetCareScreen><PetCareHeader title={query.data?.name??'Producto'} back/><QueryState {...query}/>{query.data&&<><PetCareCard><PetImage uri={query.data.imageUrl}/>{query.data.category&&<PetCareBadge label={query.data.category}/>}<AppText variant="subtitle">{money(query.data.priceCents)}</AppText>{query.data.priceCents<query.data.regularPriceCents&&<AppText muted>Precio habitual: {money(query.data.regularPriceCents)}</AppText>}{query.data.description&&<AppText>{query.data.description}</AppText>}<AppText muted>{query.data.stock>0?`${query.data.stock} disponibles`:'Sin stock'}</AppText></PetCareCard><FormNotice error message={action.error}/><AppButton label="Agregar al carrito" loading={action.loading} disabled={query.data.stock===0} onPress={()=>void action.run(async()=>{const cart=await api.cart();const current=cart.items.find(p=>p.id===id)?.quantity??0;await api.updateCart(id,current+1);showToast('Producto agregado al carrito','success');})}/><AppButton label="Ver carrito" variant="secondary" onPress={()=>router.push('/client/cart')}/></>}</PetCareScreen>;}
