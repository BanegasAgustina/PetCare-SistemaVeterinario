import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AdminPageHeading } from '../../components/admin/AdminPageHeading';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/forms/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { AppModal } from '../../components/ui/AppModal';
import { FormNotice } from '../../components/ui/FormNotice';
import { FilterDisclosure } from '../../components/ui/FilterDisclosure';
import { CompactPagination } from '../../components/ui/CompactPagination';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { PetCareCard, PetCareEmptyState, PetImage, QueryState, money, ResponsiveGrid } from '../../components/client/PetCareUI';
import { SelectionRow } from '../../components/ui/SelectionRow';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useFeedback } from '../../contexts/FeedbackContext';
import { AdminFormActions, AdminFormSection } from '../../components/admin/AdminFormLayout';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { ApiError } from '../../services/api';

type Product = { id: string; name: string; description: string | null; imageUrl: string | null; categoryId: string | null; category: string | null; priceCents: number; stock: number; physicalStock: number; reservedStock: number; stockMinimum:number; isActive: boolean };
type Page = { items: Product[]; page: number; total: number; hasMore: boolean };
type StockHistory={product:{id:string;name:string;stock:number;stockMinimum:number;reservedStock:number};items:{id:string;quantityBefore:number;quantityAfter:number;quantityDelta:number;reason:string;createdAt:string;actorName:string}[]};
type ProductCategories={categories:{id:string;name:string}[]};
const emptyValues = { name: '', description: '', imageUrl: '', categoryId: '', price: '', stock: '', stockMinimum:'0',stockReason:'',isActive: true };

export default function AdminProducts() {
  const routeParams=useLocalSearchParams<{stock?:string|string[]}>();const requestedStock=Array.isArray(routeParams.stock)?routeParams.stock[0]??'all':routeParams.stock??'all';
  const auth = useAuth();
  const { request } = auth;
  const { showToast } = useFeedback();
  const loadCategories=useCallback(()=>request<ProductCategories>('/admin/products/catalog',{method:'POST',body:{}}),[request]);
  const catalog = useClientQuery(loadCategories);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', stock: requestedStock, sort: 'name', categoryId: '' });
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Product | null>(null);
  const [historyProductId,setHistoryProductId]=useState<string|null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<{ name?: string; imageUrl?: string; price?: string; stock?: string;stockMinimum?:string;stockReason?:string }>({});
  const [body, setBody] = useState<Record<string, unknown> | null>(null);
  const [photo,setPhoto]=useState<{uri:string;base64:string}|null>(null);
  const [photoError,setPhotoError]=useState<string|null>(null);
  const {width}=useWindowDimensions();
  const desktopGrid=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);
  const load = useCallback(() => request<Page>('/admin/products/query',{method:'POST',body:{ search: submittedSearch, ...filters, page: String(page) }}), [request, submittedSearch, filters, page]);
  const query = useClientQuery(load);
  const loadHistory=useCallback(()=>historyProductId?request<StockHistory>(`/admin/products/${encodeURIComponent(historyProductId)}/stock-movements`,{method:'POST',body:{}}):Promise.resolve(null),[request,historyProductId]);
  const stockHistory=useClientQuery(loadHistory);
  const updateFilter = (key: keyof typeof filters, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  function changeField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues(current => ({ ...current, [key]: value }));
    setErrors(current => { const next = { ...current }; delete next[key as keyof typeof errors]; return next; });
  }

  function openEditor(product: Product) {
    setDetail(null);
    setEditing(product);
    setPhoto(null);setPhotoError(null);
    setValues({ name: product.name, description: product.description ?? '', imageUrl: product.imageUrl ?? '', categoryId: product.categoryId ?? '', price: (product.priceCents / 100).toFixed(2), stock: String(product.physicalStock),stockMinimum:String(product.stockMinimum),stockReason:'', isActive: product.isActive });
    setErrors({});
  }
  function review() {
    if (!editing) return;
    const next: typeof errors = {};
    const data: Record<string, unknown> = {};
    if (auth.hasPermission('products.update')) {
      if (!values.name.trim() || values.name.trim().length > 200) next.name = 'Ingresá un nombre de hasta 200 caracteres.';
      if (values.imageUrl!==editing.imageUrl&&values.imageUrl.trim() && !/^https:\/\//i.test(values.imageUrl.trim())) next.imageUrl = 'La imagen requiere una URL HTTPS.';
      data.name = values.name.trim(); data.description = values.description.trim() || null;if(values.imageUrl!==editing.imageUrl)data.imageUrl = values.imageUrl.trim() || null; data.categoryId = values.categoryId || null; data.isActive = values.isActive;
    }
    if (auth.hasPermission('products.update_price')) {
      if (!/^\d+(\.\d{1,2})?$/.test(values.price) || Number(values.price) > 1000000) next.price = 'Ingresá un precio válido con hasta dos decimales.';
      else data.priceCents = Math.round(Number(values.price) * 100);
    }
    if (auth.hasPermission('products.update_stock')) {
      if (!/^\d+$/.test(values.stock) || Number(values.stock) > 4294967295) next.stock = 'Ingresá un stock entero válido, mayor o igual a cero.';
      else data.stock = Number(values.stock);
      if (!/^\d+$/.test(values.stockMinimum) || Number(values.stockMinimum) > 4294967295) next.stockMinimum = 'Ingresá un mínimo entero válido.';
      else data.stockMinimum = Number(values.stockMinimum);
      if (Number(values.stock) !== editing.physicalStock && values.stockReason.trim().length < 3) next.stockReason = 'Indicá un motivo de al menos 3 caracteres para el ajuste.';
      else if(Number(values.stock)!==editing.physicalStock)data.stockReason=values.stockReason.trim();
    }
    if(photo)data.photoBase64=photo.base64;
    setErrors(next);
    if (!Object.keys(next).length) setBody(data);
  }
  async function choosePhoto(){setPhotoError(null);try{if(Platform.OS!=='web'){const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted){setPhotoError('Permití el acceso a la galería para elegir una imagen.');return;}}const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.8,base64:true});if(result.canceled)return;const asset=result.assets[0];if(!asset?.base64||asset.base64.length>7_000_000||(asset.fileSize??0)>5*1024*1024||asset.width*asset.height>25_000_000){setPhotoError('Elegí una imagen de hasta 5 MB y 25 megapíxeles.');return;}setPhoto({uri:asset.uri,base64:asset.base64});setValues(current=>({...current,imageUrl:editing?.imageUrl??''}));}catch{setPhotoError('No pudimos abrir la imagen. Intentá elegir otra.');}}

  const activeCount = (filters.status !== 'all' ? 1 : 0) + (filters.stock !== 'all' ? 1 : 0) + (filters.sort !== 'name' ? 1 : 0) + (filters.categoryId ? 1 : 0);
  const hasRestrictiveFilters = Boolean(submittedSearch) || filters.status !== 'all' || filters.stock !== 'all' || Boolean(filters.categoryId);
  return <ScreenContainer wide>
    <AdminPageHeading title="Productos y stock"/>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {auth.hasPermission('products.update') && auth.hasPermission('products.create') && auth.hasPermission('products.update_price') && auth.hasPermission('products.update_stock') && <AppButton compact label="Crear producto" onPress={() => router.push('/admin/catalog/products')}/>}
      {auth.hasPermission('categories.manage') && <AppButton compact variant="secondary" label="Gestionar categorías" onPress={() => router.push('/admin/catalog/categories')}/>}
    </View>
    <SearchFilterBar><AppInput label="Buscar producto" placeholder="Nombre del producto" value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={() => { setSubmittedSearch(search.trim()); setPage(1); }}/>
      <FilterDisclosure fullWidth activeCount={activeCount} onApply={() => setPage(1)} onClear={() => { setFilters({ status: 'all', stock: 'all', sort: 'name', categoryId: '' }); setPage(1); }}>
        <AppText variant="subtitle">Inventario</AppText>
        {[['all', 'Cualquier stock'], ['available', 'Disponible'], ['low','Stock bajo'], ['out', 'Sin stock']].map(([value, label]) => <SelectionRow radio key={value} label={label} checked={filters.stock === value} onPress={() => updateFilter('stock', value)}/>)}
        <AppText variant="subtitle">Estado</AppText>
        {[['all', 'Todos'], ['active', 'Activos'], ['inactive', 'Inactivos']].map(([value, label]) => <SelectionRow radio key={value} label={label} checked={filters.status === value} onPress={() => updateFilter('status', value)}/>)}
        <AppText variant="subtitle">Ordenar por</AppText>
        {[['name', 'Nombre A-Z'], ['price_low', 'Precio: menor primero'], ['price_high', 'Precio: mayor primero'], ['stock_low', 'Stock: menor primero'], ['stock_high', 'Stock: mayor primero']].map(([value, label]) => <SelectionRow radio key={value} label={label} checked={filters.sort === value} onPress={() => updateFilter('sort', value)}/>)}
        <AppText variant="subtitle">Categoría</AppText><SelectionRow label="Todas" checked={!filters.categoryId} onPress={() => updateFilter('categoryId', '')}/>{catalog.data?.categories.map(category => <SelectionRow key={category.id} label={category.name} checked={filters.categoryId === category.id} onPress={() => updateFilter('categoryId', category.id)}/>)}
      </FilterDisclosure>
    </SearchFilterBar>
    <QueryState {...catalog}/><QueryState {...query}/>
    {query.data && <>
      <AppText muted>{query.data.total} productos</AppText>
      {!query.data.items.length && <PetCareEmptyState title={hasRestrictiveFilters ? 'No hay productos para estos filtros' : 'Todavía no hay productos'} message={hasRestrictiveFilters ? 'Probá con otro nombre o limpiá los filtros para revisar el inventario.' : 'Los productos que cargues aparecerán en este inventario.'} action={hasRestrictiveFilters ? () => { setSearch(''); setSubmittedSearch(''); setFilters({ status: 'all', stock: 'all', sort: 'name', categoryId: '' }); setPage(1); } : undefined} label={hasRestrictiveFilters ? 'Limpiar búsqueda y filtros' : undefined} />}
      {desktopGrid?<ResponsiveGrid>{query.data.items.map(product => <PetCareCard key={product.id}>
        <View style={styles.productRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${product.name}`} onPress={() => setDetail(product)} style={styles.productInfo}>
            <PetImage uri={product.imageUrl}/><View style={styles.productText}><AppText variant="subtitle" numberOfLines={2}>{product.name}</AppText><AppText muted>{product.category ?? 'Sin categoría'}</AppText><AppText>{money(product.priceCents)}</AppText><AppText variant="caption" muted>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}</AppText></View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${product.name}`} onPress={() => openEditor(product)} style={styles.editButton}><Ionicons name="pencil-outline" size={19} color="#146b55"/></Pressable>
        </View>
        <View style={styles.cardFooter}><AppText variant="caption" muted>{product.isActive ? 'Activo' : 'Inactivo'}</AppText><AppButton compact variant="secondary" label="Ver detalle" onPress={() => setDetail(product)}/></View>
      </PetCareCard>)}</ResponsiveGrid>:<View style={styles.grid}>{query.data.items.map(product => <PetCareCard key={product.id}>
        <View style={styles.productRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${product.name}`} onPress={() => setDetail(product)} style={styles.productInfo}>
            <PetImage uri={product.imageUrl}/><View style={styles.productText}><AppText variant="subtitle" numberOfLines={2}>{product.name}</AppText><AppText muted>{product.category ?? 'Sin categoría'}</AppText><AppText>{money(product.priceCents)}</AppText><AppText variant="caption" muted>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}</AppText></View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${product.name}`} onPress={() => openEditor(product)} style={styles.editButton}><Ionicons name="pencil-outline" size={19} color="#146b55"/></Pressable>
        </View>
        <View style={styles.cardFooter}><AppText variant="caption" muted>{product.isActive ? 'Activo' : 'Inactivo'}</AppText><AppButton compact variant="secondary" label="Ver detalle" onPress={() => setDetail(product)}/></View>
      </PetCareCard>)}</View>}
      <CompactPagination page={page} canPrevious={page > 1} canNext={query.data.hasMore} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)} summary={`${query.data.total} productos`}/>
    </>}
    <AppModal visible={Boolean(detail)} dismissible onClose={() => setDetail(null)}>
      {detail && <><PetImage uri={detail.imageUrl}/><AppText variant="title">{detail.name}</AppText><AppText muted>{detail.category ?? 'Sin categoría'}</AppText><AppText variant="subtitle">{money(detail.priceCents)}</AppText><AppText>{detail.description || 'Sin descripción.'}</AppText><AppText>{detail.stock > 0 ? `${detail.stock} unidades disponibles` : 'Sin stock disponible'}</AppText>{detail.reservedStock > 0 && <AppText muted>{detail.reservedStock} unidades reservadas</AppText>}<AppText variant="caption" muted>Stock mínimo: {detail.stockMinimum}</AppText>{auth.hasPermission('products.update_stock')&&<><AppButton variant="secondary" label="Ver movimientos de stock" onPress={()=>setHistoryProductId(detail.id)}/>{historyProductId===detail.id&&<><QueryState {...stockHistory}/>{stockHistory.data?.items.map(movement=><AppText key={movement.id} variant="caption" muted>{movement.quantityDelta>0?'+':''}{movement.quantityDelta} · {movement.quantityBefore} → {movement.quantityAfter} · {movement.reason} · {movement.actorName} · {String(movement.createdAt)}</AppText>)}</>}</>}<AppText muted>{detail.isActive ? 'Producto activo' : 'Producto inactivo'}</AppText>{auth.hasPermission('products.update') || auth.hasPermission('products.update_price') || auth.hasPermission('products.update_stock') ? <AppButton label="Editar producto" onPress={() => openEditor(detail)}/> : null}</>}
    </AppModal>
    <AppModal size="wide" visible={Boolean(editing)} dismissible onClose={() => setEditing(null)}>
      {editing && <><AppText variant="title">Editar producto</AppText>
        <AdminFormSection title="Información del producto" description="Nombre, descripción e imagen que se muestran en la tienda.">
        <AppInput label="Nombre" required value={values.name} error={errors.name} maxLength={200} editable={auth.hasPermission('products.update')} onChangeText={value => changeField('name', value)}/>
        <AppInput label="Descripción" value={values.description} multiline maxLength={10000} editable={auth.hasPermission('products.update')} onChangeText={value => changeField('description', value)}/>
        <AppText variant="caption" muted>Imagen del producto</AppText><PetImage uri={photo?.uri??(values.imageUrl||editing.imageUrl)}/><AppButton variant="secondary" label={photo?'Cambiar imagen':'Elegir imagen'} disabled={!auth.hasPermission('products.update')} onPress={()=>void choosePhoto()}/>{Boolean(photo||values.imageUrl)&&<AppButton variant="secondary" label="Quitar imagen" disabled={!auth.hasPermission('products.update')} onPress={()=>{setPhoto(null);changeField('imageUrl','');}}/>}<FormNotice error message={photoError}/><AppInput label="URL HTTPS alternativa" value={values.imageUrl!==editing.imageUrl?values.imageUrl:''} error={errors.imageUrl} editable={auth.hasPermission('products.update')} onChangeText={value => {setPhoto(null);changeField('imageUrl', value);}}/>
        {auth.hasPermission('products.update') && <><AppText variant="caption" muted>Categoría</AppText><SelectionRow label="Sin categoría" radio checked={!values.categoryId} onPress={() => changeField('categoryId', '')}/>{catalog.data?.categories.map(category => <SelectionRow key={category.id} label={category.name} radio checked={values.categoryId === category.id} onPress={() => changeField('categoryId', category.id)}/>)}</>}
        </AdminFormSection>
        <AdminFormSection title="Precio y disponibilidad" description="El precio se ingresa en pesos argentinos. El stock físico incluye las unidades reservadas.">
        <AppInput label="Precio de venta (ARS)" prefix="$" placeholder="0,00" value={values.price} error={errors.price} keyboardType="decimal-pad" editable={auth.hasPermission('products.update_price')} onChangeText={value => changeField('price', value.replace(',', '.'))}/>
        <AppInput label="Stock físico" value={values.stock} error={errors.stock} keyboardType="number-pad" editable={auth.hasPermission('products.update_stock')} onChangeText={value => changeField('stock', value)}/>
        <AppInput label="Stock mínimo" value={values.stockMinimum} error={errors.stockMinimum} keyboardType="number-pad" editable={auth.hasPermission('products.update_stock')} onChangeText={value => changeField('stockMinimum', value)}/>
        {editing&&values.stock!==String(editing.physicalStock)&&<AppInput label="Motivo del ajuste de stock" value={values.stockReason} error={errors.stockReason} maxLength={250} editable={auth.hasPermission('products.update_stock')} onChangeText={stockReason=>changeField('stockReason', stockReason)}/>}
        <SelectionRow label="Producto activo" checked={values.isActive} disabled={!auth.hasPermission('products.update')} onPress={() => changeField('isActive', !values.isActive)}/>
        </AdminFormSection>
        <AdminFormActions><AppButton label="Revisar y guardar" onPress={review}/><AppButton variant="secondary" label="Cancelar" onPress={() => setEditing(null)}/></AdminFormActions>
      </>}
    </AppModal>
    <ConfirmModal visible={body !== null} title="Guardar cambios de producto" message="Los cambios se guardarán en el inventario real de PetCare." onCancel={() => setBody(null)} onConfirm={async () => { if (!editing || !body) return; try { await request(`/admin/products/${editing.id}`, { method: 'PATCH', body }); setBody(null); setEditing(null); query.reload(); showToast('Producto actualizado', 'success'); } catch (failure) { if (failure instanceof ApiError && failure.fieldErrors.length) { const fields: Record<string, keyof typeof errors> = { name: 'name', imageUrl: 'imageUrl', priceCents: 'price', stock: 'stock', stockMinimum: 'stockMinimum', stockReason: 'stockReason' }; const next: typeof errors = {}; for (const item of failure.fieldErrors) { const field = fields[item.field]; if (field) next[field] = item.message; } if (Object.keys(next).length) { setErrors(current => ({ ...current, ...next })); setBody(null); return; } } throw failure; } }}/>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ grid: { gap: 10 }, productRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, productInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }, productText: { flex: 1, minWidth: 0, gap: 4 }, editButton: { width: 38, height: 38, borderRadius: 6, backgroundColor: '#def1ea', alignItems: 'center', justifyContent: 'center' }, cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#c6ded4', paddingTop: 8 } });
