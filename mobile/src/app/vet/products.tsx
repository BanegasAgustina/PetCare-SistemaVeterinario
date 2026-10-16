/** Catálogo de productos disponible para el veterinario con permiso products.view. */
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, PetImage, QueryState, money } from '../../components/client/PetCareUI';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { AppInput } from '../../components/forms/AppInput';
import { AppText } from '../../components/ui/AppText';

export default function VeterinarianProductsScreen() {
  const clinic = useClinic();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const query = useClientQuery(useCallback(() => clinic.products(submittedSearch), [clinic, submittedSearch]));

  return <PetCareScreen wide>
    <PetCareHeader title="Productos" subtitle="Catálogo de productos de la clínica" back />
    <SearchFilterBar>
      <AppInput icon="search-outline" label="Buscar productos" placeholder="Nombre del producto" value={search} returnKeyType="search" onChangeText={setSearch} onSubmitEditing={() => setSubmittedSearch(search.trim())} />
    </SearchFilterBar>
    <QueryState {...query} />
    {query.data && (query.data.length
      ? query.data.map(product => <PetCareCard key={product.id}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <PetImage uri={product.imageUrl} size={64} />
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <AppText variant="subtitle" numberOfLines={2}>{product.name}</AppText>
            <AppText muted numberOfLines={2}>{product.category ?? product.description ?? 'Sin categoría'}</AppText>
            <AppText>{money(product.priceCents)}</AppText>
            <AppText variant="caption" muted>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}</AppText>
          </View>
        </View>
      </PetCareCard>)
      : <PetCareEmptyState title="No hay productos" message="No encontramos productos para esta búsqueda." />)}
  </PetCareScreen>;
}
