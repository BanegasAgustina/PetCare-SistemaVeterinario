/**
 * Gestiona el catálogo indicado por kind mediante /clinic/admin. Obtiene entradas reales y envía formularios; el backend limita entidades y comprueba el permiso de cada catálogo.
 */
import { useCallback,useRef,useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useClinic } from '../../hooks/useClinic';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,PetImage,QueryState } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { FormNotice } from '../ui/FormNotice';
import { SelectionRow } from '../ui/SelectionRow';
import { CompactPagination } from '../ui/CompactPagination';
import { AppModal } from '../ui/AppModal';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { clinicInstant,clinicDateTime } from '../../utils/clinic-date';
import type { ClinicRow } from '../../types/clinic';
type Field={key:string;label:string;type:'text'|'number'|'bool'|'select'|'date';catalog?:string;optional?:boolean;permission?:string};
// Metadatos del formulario: no son catálogos funcionales ni conceden permisos.
const forms:Record<string,{title:string;permission:string;fields:Field[]}>={
 services:{title:'Servicios',permission:'services.manage',fields:[{key:'name',label:'Nombre',type:'text'},{key:'description',label:'Descripción',type:'text',optional:true},{key:'typeId',label:'Tipo profesional',type:'select',catalog:'types'},{key:'specialtyId',label:'Especialidad requerida',type:'select',catalog:'specialties',optional:true},{key:'durationMinutes',label:'Duración en minutos',type:'number'},{key:'priceCents',label:'Precio informativo en centavos',type:'number',optional:true},{key:'requirements',label:'Requisitos',type:'text',optional:true},{key:'isActive',label:'Activo',type:'bool'}]},
 categories:{title:'Categorías',permission:'categories.manage',fields:[{key:'name',label:'Nombre',type:'text'},{key:'isActive',label:'Activa',type:'bool'}]},
 products:{title:'Productos y stock',permission:'products.update',fields:[{key:'name',label:'Nombre',type:'text'},{key:'description',label:'Descripción',type:'text',optional:true},{key:'categoryId',label:'Categoría',type:'select',catalog:'categories',optional:true},{key:'imageUrl',label:'URL HTTPS de imagen del producto',type:'text',optional:true},{key:'priceCents',label:'Precio informativo en centavos',type:'number',permission:'products.update_price'},{key:'stock',label:'Stock físico',type:'number',permission:'products.update_stock'},{key:'speciesId',label:'Especie aplicable',type:'select',catalog:'species',optional:true},{key:'requiresPrescription',label:'Requiere receta vigente',type:'bool'},{key:'isFeatured',label:'Destacado',type:'bool'},{key:'isActive',label:'Activo',type:'bool'}]},
 promotions:{title:'Promociones informativas',permission:'promotions.manage',fields:[{key:'name',label:'Nombre',type:'text'},{key:'productId',label:'Producto',type:'select',catalog:'products'},{key:'priceCents',label:'Precio informativo en centavos',type:'number'},{key:'startsAt',label:'Inicio DD/MM/AAAA HH:mm',type:'date'},{key:'endsAt',label:'Fin DD/MM/AAAA HH:mm',type:'date'},{key:'isActive',label:'Activa',type:'bool'}]},
 specialties:{title:'Especialidades',permission:'specialties.manage',fields:[{key:'name',label:'Nombre',type:'text'},{key:'isActive',label:'Activa',type:'bool'}]},
 types:{title:'Tipos profesionales',permission:'professional_types.manage',fields:[{key:'name',label:'Nombre',type:'text'},{key:'roleId',label:'Rol profesional',type:'select',catalog:'roles'},{key:'isClinical',label:'Capacidad clínica (solo Veterinario)',type:'bool'}]},
};
export function CatalogScreen(){const {kind}=useLocalSearchParams<{kind:string}>();const form=forms[kind];const {hasPermission}=useAuth();const api=useClinic();const admin=useAdmin();const action=useAsyncAction();const [search,setSearch]=useState(''),[submitted,setSubmitted]=useState(''),[page,setPage]=useState(1);const [editing,setEditing]=useState<ClinicRow|null>(null);const [values,setValues]=useState<Record<string,string|boolean>>({});const [error,setError]=useState<string|null>(null);const [photo,setPhoto]=useState<{uri:string;base64:string}|null>(null);const [photoError,setPhotoError]=useState<string|null>(null);const [removePhoto,setRemovePhoto]=useState(false);const pickerBusy=useRef(false);const {showToast}=useFeedback();const query=useClientQuery(useCallback(()=>form&&hasPermission(form.permission)?api.adminList(kind,{search:submitted,page:String(page)}):Promise.resolve(null),[api,kind,form,hasPermission,submitted,page]));const catalog=useClientQuery(api.catalog);const roles=useClientQuery(useCallback(()=>kind==='types'?admin.catalog():Promise.resolve(null),[kind,admin]));const products=useClientQuery(useCallback(()=>kind==='promotions'?api.adminList('products'):Promise.resolve(null),[kind,api]));
 if(!form||!hasPermission(form.permission))return <PetCareScreen><PetCareHeader title="Acceso restringido" back/><FormNotice error message="No tenés permiso para este módulo."/></PetCareScreen>;
 function begin(row?:ClinicRow){setEditing(row??{id:''});setValues(Object.fromEntries(form.fields.map(f=>[f.key,f.type==='bool'?Boolean(row?.[f.key]):f.type==='date'&&row?.[f.key]?clinicDateTime(String(row[f.key])).replace(',',''):String(row?.[f.key]??'')])));setError(null);setPhoto(null);setPhotoError(null);setRemovePhoto(false);}
 const options=(name?:string):{id:string;name:string}[]=>name==='roles'?(roles.data?.roles.filter(r=>['VETERINARIAN','GROOMER'].includes(r.code)).map(r=>({id:r.id,name:r.name}))??[]):name==='products'?products.data?.map(r=>({id:r.id,name:String(r.name)}))??[]:((catalog.data as unknown as Record<string,ClinicRow[]>|null)?.[name??'']??[]).map(r=>({id:r.id,name:String(r.name)}));
 function payload(){const result:Record<string,unknown>={};for(const field of form.fields){if(field.permission&&!hasPermission(field.permission))continue;if(kind==='types'&&editing?.id&&['roleId','isClinical'].includes(field.key))continue;const value=values[field.key];if(kind==='products'&&field.key==='imageUrl'&&editing?.id&&value===editing.imageUrl&&!photo&&!removePhoto)continue;if(field.type==='number'){if(value===''&&field.optional){result[field.key]=null;continue;}if(!/^\d+$/.test(String(value)))throw new Error(`Revisá ${field.label.toLowerCase()}.`);result[field.key]=Number(value);}else if(field.type==='date'){const date=clinicInstant(String(value));if(!date)throw new Error(`Revisá ${field.label.toLowerCase()}.`);result[field.key]=date;}else if(field.type==='bool')result[field.key]=Boolean(value);else {if(!String(value??'').trim()&&!field.optional){if(kind==='products'&&field.key==='imageUrl'&&editing?.id)result[field.key]=null;else throw new Error(`Completá ${field.label.toLowerCase()}.`);}else result[field.key]=String(value??'').trim()||null;}}if(photo)result.photoBase64=photo.base64;if(removePhoto)result.imageUrl=null;return result;}
 async function chooseProductPhoto(){if(pickerBusy.current||action.loading)return;pickerBusy.current=true;setPhotoError(null);try{if(Platform.OS!=='web'){const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted){setPhotoError('Permití el acceso a la galería para elegir una imagen.');return;}}const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.8,base64:true});if(result.canceled)return;const asset=result.assets[0];if(!asset?.base64||asset.base64.length>7_000_000||(asset.fileSize??0)>5*1024*1024||asset.width*asset.height>25_000_000){setPhotoError('Elegí una imagen de hasta 5 MB y 25 megapíxeles.');return;}setPhoto({uri:asset.uri,base64:asset.base64});setRemovePhoto(false);}catch{setPhotoError('No pudimos abrir la imagen. Intentá elegir otra.');}finally{pickerBusy.current=false;}}
 async function save(){try{const body=payload();setError(null);await action.run(async()=>{await api.adminSave(kind,editing?.id||undefined,body);setEditing(null);setPhoto(null);showToast('Configuración guardada','success');query.reload();catalog.reload();});}catch(failure){setError((failure as Error).message);}}
 return <PetCareScreen>
  <PetCareHeader title={form.title} subtitle="Cambios compartidos con toda la clínica" back/>
  <SearchFilterBar><AppInput icon="search-outline" label="Buscar" value={search} returnKeyType="search" onChangeText={setSearch} onSubmitEditing={()=>{setSubmitted(search.trim());setPage(1);}}/><AppButton compact label="Buscar" onPress={()=>{setSubmitted(search.trim());setPage(1);}}/></SearchFilterBar><AppButton compact label="Crear" disabled={kind==='products'&&!hasPermission('products.create')} onPress={()=>begin()}/>
  <QueryState {...query}/>
  {query.data&&(query.data.length?query.data.slice(0,100).map(row=><PetCareCard key={row.id}><AppText variant="subtitle">{String(row.name)}</AppText>{row.isActive!==undefined&&<AppText>{row.isActive?'Activo':'Inactivo'}</AppText>}{kind==='products'&&<AppText>Físico: {String(row.stock)} · Reservado: {String(row.reservedStock)} · Disponible: {Number(row.stock)-Number(row.reservedStock)}</AppText>}<AppButton label="Editar" variant="secondary" onPress={()=>begin(row)}/></PetCareCard>):<PetCareEmptyState title="No hay registros en esta consulta"/>)}
  <CompactPagination page={page} canPrevious={page>1} canNext={Boolean(query.data && query.data.length>100)} onPrevious={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
  <AppModal visible={Boolean(editing)} dismissible onClose={()=>setEditing(null)}>
   {editing&&<>
    <AppText variant="subtitle">{editing.id?'Editar':'Crear'} {form.title.toLowerCase()}</AppText>
    <QueryState {...catalog}/>
    {form.fields.filter(f=>!f.permission||hasPermission(f.permission)).map(f=>{
      if(kind==='products'&&f.key==='imageUrl')return <PetCareCard key={f.key}><AppText variant="subtitle">Imagen del producto</AppText><PetImage uri={photo?.uri??(removePhoto?null:typeof editing.imageUrl==='string'?editing.imageUrl:null)}/><AppButton variant="secondary" label={photo?'Cambiar imagen':'Elegir imagen'} disabled={action.loading} onPress={()=>void chooseProductPhoto()}/>{Boolean(photo||editing.imageUrl)&&<AppButton variant="secondary" label="Quitar imagen" disabled={action.loading} onPress={()=>{setPhoto(null);setRemovePhoto(true);setValues(s=>({...s,imageUrl:''}));}}/>}<FormNotice error message={photoError}/><AppInput label="URL HTTPS alternativa" value={editing.id&&String(values.imageUrl??'').includes('X-Amz-')?'':String(values.imageUrl??'')} keyboardType="url" editable={!action.loading} onChangeText={v=>{setValues(s=>({...s,imageUrl:v}));setRemovePhoto(false);setPhoto(null);}}/></PetCareCard>;
      if(f.type==='bool')return <SelectionRow key={f.key} label={f.label} checked={Boolean(values[f.key])} disabled={kind==='types'&&Boolean(editing.id)&&f.key==='isClinical'} onPress={()=>setValues(s=>({...s,[f.key]:!s[f.key]}))}/>;
      if(f.type==='select')return <PetCareCard key={f.key}><AppText>{f.label}</AppText>{f.optional&&<SelectionRow label="Sin asignar" checked={!values[f.key]} onPress={()=>setValues(s=>({...s,[f.key]:''}))}/>}{options(f.catalog).map(o=><SelectionRow key={o.id} radio label={o.name} checked={values[f.key]===o.id} disabled={kind==='types'&&Boolean(editing.id)} onPress={()=>setValues(s=>({...s,[f.key]:o.id}))}/>)}</PetCareCard>;
      return <AppInput key={f.key} label={f.label} value={String(values[f.key]??'')} keyboardType={f.type==='number'?'number-pad':'default'} multiline={['description','requirements'].includes(f.key)} onChangeText={v=>setValues(s=>({...s,[f.key]:v}))}/>;
    })}
    <FormNotice error message={error??action.error}/><AppButton label="Guardar" loading={action.loading} onPress={()=>void save()}/><AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={()=>setEditing(null)}/>
   </>}
  </AppModal>
 </PetCareScreen>;
}

