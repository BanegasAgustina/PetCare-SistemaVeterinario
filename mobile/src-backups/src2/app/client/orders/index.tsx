import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,QueryState } from '../../../components/client/PetCareUI';
import { OrderCard } from '../../../components/client/RecordCards';
export default function OrdersScreen(){const api=useClient();const query=useClientQuery(api.orders);return <PetCareScreen><PetCareHeader title="Mis pedidos" subtitle="Tus compras, en un solo lugar" back/><QueryState {...query}/>{query.data&&(query.data.length?query.data.map(order=><OrderCard key={order.id} order={order}/>):<PetCareEmptyState title="Todavía no realizaste pedidos" icon="receipt-outline"/>)}</PetCareScreen>;}
