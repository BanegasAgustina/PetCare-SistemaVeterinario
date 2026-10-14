/**
 * Pantalla de productos disponibles para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,QueryState } from '../../../components/client/PetCareUI';
import { ProductCard } from '../../../components/client/RecordCards';
import { AppInput } from '../../../components/forms/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { FilterDisclosure } from '../../../components/ui/FilterDisclosure';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
export default function StoreScreen(){const api=useClient();const [search,setSearch]=useState('');const [submitted,setSubmitted]=useState('');const [category,setCategory]=useState('');
  const catalog=useClientQuery(api.categories);const query=useClientQuery(useCallback(()=>api.products(submitted,category||undefined),[api,submitted,category]));return <PetCareScreen>
    <PetCareHeader title="Tienda" subtitle="Cuidado que los acompaña"/>
    <SearchFilterBar><AppInput icon="search-outline" label="Buscar productos" placeholder="Nombre o categoría" value={search} maxLength={200} returnKeyType="search" onChangeText={setSearch} onSubmitEditing={()=>setSubmitted(search.trim())}/><FilterDisclosure fullWidth activeCount={category?1:0} onApply={()=>query.reload()} onClear={()=>setCategory('')}><AppText variant="subtitle">Categoría</AppText><SelectionRow label="Todas las categorías" checked={!category} onPress={()=>setCategory('')}/>{catalog.data?.map(c=><SelectionRow key={c.id} label={c.name} checked={category===c.id} onPress={()=>setCategory(c.id)}/>)}</FilterDisclosure></SearchFilterBar>
    <QueryState {...catalog}/>
    <QueryState {...query}/>{query.data&&(query.data.length?query.data.map(p=><ProductCard key={p.id} product={p}/>):<PetCareEmptyState title="No hay productos disponibles" message={submitted||category?'Probá cambiar tu búsqueda o categoría.':'El catálogo de la clínica aparecerá acá cuando esté disponible.'} icon="bag-handle-outline"/>)}
  </PetCareScreen>;
}
