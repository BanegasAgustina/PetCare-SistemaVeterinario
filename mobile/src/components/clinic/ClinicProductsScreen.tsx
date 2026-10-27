/** Shared read-only clinic product catalog for roles allowed by the route and backend grant. */
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, PetImage, QueryState, money } from '../client/PetCareUI';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { FilterDisclosure } from '../ui/FilterDisclosure';
import { SelectionRow } from '../ui/SelectionRow';
import { AppModal } from '../ui/AppModal';
import { AppInput } from '../forms/AppInput';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import type { Product } from '../../types/client';

export function ClinicProductsScreen() {
  const clinic = useClinic();
  const { hasPermission, user } = useAuth();
  const canRecommend=user?.role==='VETERINARIAN'&&hasPermission('recommendations.create')&&hasPermission('products.view')&&hasPermission('pets.view_information')&&(hasPermission('pets.view_all')||hasPermission('pets.view_assigned'));
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const catalog = useClientQuery(clinic.catalog);
  const query = useClientQuery(useCallback(() => clinic.products(submittedSearch, categoryId), [clinic, submittedSearch, categoryId]));
  const patientSelection = useClientQuery(useCallback(() => selectedProduct&&canRecommend ? clinic.patients() : Promise.resolve(null), [clinic, selectedProduct, canRecommend]));

  return <PetCareScreen wide>
    <PetCareHeader title="Productos" subtitle="Catálogo de PetCare" back />
    <SearchFilterBar>
      <AppInput icon="search-outline" label="Buscar productos" placeholder="Nombre del producto" value={search} returnKeyType="search" onChangeText={setSearch} onSubmitEditing={() => setSubmittedSearch(search.trim())} />
      <FilterDisclosure fullWidth activeCount={categoryId ? 1 : 0} onApply={() => undefined} onClear={() => setCategoryId('')}>
        <AppText variant="subtitle">Categoría</AppText>
        <SelectionRow label="Todas las categorías" checked={!categoryId} onPress={() => setCategoryId('')} />
        {catalog.data?.categories.map(category => <SelectionRow key={category.id} label={String(category.name)} checked={categoryId === String(category.id)} onPress={() => setCategoryId(String(category.id))} />)}
      </FilterDisclosure>
    </SearchFilterBar>
    <QueryState {...catalog} />
    <QueryState {...query} />
    {query.data && (query.data.length
      ? query.data.map(product => <PetCareCard key={product.id}>
        <PressableProduct product={product} />
        <AppButton label="Ver detalle" variant="secondary" onPress={() => setSelectedProduct(product)} />
        {canRecommend && <AppButton label="Recomendar a un paciente" onPress={() => setSelectedProduct(product)} />}
      </PetCareCard>)
      : <PetCareEmptyState title="No hay productos" message="No encontramos productos para esta búsqueda." />)}
    <AppModal size="wide" visible={Boolean(selectedProduct)} dismissible onClose={() => setSelectedProduct(null)}>
      {selectedProduct && <>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><PetImage uri={selectedProduct.imageUrl} size={72} /><View style={{ flex: 1, minWidth: 0, gap: 4 }}><AppText variant="title">{selectedProduct.name}</AppText><AppText muted>{selectedProduct.category ?? 'Sin categoría'}</AppText></View></View>
        {selectedProduct.description && <AppText>{selectedProduct.description}</AppText>}
        <AppText>{money(selectedProduct.priceCents)}</AppText>
        <AppText muted>{selectedProduct.stock > 0 ? `${selectedProduct.stock} disponibles` : 'Sin stock disponible'}</AppText>
        {canRecommend && <>
          <AppText variant="subtitle">Recomendar a un paciente autorizado</AppText>
          <QueryState {...patientSelection} />
          {patientSelection.data?.map(patient => <SelectionRow key={patient.id} label={String(patient.name)} hint={String(patient.species)} checked={false} onPress={() => { const productId = selectedProduct.id; setSelectedProduct(null); router.push({ pathname: '/vet/record' as never, params: { id: String(patient.id), kind: 'recommendations', productId } }); }} />)}
          {patientSelection.data?.length === 0 && <AppText muted>No hay pacientes autorizados disponibles para recomendar.</AppText>}
        </>}
        <AppButton label="Cerrar" variant="secondary" onPress={() => setSelectedProduct(null)} />
      </>}
    </AppModal>
  </PetCareScreen>;
}

function PressableProduct({ product }: { product: Product }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
    <PetImage uri={product.imageUrl} size={64} />
    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
      <AppText variant="subtitle" numberOfLines={2}>{product.name}</AppText>
      <AppText muted numberOfLines={2}>{product.category ?? product.description ?? 'Sin categoría'}</AppText>
      <AppText>{money(product.priceCents)}</AppText>
      <AppText variant="caption" muted>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}</AppText>
    </View>
  </View>;
}
