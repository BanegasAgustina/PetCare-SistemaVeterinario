/** Tienda PetCare: consulta solo productos propios registrados en la base de datos. */
import { useCallback,useState } from 'react';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,QueryState,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { ProductCard } from '../../../components/client/RecordCards';
import { AppInput } from '../../../components/forms/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { FilterDisclosure } from '../../../components/ui/FilterDisclosure';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';

export default function StoreScreen(){
  const api=useClient();
  const [search,setSearch]=useState('');
  const [submitted,setSubmitted]=useState('');
  const [category,setCategory]=useState('');
  const [productType,setProductType]=useState<''|'MEDICINE'|'ACCESSORY'>('');
  const catalog=useClientQuery(api.categories);
  const query=useClientQuery(useCallback(()=>api.products(submitted,category||undefined,productType||undefined),[api,submitted,category,productType]));
  return <PetCareScreen>
    <PetCareHeader title="Tienda" subtitle="Productos disponibles para reservar"/>
    <AppText muted>Reservás y retirás en la veterinaria. El pago se realiza en el local.</AppText>
    <SearchFilterBar>
      <AppInput icon="search-outline" label="Buscar productos" placeholder="Nombre o categoría" value={search} maxLength={200} returnKeyType="search" onChangeText={setSearch} onSubmitEditing={()=>setSubmitted(search.trim())}/>
      <FilterDisclosure fullWidth activeCount={(category?1:0)+(productType?1:0)} onApply={()=>query.reload()} onClear={()=>{setCategory('');setProductType('');}}>
        <AppText variant="subtitle">Tipo de producto</AppText>
        <SelectionRow label="Todos" checked={!productType} onPress={()=>setProductType('')}/>
        <SelectionRow label="Medicamentos" checked={productType==='MEDICINE'} onPress={()=>setProductType('MEDICINE')}/>
        <SelectionRow label="Accesorios" checked={productType==='ACCESSORY'} onPress={()=>setProductType('ACCESSORY')}/>
        <AppText variant="subtitle">Categoría</AppText>
        <SelectionRow label="Todas las categorías" checked={!category} onPress={()=>setCategory('')}/>
        {catalog.data?.map(item=><SelectionRow key={item.id} label={item.name} checked={category===item.id} onPress={()=>setCategory(item.id)}/>)}
      </FilterDisclosure>
    </SearchFilterBar>
    <QueryState {...catalog}/>
    <QueryState {...query}/>
    {query.data&&(query.data.length?<ResponsiveGrid>{query.data.map(product=><ProductCard key={product.id} product={product}/>)}</ResponsiveGrid>:<PetCareEmptyState title="No hay productos disponibles" message="Probá cambiar los filtros o volvé a consultar más tarde." icon="bag-handle-outline"/>)}
  </PetCareScreen>;
}
