/** Catálogo cliente con búsqueda, filtros reales, banners derivados de promociones activas y carrito existente. */
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClient } from '../../../../hooks/useClient';
import { useClientQuery } from '../../../../hooks/useClientQuery';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { useFeedback } from '../../../../contexts/FeedbackContext';
import type { Cart, CatalogItem, Product } from '../../../../types/client';
import { PetCareScreen, PetCareHeader, PetCareEmptyState, QueryState } from '../../../../components/client/PetCareUI';
import { ProductDetailModal, PromotionCarousel, StoreProductCard } from '../../../../components/client/Storefront';
import { AppInput } from '../../../../components/forms/AppInput';
import { AppText } from '../../../../components/ui/AppText';
import { SelectionRow } from '../../../../components/ui/SelectionRow';
import { FilterDisclosure } from '../../../../components/ui/FilterDisclosure';
import { SearchFilterBar } from '../../../../components/ui/SearchFilterBar';
import { FormNotice } from '../../../../components/ui/FormNotice';
import { useTheme } from '../../../../hooks/useTheme';

type ProductSort = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export default function StoreScreen() {
  const api = useClient();
  const { showToast } = useFeedback();
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState<'' | 'MEDICINE' | 'ACCESSORY'>('');
  const [sort, setSort] = useState<ProductSort>('name-asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [promotionOnly, setPromotionOnly] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] = useState('');
  const [draftType, setDraftType] = useState<'' | 'MEDICINE' | 'ACCESSORY'>('');
  const [draftSort, setDraftSort] = useState<ProductSort>('name-asc');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftAvailableOnly, setDraftAvailableOnly] = useState(false);
  const [draftPromotionOnly, setDraftPromotionOnly] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [savingProduct, setSavingProduct] = useState<string | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState<Cart | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const columns = windowWidth < 340 ? 1 : Platform.OS === 'web' && windowWidth >= 1200 ? 4 : Platform.OS === 'web' && windowWidth >= 768 ? 3 : 2;

  const catalog = useClientQuery(api.categories);
  const cart = useClientQuery(api.cart);
  const promotions = useClientQuery(api.promotions);
  const reloadCart = cart.reload;
  const loadProducts = useCallback(async () => {
    const result = await api.products(debouncedSearch, category || undefined, productType || undefined);
    return result;
  }, [api, debouncedSearch, category, productType]);
  const query = useClientQuery(loadProducts);

  const products = useMemo(() => {
    const minCents = toPriceCents(minPrice);
    const maxCents = toPriceCents(maxPrice);
    const items = (query.data ?? []).filter(product =>
      (!availableOnly || product.stock > 0)
      && (!promotionOnly || product.priceCents < product.regularPriceCents)
      && (minCents === null || product.priceCents >= minCents)
      && (maxCents === null || product.priceCents <= maxCents),
    );
    if (sort === 'price-asc') items.sort((a, b) => a.priceCents - b.priceCents || a.name.localeCompare(b.name));
    else if (sort === 'price-desc') items.sort((a, b) => b.priceCents - a.priceCents || a.name.localeCompare(b.name));
    else if (sort === 'name-desc') items.sort((a, b) => b.name.localeCompare(a.name));
    else items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [query.data, sort, minPrice, maxPrice, availableOnly, promotionOnly]);
  const productRows = useMemo(() => Array.from({ length: Math.ceil(products.length / columns) }, (_, index) => products.slice(index * columns, (index + 1) * columns)), [products, columns]);

  const currentCart = cart.data ?? cartSnapshot;
  const cartCount = currentCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const addToCart = useCallback(async (product: Product, amount: number) => {
    if (!Number.isInteger(amount) || amount < 1 || amount > 99 || amount > product.stock) {
      const message = 'Ingresá una cantidad válida dentro del stock disponible.';
      setActionError(message);
      setModalError(message);
      return;
    }
    if (!currentCart) {
      setActionError('Estamos cargando tu carrito. Probá de nuevo en un momento.');
      return;
    }
    const existing = currentCart.items.find(item => item.id === product.id)?.quantity ?? 0;
    if (existing + amount > product.stock || existing + amount > 99) {
      const message = 'La cantidad solicitada supera el stock disponible.';
      setActionError(message);
      setModalError(message);
      return;
    }
    setSavingProduct(product.id);
    setActionError(null);
    setModalError(null);
    try {
      const updated = await api.updateCart(product.id, existing + amount);
      setCartSnapshot(updated);
      showToast('Producto agregado al carrito', 'success');
      reloadCart();
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'No se pudo agregar el producto al carrito.';
      setActionError(message);
      setModalError(message);
    } finally {
      setSavingProduct(null);
    }
  }, [api, reloadCart, currentCart, showToast]);

  const openProduct = useCallback((product: Product) => {
    setSelected(product);
    setQuantity('1');
    setModalError(null);
  }, []);

  const categoryChips: CatalogItem[] = catalog.data ?? [];
  const sortCount = sort === 'name-asc' ? 0 : 1;
  const activeFilterCount = (category ? 1 : 0) + (productType ? 1 : 0) + sortCount + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (availableOnly ? 1 : 0) + (promotionOnly ? 1 : 0);
  const applyFilters = () => {
    const minCents = toPriceCents(draftMinPrice);
    const maxCents = toPriceCents(draftMaxPrice);
    if ((draftMinPrice.trim() && minCents === null) || (draftMaxPrice.trim() && maxCents === null)) {
      setFilterError('Ingresá precios válidos, mayores o iguales a cero.');
      return false;
    }
    if (minCents !== null && maxCents !== null && minCents > maxCents) {
      setFilterError('El precio mínimo no puede superar al máximo.');
      return false;
    }
    setFilterError(null);
    setCategory(draftCategory);
    setProductType(draftType);
    setSort(draftSort);
    setMinPrice(draftMinPrice.trim());
    setMaxPrice(draftMaxPrice.trim());
    setAvailableOnly(draftAvailableOnly);
    setPromotionOnly(draftPromotionOnly);
    return true;
  };
  const clearFilters = () => {
    setFilterError(null);
    setDraftCategory(''); setCategory('');
    setDraftType(''); setProductType('');
    setDraftSort('name-asc'); setSort('name-asc');
    setDraftMinPrice(''); setMinPrice('');
    setDraftMaxPrice(''); setMaxPrice('');
    setDraftAvailableOnly(false); setAvailableOnly(false);
    setDraftPromotionOnly(false); setPromotionOnly(false);
  };

  return <PetCareScreen wide tabbed>
    <PetCareHeader title="Tienda" subtitle="Cuidado que los acompaña" right={<View style={{flexDirection:'row',gap:7}}><Pressable accessibilityRole="button" accessibilityLabel="Mis pedidos" onPress={() => router.navigate('/client/orders')} style={[styles.cartButton, { backgroundColor: colors.accent }]}><Ionicons name="receipt-outline" size={21} color={colors.primary}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Carrito, ${cartCount} artículos`} onPress={() => router.navigate('/client/store/cart')} style={[styles.cartButton, { backgroundColor: colors.accent }]}>
      <Ionicons name="cart-outline" size={23} color={colors.text} />
      {cartCount > 0 && <View style={[styles.cartBadge, { backgroundColor: colors.accent }]}><AppText variant="caption" style={[styles.cartBadgeText, { color: colors.text }]}>{cartCount > 99 ? '99+' : cartCount}</AppText></View>}
    </Pressable></View>} />

    <QueryState {...promotions} />
    {!!promotions.data?.length && <PromotionCarousel products={promotions.data} onOpen={openProduct} />}

    <View style={styles.storeControls}>
      <SearchFilterBar>
        <View style={styles.searchRow}>
          <View style={styles.searchField}><AppInput icon="search-outline" label="Buscar productos" placeholder="Buscar productos..." value={search} maxLength={200} returnKeyType="search" onChangeText={setSearch} /></View>
          {Boolean(search) && <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => setSearch('')} style={[styles.clearSearch, { backgroundColor: colors.accent }]}><Ionicons name="close" size={20} color={colors.text} /></Pressable>}
        </View>
      </SearchFilterBar>

      <SearchFilterBar>
        <FilterDisclosure fullWidth activeCount={activeFilterCount} onApply={applyFilters} onClear={clearFilters}>
          <AppText variant="subtitle">Categoría</AppText>
          <SelectionRow radio label="Todas las categorías" checked={!draftCategory} onPress={() => setDraftCategory('')} />
          {categoryChips.map(item => <SelectionRow radio key={item.id} label={item.name} checked={draftCategory === item.id} onPress={() => setDraftCategory(item.id)} />)}
          <AppText variant="subtitle">Tipo de producto</AppText>
          <SelectionRow radio label="Todos" checked={!draftType} onPress={() => setDraftType('')} />
          <SelectionRow radio label="Medicamentos" checked={draftType === 'MEDICINE'} onPress={() => setDraftType('MEDICINE')} />
          <SelectionRow radio label="Accesorios" checked={draftType === 'ACCESSORY'} onPress={() => setDraftType('ACCESSORY')} />
          <AppText variant="subtitle">Ordenar por</AppText>
          <SelectionRow radio label="Nombre A-Z" checked={draftSort === 'name-asc'} onPress={() => setDraftSort('name-asc')} />
          <SelectionRow radio label="Nombre Z-A" checked={draftSort === 'name-desc'} onPress={() => setDraftSort('name-desc')} />
          <SelectionRow radio label="Precio: menor a mayor" checked={draftSort === 'price-asc'} onPress={() => setDraftSort('price-asc')} />
          <SelectionRow radio label="Precio: mayor a menor" checked={draftSort === 'price-desc'} onPress={() => setDraftSort('price-desc')} />
          <View style={styles.priceRange}>
            <View style={styles.priceInput}><AppInput compact label="Precio mínimo (ARS)" keyboardType="decimal-pad" value={draftMinPrice} onChangeText={setDraftMinPrice} placeholder="Sin mínimo" maxLength={12} /></View>
            <View style={styles.priceInput}><AppInput compact label="Precio máximo (ARS)" keyboardType="decimal-pad" value={draftMaxPrice} onChangeText={setDraftMaxPrice} placeholder="Sin máximo" maxLength={12} /></View>
          </View>
          <SelectionRow checked={draftAvailableOnly} label="Solo productos disponibles" onPress={() => setDraftAvailableOnly(value => !value)} />
          <SelectionRow checked={draftPromotionOnly} label="Solo productos en promoción" onPress={() => setDraftPromotionOnly(value => !value)} />
        </FilterDisclosure>
      </SearchFilterBar>
      <FormNotice error message={filterError} />

      {catalog.data && <View style={styles.categorySection}>
        <View style={styles.categoryHeading}><AppText variant="subtitle">Categorías</AppText><Pressable accessibilityRole="button" onPress={() => { setCategory(''); setDraftCategory(''); }}><AppText variant="caption" style={{ color: colors.primary }}>Ver todas</AppText></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          <CategoryTile name="Todas" icon="grid-outline" selected={!category} onPress={() => { setCategory(''); setDraftCategory(''); }} />
          {categoryChips.map(item => <CategoryTile key={item.id} name={item.name} icon={categoryIcon(item.name)} selected={category === item.id} onPress={() => { setCategory(item.id); setDraftCategory(item.id); }} />)}
        </ScrollView>
      </View>}
    </View>

    <FormNotice error message={actionError} />
    <QueryState {...catalog} />
    <QueryState {...cart} />
    <QueryState {...query} />
    {query.data && <AppText variant="subtitle">Productos disponibles</AppText>}
    {query.data && (products.length ? <View style={styles.productGrid}>
      {productRows.map((row, index) => <View key={`product-row-${index}`} style={styles.productRow}>
        {row.map(product => <View key={product.id} style={styles.productCell}><StoreProductCard product={product} adding={savingProduct === product.id} cartReady={Boolean(currentCart)} onOpen={() => openProduct(product)} onAdd={() => void addToCart(product, 1)} /></View>)}
        {row.length < columns && <View style={styles.productCell} />}
      </View>)}
    </View> : <PetCareEmptyState title="No hay productos disponibles" message="Probá cambiar la búsqueda o los filtros." icon="bag-handle-outline" />)}

    <View style={styles.bottomScrollSpace} />
    <ProductDetailModal product={selected} quantity={quantity} inCart={selected ? currentCart?.items.find(item => item.id === selected.id)?.quantity ?? 0 : 0} error={modalError} saving={Boolean(selected && savingProduct === selected.id)} cartReady={Boolean(currentCart)} onQuantityChange={setQuantity} onClose={() => { setSelected(null); setModalError(null); }} onAdd={() => { if (selected) void addToCart(selected, Number(quantity)); }} />
  </PetCareScreen>;
}

const styles = StyleSheet.create({
  storeControls: { width: '100%', gap: 12 },
  cartButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -4, right: -4, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 10, lineHeight: 13, fontWeight: '700' },
  searchRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, searchField: { flex: 1, minWidth: 0 }, clearSearch: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  categorySection: { width: '100%', gap: 8 },
  categoryHeading: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryList: { gap: 9, paddingVertical: 2 },
  categoryTile: { width: 70, alignItems: 'center', gap: 5 },
  categoryIconFrame: { width: 54, height: 54, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  categoryName: { maxWidth: 70, textAlign: 'center', fontSize: 11, lineHeight: 14 },
  priceRange: { flexDirection: 'row', gap: 10 }, priceInput: { flex: 1, minWidth: 0 },
  productGrid: { width: '100%', gap: 10 },
  productRow: { width: '100%', flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  productCell: { flex: 1, minWidth: 0, alignSelf: 'stretch' },
  bottomScrollSpace: { height: 24 },
});

function CategoryTile({ name, icon, selected, onPress }: { name: string; icon: ComponentProps<typeof Ionicons>['name']; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={styles.categoryTile}>
    <View style={[styles.categoryIconFrame, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
      <Ionicons name={icon} size={23} color={selected ? colors.onPrimary : colors.primary} />
    </View>
    <AppText numberOfLines={1} variant="caption" style={styles.categoryName}>{name}</AppText>
  </Pressable>;
}

function categoryIcon(name: string): ComponentProps<typeof Ionicons>['name'] {
  const normalized = name.toLocaleLowerCase('es');
  if (/alimento|comida|nutric/.test(normalized)) return 'restaurant-outline';
  if (/juguete|juego/.test(normalized)) return 'baseball-outline';
  if (/higiene|baño|shampoo|limpieza/.test(normalized)) return 'water-outline';
  if (/salud|medic|farmac/.test(normalized)) return 'medkit-outline';
  if (/accesorio|collar|correa/.test(normalized)) return 'cut-outline';
  return 'paw-outline';
}

function toPriceCents(value: string): number | null {
  if (!value.trim()) return null;
  const amount = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100) return null;
  return Math.round(amount * 100);
}
