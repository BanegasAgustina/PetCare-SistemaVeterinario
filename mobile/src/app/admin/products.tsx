/**
 * Pantalla de productos para ADMIN/SUPER_ADMIN con los permisos exigidos. Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { Switch } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/forms/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PetCareCard,QueryState,money } from '../../components/client/PetCareUI';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useFeedback } from '../../contexts/FeedbackContext';
type Product={id:string;name:string;description:string|null;priceCents:number;stock:number;isActive:boolean};
type Page={items:Product[];page:number;total:number;hasMore:boolean};
export default function AdminProducts(){const auth=useAuth();const {request}=auth;const {showToast}=useFeedback();const [search,setSearch]=useState('');const [filter,setFilter]=useState('');const [page,setPage]=useState(1);
  const [editing,setEditing]=useState<Product|null>(null);const [values,setValues]=useState({name:'',description:'',price:'',stock:'',isActive:true});const [errors,setErrors]=useState<{name?:string;price?:string;stock?:string}>({});const [body,setBody]=useState<Record<string,unknown>|null>(null);
  const load=useCallback(()=>request<Page>(`/admin/products?${new URLSearchParams({search:filter,page:String(page)})}`),[request,filter,page]);const query=useClientQuery(load);
  function review(){if(!editing)return;const next:typeof errors={};const data:Record<string,unknown>={};
    if(auth.hasPermission('products.update')){if(!values.name.trim()||values.name.trim().length>200)next.name='Ingresá un nombre de hasta 200 caracteres.';data.name=values.name.trim();data.description=values.description.trim()||null;data.isActive=values.isActive;}
    if(auth.hasPermission('products.update_price')){if(!/^\d+(\.\d{1,2})?$/.test(values.price)||Number(values.price)>1000000)next.price='Ingresá un precio válido con hasta dos decimales.';else data.priceCents=Math.round(Number(values.price)*100);}
    if(auth.hasPermission('products.update_stock')){if(!/^\d+$/.test(values.stock)||Number(values.stock)>4294967295)next.stock='Ingresá un stock entero válido, mayor o igual a cero.';else data.stock=Number(values.stock);}
    setErrors(next);if(!Object.keys(next).length)setBody(data);
  }
  return <ScreenContainer keyboardAvoiding><AppButton variant="secondary" label="Volver a Gestión" onPress={()=>router.replace('/admin')}/><AppText variant="title">Productos y stock</AppText><AppInput label="Buscar producto" value={search} onChangeText={setSearch}/><AppButton label="Buscar" variant="secondary" onPress={()=>{setFilter(search.trim());setPage(1);}}/><QueryState {...query}/>
    {query.data&&<><AppText muted>{query.data.total} productos · Página {query.data.page}</AppText>{!query.data.items.length&&<AppText muted>No hay productos para esta consulta.</AppText>}
      {query.data.items.map(product=><PetCareCard key={product.id}><AppText variant="subtitle">{product.name}</AppText><AppText>{money(product.priceCents)} · Stock {product.stock}</AppText><AppText muted>{product.isActive?'Activo':'Inactivo'}</AppText><AppButton variant="secondary" label="Editar" onPress={()=>{setEditing(product);setValues({name:product.name,description:product.description??'',price:(product.priceCents/100).toFixed(2),stock:String(product.stock),isActive:product.isActive});setErrors({});}}/></PetCareCard>)}
      <AppButton variant="secondary" label="Página anterior" disabled={page===1} onPress={()=>setPage(p=>p-1)}/><AppButton variant="secondary" label="Página siguiente" disabled={!query.data.hasMore} onPress={()=>setPage(p=>p+1)}/>
    </>}
    {editing&&<PetCareCard><AppText variant="subtitle">Editar {editing.name}</AppText>
      <AppInput label="Nombre" value={values.name} error={errors.name} maxLength={200} editable={auth.hasPermission('products.update')} onChangeText={v=>setValues(s=>({...s,name:v}))}/>
      <AppInput label="Descripción" value={values.description} multiline maxLength={10000} editable={auth.hasPermission('products.update')} onChangeText={v=>setValues(s=>({...s,description:v}))}/>
      <AppText>Producto activo</AppText><Switch accessibilityLabel="Producto activo" value={values.isActive} disabled={!auth.hasPermission('products.update')} onValueChange={v=>setValues(s=>({...s,isActive:v}))}/>
      <AppInput label="Precio en pesos" value={values.price} error={errors.price} keyboardType="decimal-pad" editable={auth.hasPermission('products.update_price')} onChangeText={v=>setValues(s=>({...s,price:v.replace(',','.')}))}/>
      <AppInput label="Stock" value={values.stock} error={errors.stock} keyboardType="number-pad" editable={auth.hasPermission('products.update_stock')} onChangeText={v=>setValues(s=>({...s,stock:v}))}/>
      <AppButton label="Revisar y guardar" onPress={review}/><AppButton variant="secondary" label="Cancelar edición" onPress={()=>setEditing(null)}/>
    </PetCareCard>}
    <ConfirmModal visible={body!==null} title="Guardar cambios de producto" message="Los datos se guardarán en MySQL y actualizarán la tienda real de PetCare." onCancel={()=>setBody(null)} onConfirm={async()=>{if(!editing||!body)return;await request(`/admin/products/${editing.id}`,{method:'PATCH',body});setBody(null);setEditing(null);query.reload();showToast('Producto actualizado','success');}}/>
  </ScreenContainer>;
}
