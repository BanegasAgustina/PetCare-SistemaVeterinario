// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AdminPageHeading } from '../../components/admin/AdminPageHeading';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/forms/AppInput';
import { AppSelectField } from '../../components/forms/AppSelectField';
import { ImageUploadField } from '../../components/forms/ImageUploadField';
import { AppButton } from '../../components/ui/AppButton';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { AppModal } from '../../components/ui/AppModal';
import { CompactPagination } from '../../components/ui/CompactPagination';
import { AdminListToolbar } from '../../components/admin/AdminListToolbar';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { PetCareCard, PetCareEmptyState, PetImage, QueryState, money, ResponsiveGrid } from '../../components/client/PetCareUI';
import { SelectionRow } from '../../components/ui/SelectionRow';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useFeedback } from '../../contexts/FeedbackContext';
import { AdminFormActions, AdminFormSection } from '../../components/admin/AdminFormLayout';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { ApiError } from '../../services/api';

// Tipo Product: define la forma o las opciones válidas de los datos usados por este módulo.
type Product = { id: string; name: string; description: string | null; imageUrl: string | null; categoryId: string | null; category: string | null; priceCents: number; stock: number; physicalStock: number; reservedStock: number; stockMinimum:number; isActive: boolean };
// Tipo Page: define la forma o las opciones válidas de los datos usados por este módulo.
type Page = { items: Product[]; page: number; total: number; hasMore: boolean };
// Tipo StockHistory: define la forma o las opciones válidas de los datos usados por este módulo.
type StockHistory={product:{id:string;name:string;stock:number;stockMinimum:number;reservedStock:number};items:{id:string;quantityBefore:number;quantityAfter:number;quantityDelta:number;reason:string;createdAt:string;actorName:string}[]};
// Tipo ProductCategories: define la forma o las opciones válidas de los datos usados por este módulo.
type ProductCategories={categories:{id:string;name:string}[]};
// Configuración emptyValues: reúne valores o reglas que consume el resto del módulo.
const emptyValues = { name: '', description: '', imageUrl: '', categoryId: '', price: '', stock: '', stockMinimum:'0',stockReason:'',isActive: true };

// Función AdminProducts: concentra la lógica dentro de este módulo.
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
  const {width}=useWindowDimensions();
  const desktopTable=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const desktopGrid=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);
  const load = useCallback(() => request<Page>('/admin/products/query',{method:'POST',body:{ search: submittedSearch, ...filters, page: String(page) }}), [request, submittedSearch, filters, page]);
  const query = useClientQuery(load);
  const loadHistory=useCallback(()=>historyProductId?request<StockHistory>(`/admin/products/${encodeURIComponent(historyProductId)}/stock-movements`,{method:'POST',body:{}}):Promise.resolve(null),[request,historyProductId]);
  const stockHistory=useClientQuery(loadHistory);
  // Función updateFilter: agrupa una operación que este módulo puede ejecutar o reutilizar.
const updateFilter = (key: keyof typeof filters, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  // Función changeField: actualiza o guarda información dentro de este módulo.
function changeField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues(current => ({ ...current, [key]: value }));
    setErrors(current => { const next = { ...current }; delete next[key as keyof typeof errors]; return next; });
  }

  // Función openEditor: concentra la lógica dentro de este módulo.
function openEditor(product: Product) {
    setDetail(null);
    setEditing(product);
    setValues({ name: product.name, description: product.description ?? '', imageUrl: product.imageUrl ?? '', categoryId: product.categoryId ?? '', price: (product.priceCents / 100).toFixed(2), stock: String(product.physicalStock),stockMinimum:String(product.stockMinimum),stockReason:'', isActive: product.isActive });
    setErrors({});
  }
  // Función review: concentra la lógica dentro de este módulo.
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
    setErrors(next);
    if (!Object.keys(next).length) setBody(data);
  }
  const activeCount = (filters.status !== 'all' ? 1 : 0) + (filters.stock !== 'all' ? 1 : 0) + (filters.categoryId ? 1 : 0);
  const hasRestrictiveFilters = Boolean(submittedSearch) || filters.status !== 'all' || filters.stock !== 'all' || Boolean(filters.categoryId);
  return <ScreenContainer wide>
    <AdminPageHeading title="Productos y stock"/>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {auth.hasPermission('products.update') && auth.hasPermission('products.create') && auth.hasPermission('products.update_price') && auth.hasPermission('products.update_stock') && <AppButton compact label="Crear producto" onPress={() => router.push('/admin/catalog/products')}/>}
      {auth.hasPermission('categories.manage') && <AppButton compact variant="secondary" label="Gestionar categorías" onPress={() => router.push('/admin/catalog/categories')}/>}
    </View>
    <AdminListToolbar search={<AppInput label="Buscar producto" placeholder="Nombre del producto" value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={() => { setSubmittedSearch(search.trim()); setPage(1); }}/>}
      sort={<AppSelectField label="Ordenar productos" value={filters.sort} options={[{id:'name',name:'Nombre A–Z'},{id:'price_low',name:'Precio: menor primero'},{id:'price_high',name:'Precio: mayor primero'},{id:'stock_low',name:'Stock: menor primero'},{id:'stock_high',name:'Stock: mayor primero'}]} onChange={value=>updateFilter('sort',value)}/>}
      filters={<>
        <AppText variant="subtitle">Inventario</AppText>
        {[['all', 'Cualquier stock'], ['available', 'Disponible'], ['low','Stock bajo'], ['out', 'Sin stock']].map(([value, label]) => <SelectionRow radio key={value} label={label} checked={filters.stock === value} onPress={() => updateFilter('stock', value)}/>)}
        <AppText variant="subtitle">Estado</AppText>
        {[['all', 'Todos'], ['active', 'Activos'], ['inactive', 'Inactivos']].map(([value, label]) => <SelectionRow radio key={value} label={label} checked={filters.status === value} onPress={() => updateFilter('status', value)}/>)}
        <AppSelectField label="Categoría" optional emptyLabel="Todas" value={filters.categoryId} options={catalog.data?.categories??[]} onChange={value=>updateFilter('categoryId',value)}/>
      </>}
      filterCount={activeCount} onApply={() => setPage(1)} onClear={() => { setFilters({ status: 'all', stock: 'all', sort: 'name', categoryId: '' }); setPage(1); }}/>
    
<QueryState {...catalog}/>
<QueryState {...query}/>
    {query.data && <>
      <AppText muted>{query.data.total} productos</AppText>
      {!query.data.items.length && <PetCareEmptyState title={hasRestrictiveFilters ? 'No hay productos para estos filtros' : 'Todavía no hay productos'} message={hasRestrictiveFilters ? 'Probá con otro nombre o limpiá los filtros para revisar el inventario.' : 'Los productos que cargues aparecerán en este inventario.'} action={hasRestrictiveFilters ? () => { setSearch(''); setSubmittedSearch(''); setFilters({ status: 'all', stock: 'all', sort: 'name', categoryId: '' }); setPage(1); } : undefined} label={hasRestrictiveFilters ? 'Limpiar búsqueda y filtros' : undefined} />}
      {desktopTable?<AdminDataTable rows={query.data.items} rowKey={product=>product.id} columns={[
        {key:'product',label:'Producto',flex:1.5,minWidth:150,render:product=><View style={{flexDirection:'row',alignItems:'center',gap:8}}><PetImage uri={product.imageUrl} size={34}/><View style={{flex:1,minWidth:0}}><AppText numberOfLines={2} style={{fontWeight:'700'}}>{product.name}</AppText><AppText variant="caption" muted numberOfLines={1}>{product.category??'Sin categoría'}</AppText></View></View>},
        {key:'price',label:'Precio',flex:.7,minWidth:85,render:product=><AppText numberOfLines={1}>{money(product.priceCents)}</AppText>},
        {key:'stock',label:'Stock disponible',flex:.8,minWidth:85,render:product=><AppText numberOfLines={1}>{product.stock>0?String(product.stock):'Sin stock'}</AppText>},
        {key:'status',label:'Estado',flex:.65,minWidth:70,render:product=><AppText variant="caption" muted>{product.isActive?'Activo':'Inactivo'}</AppText>},
        {key:'actions',label:'Acciones',flex:1,minWidth:145,align:'right',render:product=><View style={{flexDirection:'row',justifyContent:'flex-end',gap:6,flexWrap:'wrap'}}><AppButton compact variant="secondary" label="Detalle" onPress={()=>setDetail(product)}/><AppButton compact label="Editar" onPress={()=>openEditor(product)}/></View>},
      ]}/> : desktopGrid?<ResponsiveGrid>{query.data.items.map(product => <PetCareCard key={product.id}>
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
        <ImageUploadField label="Imagen del producto" kind="product" aspect={[1,1]} value={values.imageUrl||null} disabled={!auth.hasPermission('products.update')} error={errors.imageUrl} onChange={value=>changeField('imageUrl',value??'')}/><AppInput label="URL HTTPS alternativa (opcional)" value={values.imageUrl!==editing.imageUrl?values.imageUrl:''} error={errors.imageUrl} editable={auth.hasPermission('products.update')} onChangeText={value=>changeField('imageUrl', value)}/>
        {auth.hasPermission('products.update') && <AppSelectField label="Categoría" optional value={values.categoryId} options={catalog.data?.categories??[]} onChange={value=>changeField('categoryId',value)}/>}
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

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ grid: { gap: 10 }, productRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, productInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }, productText: { flex: 1, minWidth: 0, gap: 4 }, editButton: { width: 38, height: 38, borderRadius: 6, backgroundColor: '#def1ea', alignItems: 'center', justifyContent: 'center' }, cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#c6ded4', paddingTop: 8 } });
