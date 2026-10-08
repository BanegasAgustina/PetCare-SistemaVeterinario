/**
 * Pantalla de productos disponibles para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,QueryState } from '../../../components/client/PetCareUI';
import { ProductCard } from '../../../components/client/RecordCards';
import { AppInput } from '../../../components/forms/AppInput';
import { AppButton } from '../../../components/ui/AppButton';
import { SelectionRow } from '../../../components/ui/SelectionRow';
export default function StoreScreen(){const api=useClient();const [search,setSearch]=useState('');const [submitted,setSubmitted]=useState('');const [category,setCategory]=useState('');
  const catalog=useClientQuery(api.categories);const query=useClientQuery(useCallback(()=>api.products(submitted,category||undefined),[api,submitted,category]));return <PetCareScreen>
    <PetCareHeader title="Tienda" subtitle="Cuidado que los acompaña"/>
    <PetCareCard><AppInput label="Buscar productos" value={search} maxLength={200} onChangeText={setSearch} onSubmitEditing={()=>setSubmitted(search.trim())}/><AppButton label="Buscar" compact onPress={()=>setSubmitted(search.trim())}/></PetCareCard>
    <QueryState {...catalog}/>{catalog.data&&catalog.data.length>0&&<PetCareCard><SelectionRow label="Todas las categorías" checked={!category} onPress={()=>setCategory('')}/>{catalog.data.map(c=><SelectionRow key={c.id} label={c.name} checked={category===c.id} onPress={()=>setCategory(c.id)}/>)}</PetCareCard>}
    <QueryState {...query}/>{query.data&&(query.data.length?query.data.map(p=><ProductCard key={p.id} product={p}/>):<PetCareEmptyState title="No hay productos disponibles" message={submitted||category?'Probá cambiar tu búsqueda o categoría.':'El catálogo de la clínica aparecerá acá cuando esté disponible.'} icon="bag-handle-outline"/>)}
    <AppButton label="Mis reservas" variant="secondary" onPress={()=>router.push('/client/orders')}/>
  </PetCareScreen>;
}
