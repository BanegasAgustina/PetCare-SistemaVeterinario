// Este archivo se encarga de lo siguiente: Componente reutilizable del área clínica; permite al personal gestionar agenda, pacientes y atención.

/**
 * Gestiona el catálogo indicado por kind mediante /clinic/admin. Obtiene entradas reales y envía formularios; el backend limita entidades y comprueba el permiso de cada catálogo.
 */
import { useCallback,useState } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useClinic } from '../../hooks/useClinic';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,PetImage,QueryState,ResponsiveGrid as CatalogGrid } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { AppSelectField } from '../forms/AppSelectField';
import { ImageUploadField } from '../forms/ImageUploadField';
import { CalendarDateField } from '../forms/CalendarDateField';
import { ClinicTimeField } from '../forms/ClinicTimeField';
import { ClinicDateTimeField } from '../forms/ClinicDateTimeField';
import { FormNotice } from '../ui/FormNotice';
import { SelectionRow } from '../ui/SelectionRow';
import { CompactPagination } from '../ui/CompactPagination';
import { AppModal } from '../ui/AppModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { AdminListToolbar } from '../admin/AdminListToolbar';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useTheme } from '../../hooks/useTheme';
import { ApiError } from '../../services/api';
import { AdminFormActions, AdminFormField, AdminFormSection } from '../admin/AdminFormLayout';
import { clinicDate,clinicInstant,clinicDateTime,clinicToday } from '../../utils/clinic-date';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import type { ClinicRow } from '../../types/clinic';
// Tipo Field: define la forma o las opciones válidas de los datos usados por este módulo.
type Field={key:string;label:string;type:'text'|'number'|'bool'|'select'|'date';catalog?:string;optional?:boolean;permission?:string};
// Metadatos del formulario: no son catálogos funcionales ni conceden permisos.
// Configuración forms: reúne valores o reglas que consume el resto del módulo.
const forms:Record<string,{title:string;permission:string;fields:Field[]}>={
 services:{title:'Servicios',permission:'services.manage',fields:[{key:'name',label:'Nombre',type:'text'},{key:'description',label:'Descripción',type:'text',optional:true},{key:'imageUrl',label:'Imagen del servicio',type:'text',optional:true},{key:'typeId',label:'Tipo profesional',type:'select',catalog:'types'},{key:'professionalId',label:'Agregar profesional al guardar',type:'select',catalog:'professionals',optional:true,permission:'professionals.manage'},{key:'specialtyId',label:'Especialidad requerida',type:'select',catalog:'specialties',optional:true},{key:'requirements',label:'Requisitos',type:'text',optional:true},{key:'durationMinutes',label:'Duración en minutos',type:'number'},{key:'priceCents',label:'Precio del servicio (ARS)',type:'number'},{key:'isActive',label:'Activo',type:'bool'}]},
 categories:{title:'Categorías',permission:'categories.manage',fields:[{key:'name',label:'Nombre',type:'text'},{key:'isActive',label:'Activa',type:'bool'}]},
 promotions:{title:'Promociones',permission:'promotions.manage',fields:[{key:'name',label:'Nombre de la promoción',type:'text'},{key:'productId',label:'ID del producto',type:'text'},{key:'priceCents',label:'Precio promocional (ARS)',type:'number'},{key:'startsAt',label:'Inicio',type:'date'},{key:'endsAt',label:'Fin',type:'date'},{key:'bannerImageUrl',label:'Imagen del banner (URL HTTPS opcional)',type:'text',optional:true},{key:'bannerSubtitle',label:'Texto del banner',type:'text',optional:true},{key:'bannerCtaText',label:'Texto del botón',type:'text',optional:true},{key:'isActive',label:'Activa',type:'bool'}]},
 // Los campos del formulario corresponden al inventario interno de PetCare.
 products:{title:'Productos',permission:'products.update',fields:[{key:'name',label:'Nombre',type:'text'},{key:'description',label:'Descripción y características',type:'text',optional:true},{key:'categoryId',label:'Categoría',type:'select',catalog:'categories',optional:true},{key:'imageUrl',label:'Imagen del producto',type:'text',optional:true},{key:'productType',label:'Tipo de producto',type:'select',catalog:'product-types'},{key:'priceCents',label:'Precio de venta (ARS)',type:'number',permission:'products.update_price'},{key:'stock',label:'Stock físico',type:'number',permission:'products.update_stock'},{key:'speciesId',label:'Especie aplicable',type:'select',catalog:'species',optional:true},{key:'requiresPrescription',label:'Requiere receta vigente',type:'bool'},{key:'isFeatured',label:'Destacado',type:'bool'},{key:'isActive',label:'Activo',type:'bool'}]},
};
// El backend valida todos los campos y vuelve a comprobar los permisos efectivos.
// Función CatalogScreen: concentra la lógica dentro de este módulo.
export function CatalogScreen(){const {kind}=useLocalSearchParams<{kind:string}>();const form=forms[kind];const {width}=useWindowDimensions();const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);const {hasPermission}=useAuth();const api=useClinic();const admin=useAdmin();const action=useAsyncAction();const [search,setSearch]=useState(''),[page,setPage]=useState(1),[statusFilter,setStatusFilter]=useState<'all'|'active'|'inactive'>('all');const [editing,setEditing]=useState<ClinicRow|null>(null);const [details,setDetails]=useState<ClinicRow|null>(null);const [deleteTarget,setDeleteTarget]=useState<ClinicRow|null>(null),[statusTarget,setStatusTarget]=useState<ClinicRow|null>(null);const [scheduleService,setScheduleService]=useState(''),[scheduleName,setScheduleName]=useState('');const [values,setValues]=useState<Record<string,string|boolean>>({});const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});const [error,setError]=useState<string|null>(null);const [removePhoto,setRemovePhoto]=useState(false);const [initialValues,setInitialValues]=useState('{}');const [promotionSearch,setPromotionSearch]=useState('');const [promotionPage,setPromotionPage]=useState(1);const [promotionOptions,setPromotionOptions]=useState<{id:string;name:string}[]>([]);const [promotionMoreLoading,setPromotionMoreLoading]=useState(false);const [promotionHasMore,setPromotionHasMore]=useState<boolean|null>(null);const {confirmation:unsavedChangesPrompt,confirmBeforeExit}=useUnsavedChangesGuard(Boolean(editing)&&(JSON.stringify(values)!==initialValues||removePhoto));const {showToast}=useFeedback();const debouncedSearch=useDebouncedValue(search.trim());const debouncedPromotionSearch=useDebouncedValue(promotionSearch.trim());const query=useClientQuery(useCallback(()=>form&&hasPermission(form.permission)?api.adminList(kind,{search:debouncedSearch,page:String(page),status:statusFilter}):Promise.resolve(null),[api,kind,form,hasPermission,debouncedSearch,page,statusFilter]));const catalog=useClientQuery(api.catalog);const promotionProducts=useClientQuery(useCallback(()=>kind==='promotions'?api.promotionProducts(debouncedPromotionSearch,1):Promise.resolve(null),[api,kind,debouncedPromotionSearch]));const roles=useClientQuery(useCallback(()=>kind==='types'?admin.catalog():Promise.resolve(null),[kind,admin]));
async function loadMorePromotionProducts(){if(promotionMoreLoading)return;const next=promotionPage+1;setPromotionMoreLoading(true);try{const result=await api.promotionProducts(debouncedPromotionSearch,next);setPromotionOptions(current=>[...current,...result.items.filter(item=>!current.some(existing=>existing.id===item.id))]);setPromotionPage(next);setPromotionHasMore(result.hasMore);}catch{}finally{setPromotionMoreLoading(false);}}
 if(!form||!hasPermission(form.permission))return <PetCareScreen><PetCareHeader title="Acceso restringido" back hideForAdmin/><FormNotice error message="No tenés permiso para este módulo."/></PetCareScreen>;
 // Los valores iniciales conservan los datos reales y aplican enums conocidos al crear.
 // Función begin: concentra la lógica dentro de este módulo.
function begin(row?:ClinicRow){setEditing(row??{id:''});const initial=Object.fromEntries(form.fields.map(f=>[f.key,f.type==='bool'?(row?Boolean(row[f.key]):f.key==='isActive'):f.key==='priceCents'&&row?.[f.key]!==null&&row?.[f.key]!==undefined?(Number(row[f.key])/100).toFixed(2):f.type==='date'&&row?.[f.key]?clinicDateTime(String(row[f.key])).replace(',',''):String(row?.[f.key]??(f.key==='productType'?'MEDICINE':''))]));setInitialValues(JSON.stringify(initial));setValues(initial as Record<string,string|boolean>);setFieldErrors({});setError(null);setRemovePhoto(false);}
 // Función changeField: actualiza o guarda información dentro de este módulo.
function changeField(key:string,value:string|boolean){setValues(current=>({...current,[key]:value}));setFieldErrors(current=>{const next={...current};delete next[key];return next;});setError(null);}
 // Los selectores usan enums fijos validados tambien en backend; no contienen productos de muestra.
 // Función options: agrupa una operación que este módulo puede ejecutar o reutilizar.
const options=(name?:string):{id:string;name:string}[]=>name==='product-types'?[{id:'MEDICINE',name:'Medicamento'},{id:'ACCESSORY',name:'Accesorio'}]:name==='roles'?(roles.data?.roles.filter(r=>['VETERINARIAN','GROOMER'].includes(r.code)).map(r=>({id:r.id,name:r.name}))??[]):name==='professionals'?(catalog.data?.professionals.filter(person=>person.typeId===values.typeId&&Boolean(person.isActive)&&(!values.specialtyId||String(person.specialtyIds??'').split(',').includes(String(values.specialtyId)))).map(person=>({id:person.id,name:String(person.name)}))??[]):name==='specialties'?(Boolean(catalog.data?.types.find(type=>type.id===values.typeId)?.isClinical)?(catalog.data?.specialties??[]).map(row=>({id:row.id,name:String(row.name)})):[]):((catalog.data as unknown as Record<string,ClinicRow[]>|null)?.[name??'']??[]).map(r=>({id:r.id,name:String(r.name)}));
 // Función renderAdminField: concentra la lógica dentro de este módulo.
function renderAdminField(f:Field){
  if(f.permission&&!hasPermission(f.permission))return null;
  if((kind==='products'||kind==='services')&&f.key==='imageUrl')return <PetCareCard key={f.key}><ImageUploadField label={`Imagen del ${kind==='services'?'servicio':'producto'}`} kind={kind==='services'?'service':'product'} aspect={[1,1]} value={removePhoto?null:String(values.imageUrl??'')||null} disabled={action.loading} error={fieldErrors.imageUrl} onChange={value=>{changeField('imageUrl',value??'');setRemovePhoto(!value);}}/><AppInput label="URL externa alternativa (opcional)" value={String(values.imageUrl??'')} error={fieldErrors.imageUrl} keyboardType="url" editable={!action.loading} onChangeText={value=>{changeField('imageUrl',value);setRemovePhoto(false);}}/></PetCareCard>;
  if(kind==='promotions'&&f.key==='bannerImageUrl')return <ImageUploadField key={f.key} label="Imagen de la promoción (opcional)" kind="banner" aspect={[16,9]} value={String(values.bannerImageUrl??'')||null} disabled={action.loading} error={fieldErrors.bannerImageUrl} onChange={value=>changeField('bannerImageUrl',value??'')}/>;
  if(kind==='promotions'&&f.key==='productId')return <AppSelectField key={f.key} label="Producto asociado" required value={String(values.productId??'')} selectedLabel={String(editing?.productName??'')} options={[...(promotionProducts.data?.items??[]),...promotionOptions.filter(item=>!promotionProducts.data?.items.some(current=>current.id===item.id))]} error={fieldErrors.productId} disabled={action.loading} placeholder="Buscar y seleccionar producto" searchValue={promotionSearch} onSearchChange={value=>{setPromotionSearch(value);setPromotionOptions([]);setPromotionPage(1);setPromotionHasMore(null);}} loading={promotionProducts.loading||promotionMoreLoading} hasMore={promotionHasMore??Boolean(promotionProducts.data?.hasMore)} onLoadMore={()=>void loadMorePromotionProducts()} onChange={value=>changeField('productId',value)}/>;
  if(f.type==='date')return <View key={f.key}><ClinicDateTimeField label={f.label} value={String(values[f.key]??'')} disabled={action.loading} onChange={v=>changeField(f.key,v)}/><FormNotice error message={fieldErrors[f.key]}/></View>;
  if(f.type==='bool')return <View key={f.key}><SelectionRow label={f.optional?f.label:`${f.label} *`} checked={Boolean(values[f.key])} disabled={kind==='types'&&Boolean(editing?.id)&&f.key==='isClinical'} onPress={()=>changeField(f.key,!values[f.key])}/><FormNotice error message={fieldErrors[f.key]}/></View>;
  if(f.type==='select'){
   const fieldOptions=options(f.catalog);
   // Función select: agrupa una operación que este módulo puede ejecutar o reutilizar.
const select=(id:string)=>{changeField(f.key,id);if(kind==='services'&&f.key==='typeId'&&values.typeId!==id){changeField('specialtyId','');changeField('professionalId','');}if(kind==='services'&&f.key==='specialtyId'&&values.specialtyId!==id)changeField('professionalId','');};
   if(kind==='services')return <View key={f.key} style={{gap:8}}><AppSelectField label={f.label} required={!f.optional} optional={Boolean(f.optional)} value={String(values[f.key]??'')} options={fieldOptions} error={fieldErrors[f.key]} disabled={action.loading} onChange={select} hint={f.key==='specialtyId'&&!Boolean(catalog.data?.types.find(type=>type.id===values.typeId)?.isClinical)?'Este tipo de atención no requiere especialidades veterinarias.':f.key==='professionalId'?'Agregar un profesional conserva las demás asignaciones.':''}/>{f.key==='professionalId'&&fieldOptions.length>0&&hasPermission('professionals.manage')&&<AppButton compact variant="secondary" label="Administrar profesionales" onPress={()=>router.push('/admin/professionals')} />}{f.key==='professionalId'&&!fieldOptions.length&&<AppText variant="caption" muted>No hay profesionales activos compatibles con el tipo y la especialidad seleccionados.</AppText>}</View>;
   return <AppSelectField key={f.key} label={f.label} required={!f.optional} optional={Boolean(f.optional)} value={String(values[f.key]??'')} options={fieldOptions} error={fieldErrors[f.key]} disabled={action.loading||(kind==='types'&&Boolean(editing?.id))} onChange={select}/>;
  }
  const currency=f.key==='priceCents';return <AppInput key={f.key} label={f.label} required={!f.optional} error={fieldErrors[f.key]} maxLength={kind==='services'&&f.key==='name'?20:undefined} prefix={currency?'$':undefined} placeholder={currency?'0,00':undefined} value={String(values[f.key]??'')} keyboardType={currency?'decimal-pad':f.type==='number'?'number-pad':'default'} multiline={['description','requirements'].includes(f.key)} onChangeText={v=>changeField(f.key,currency?v.replace(',','.'):v)}/>;
 }
 // Función payload: concentra la lógica dentro de este módulo.
function payload(){const result:Record<string,unknown>={};for(const field of form.fields){if(field.permission&&!hasPermission(field.permission))continue;if(kind==='services'&&field.key==='professionalId')continue;if(kind==='types'&&editing?.id&&['roleId','isClinical'].includes(field.key))continue;const value=values[field.key];if(kind==='services'&&field.key==='name'){const serviceName=String(value??'').trim();if(!serviceName||serviceName.length>20||/\d/.test(serviceName))throw new Error('Ingresá un nombre de hasta 20 caracteres y sin números.');result[field.key]=serviceName;continue;}if(kind==='products'&&field.key==='imageUrl'&&editing?.id&&value===editing.imageUrl&&!removePhoto)continue;if(kind==='products'&&field.key==='productType'&&editing?.id&&value==='')continue;if(field.type==='number'){if(value===''&&field.optional){result[field.key]=null;continue;}const valid=field.key==='priceCents'?/^\d+(?:\.\d{1,2})?$/.test(String(value))&&Number(value)<=1000000:/^\d+$/.test(String(value));if(!valid)throw new Error(`Revisá ${field.label.toLowerCase()}.`);result[field.key]=field.key==='priceCents'?Math.round(Number(value)*100):Number(value);}else if(field.type==='date'){const date=clinicInstant(String(value));if(!date)throw new Error(`Revisá ${field.label.toLowerCase()}.`);result[field.key]=date;}else if(field.type==='bool')result[field.key]=Boolean(value);else {if(!String(value??'').trim()&&!field.optional){if(kind==='products'&&field.key==='imageUrl'&&editing?.id)result[field.key]=null;else throw new Error(`Completá ${field.label.toLowerCase()}.`);}else result[field.key]=String(value??'').trim()||null;}}if(removePhoto)result.imageUrl=null;return result;}
 // Función validateAdminForm: comprueba una regla o condición dentro de este módulo.
function validateAdminForm(){
  if(kind!=='products'&&kind!=='categories'&&kind!=='promotions'&&kind!=='services')return false;
  const next:Record<string,string>={},name=String(values.name??'').trim(),maxName=kind==='products'?200:kind==='services'?20:100;
  if(!name)next.name='Ingresá un nombre.';else if(name.length>maxName)next.name=`El nombre admite hasta ${maxName} caracteres.`;
  if(kind==='services'){
   if(/\d/.test(name))next.name='El nombre del servicio no puede incluir números.';
   if(!catalog.data?.types.some(item=>item.id===values.typeId))next.typeId='Seleccioná un tipo profesional disponible.';
   const duration=String(values.durationMinutes??'');if(!/^\d+$/.test(duration)||Number(duration)<5||Number(duration)>480)next.durationMinutes='La duración debe ser un número entero entre 5 y 480 minutos.';
   const price=String(values.priceCents??'');if(!/^\d+(?:\.\d{1,2})?$/.test(price)||Number(price)>1000000)next.priceCents='Ingresá un precio válido, de hasta $1.000.000 y dos decimales.';
   const professionalType=catalog.data?.types.find(item=>item.id===values.typeId);if(professionalType&&!Boolean(professionalType.isClinical)&&Boolean(values.specialtyId))next.specialtyId='Los servicios de este tipo no admiten especialidad veterinaria. Quitá la especialidad para continuar.';
   if(Boolean(values.specialtyId)&&catalog.data&&!catalog.data.specialties.some(item=>item.id===values.specialtyId))next.specialtyId='La especialidad seleccionada ya no está activa. Elegí otra o quitá la asignación.';
   const image=String(values.imageUrl??'').trim();if(image&&image!==editing?.imageUrl&&!/^https:\/\//i.test(image))next.imageUrl='La imagen requiere una URL HTTPS válida.';
  }
  if(kind==='products'){
   if(!editing?.id&&(!values.productType||!['MEDICINE','ACCESSORY'].includes(String(values.productType))))next.productType='Seleccioná un tipo de producto.';
   if(hasPermission('products.update_price')){const price=String(values.priceCents??'');if(!/^\d+(?:\.\d{1,2})?$/.test(price)||Number(price)>1000000)next.priceCents='Ingresá un precio de venta válido, de hasta $1.000.000 y dos decimales.';}
   if(hasPermission('products.update_stock')){const stock=String(values.stock??'');if(!/^\d+$/.test(stock)||Number(stock)>100000000)next.stock='Ingresá un stock entero entre 0 y 100.000.000.';}
   if(hasPermission('products.update')&&String(values.imageUrl??'').trim()&&!/^https:\/\//i.test(String(values.imageUrl).trim()))next.imageUrl='La imagen debe tener una dirección HTTPS válida.';
   if(String(values.productType)==='ACCESSORY'&&Boolean(values.requiresPrescription))next.requiresPrescription='Los accesorios no pueden requerir receta veterinaria.';
  }
  if(kind==='promotions'){
   const productId=String(values.productId??'').trim();if(!productId)next.productId='Indicá el ID del producto existente al que se aplica la promoción.';
   const price=String(values.priceCents??'');if(!/^\d+(?:\.\d{1,2})?$/.test(price)||Number(price)>1000000)next.priceCents='Ingresá un precio promocional válido, de hasta $1.000.000 y dos decimales.';
   const starts=clinicInstant(String(values.startsAt??'')),ends=clinicInstant(String(values.endsAt??''));if(!starts)next.startsAt='Seleccioná una fecha y hora de inicio válidas.';if(!ends)next.endsAt='Seleccioná una fecha y hora de finalización válidas.';if(starts&&ends&&ends<=starts)next.endsAt='La finalización debe ser posterior al inicio.';
   const bannerImage=String(values.bannerImageUrl??'').trim();if(bannerImage&&!/^https:\/\//i.test(bannerImage))next.bannerImageUrl='La imagen del banner debe usar una dirección HTTPS.';
   if(String(values.bannerSubtitle??'').length>250)next.bannerSubtitle='El texto del banner admite hasta 250 caracteres.';if(String(values.bannerCtaText??'').length>40)next.bannerCtaText='El texto del botón admite hasta 40 caracteres.';
  }
  setFieldErrors(next);return Object.keys(next).length>0;
 }
 // Función chooseProductPhoto: concentra la lógica dentro de este módulo.
async function save(){setError(null);if(validateAdminForm())return;try{const body=payload();const saved=await action.run(async()=>{const result=await api.adminSave(kind,editing?.id||undefined,body) as {id?:string};if(kind==='services'&&hasPermission('professionals.manage')){const serviceId=editing?.id||result.id,professionalId=String(values.professionalId??'');if(professionalId){if(!serviceId)throw new Error('No se pudo identificar el servicio guardado.');const serviceIds=catalog.data?.assignments.filter(link=>link.professionalId===professionalId).map(link=>String(link.serviceId))??[];if(!serviceIds.includes(serviceId))await api.assignServices(professionalId,[...serviceIds,serviceId]);}}});if(saved){setEditing(null);showToast(kind==='services'?'Servicio guardado':'Cambios guardados','success');query.reload();catalog.reload();}}catch(failure){if(failure instanceof ApiError&&failure.fieldErrors.length){const next=Object.fromEntries(failure.fieldErrors.map(item=>[item.field,item.message]));const known=Object.fromEntries(Object.entries(next).filter(([key])=>form.fields.some(field=>field.key===key)));setFieldErrors(current=>({...current,...known}));setError(Object.keys(known).length?null:failure.message);}else setError((failure as Error).message);}}
 return <PetCareScreen wide>
  <PetCareHeader title={form.title} subtitle="Cambios compartidos con toda la clínica" back hideForAdmin/>
  <AdminListToolbar search={<AppInput icon="search-outline" label={`Buscar ${form.title.toLowerCase()}`} value={search} returnKeyType="search" onChangeText={value=>{setSearch(value);setPage(1);}} onSubmitEditing={()=>setPage(1)}/>} actions={<View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}>{kind!=='types'&&(['all','active','inactive'] as const).map(status=><AppButton key={status} compact variant={statusFilter===status?'primary':'secondary'} label={status==='all'?'Todos':status==='active'?'Activos':'Inactivos'} onPress={()=>{setStatusFilter(status);setPage(1);}}/>)}{(kind!=='products'||(hasPermission('products.update')&&hasPermission('products.create')&&hasPermission('products.update_price')&&hasPermission('products.update_stock')))&&<AppButton compact label={`Crear ${kind==='services'?'servicio':kind==='categories'?'categoría':kind==='promotions'?'promoción':'producto'}`} onPress={()=>begin()}/>}</View>}/>{kind==='products'&&hasPermission('products.create')&&(!hasPermission('products.update_price')||!hasPermission('products.update_stock'))&&<FormNotice message="Para crear productos se requieren permisos de edición, precio y stock."/>}
  
<QueryState {...query}/>
   {query.data&&(query.data.length?desktop?<CatalogDesktopTable rows={query.data.slice(0,100)} kind={kind} summary={row=>kind==='services'?`${catalog.data?.types.find(type=>type.id===row.typeId)?.name??'Tipo no asignado'} · ${row.durationMinutes} min · $${((Number(row.priceCents)||0)/100).toFixed(2)}`:kind==='products'?`${row.productType==='MEDICINE'?'Medicamento':'Accesorio'} · Stock ${String(row.stock??0)} · $${((Number(row.priceCents)||0)/100).toFixed(2)}`:String(row.description??'')} onView={setDetails} onEdit={begin} onStatus={setStatusTarget} onSchedule={row=>{setScheduleService(row.id);setScheduleName(String(row.name));}} canSchedule={kind==='services'&&hasPermission('schedule.manage')} />:<CatalogGrid maxColumns={kind==='services'?3:2}>{query.data.slice(0,100).map(row=>{
    const serviceType=catalog.data?.types.find(type=>type.id===row.typeId);
    const assigned=catalog.data?.assignments.filter(link=>link.serviceId===row.id).map(link=>catalog.data?.professionals.find(person=>person.id===link.professionalId)?.name).filter((name):name is string=>Boolean(name))??[];
    return <PetCareCard key={row.id}><View style={{flexDirection:'row',alignItems:'center',gap:14}}>{(kind==='products'||kind==='services')&&<PetImage uri={typeof row.imageUrl==='string'?row.imageUrl:null} size={60}/>}<View style={{flex:1,minWidth:0,gap:4}}><AppText variant="subtitle" numberOfLines={1}>{String(row.name)}</AppText>{kind==='services'?<>
      {Boolean(row.description)&&<AppText muted numberOfLines={2}>{String(row.description)}</AppText>}
      <AppText variant="caption" muted>{serviceType?.name??'Tipo no asignado'} · {row.durationMinutes} min · ${((Number(row.priceCents)||0)/100).toFixed(2)}</AppText>
      {hasPermission('professionals.manage')&&<AppText variant="caption" muted numberOfLines={2}>{assigned.length?assigned.join(' · '):'Sin profesionales asignados'}</AppText>}
      <AppText variant="caption">{row.isActive?'Activo':'Inactivo'}</AppText>
     </>:<AppText muted numberOfLines={2}>{String(row.description??'Producto')} · {row.isActive?'Disponible':'Inactivo'}</AppText>}</View><Pressable accessibilityRole="button" accessibilityLabel={`Ver ${String(row.name)}`} onPress={()=>setDetails(row)} style={{padding:10}}><Ionicons name="eye-outline" size={22}/></Pressable></View>
     {kind==='services'&&hasPermission('schedule.manage')&&<AppButton compact variant="secondary" label="Horarios y disponibilidad" onPress={()=>{setScheduleService(row.id);setScheduleName(String(row.name));}}/>}
     {kind!=='types'&&<AppButton compact variant="secondary" label={row.isActive?'Desactivar':'Reactivar'} onPress={()=>setStatusTarget(row)}/>
    }</PetCareCard>;
   })}</CatalogGrid>:<PetCareEmptyState title="No hay resultados" message="Probá con otro nombre o revisá los filtros."/>)}<CompactPagination page={page} canPrevious={page>1} canNext={Boolean(query.data && query.data.length>100)} onPrevious={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)}/>
  <AppModal size="wide" visible={Boolean(details)} dismissible onClose={()=>setDetails(null)}>
   {details&&<>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><AppText variant="title">Detalle de {form.title.toLowerCase()}</AppText><Pressable accessibilityRole="button" accessibilityLabel={`Editar ${String(details.name)}`} onPress={()=>{const row=details;setDetails(null);begin(row);}} style={{padding:10}}><Ionicons name="create-outline" size={22}/></Pressable></View>
    {(kind==='products'||kind==='services')&&<PetImage uri={typeof details.imageUrl==='string'?details.imageUrl:null} size={160}/>}
    <AppText variant="subtitle">{String(details.name)}</AppText>
    {Boolean(details.description)&&<AppText>{String(details.description)}</AppText>}
    {kind==='services'&&<><AppText>Tipo profesional: {String(catalog.data?.types.find(item=>item.id===details.typeId)?.name??'Sin tipo asignado')}</AppText>{Boolean(details.specialtyId)&&<AppText>Especialidad requerida: {String(catalog.data?.specialties.find(item=>item.id===details.specialtyId)?.name??'Especialidad registrada')}</AppText>}<AppText>Duración: {String(details.durationMinutes)} minutos</AppText><AppText>Precio: ${((Number(details.priceCents)||0)/100).toFixed(2)}</AppText>{hasPermission('professionals.manage')&&<AppText>Profesionales: {String(catalog.data?.assignments.filter(link=>link.serviceId===details.id).map(link=>catalog.data?.professionals.find(person=>person.id===link.professionalId)?.name).filter(Boolean).join(' · ')||'Sin profesionales asignados')}</AppText>}{Boolean(details.requirements)&&<AppText>Requisitos: {String(details.requirements)}</AppText>}<AppText>Estado: {details.isActive?'Activo':'Inactivo'}</AppText></>}
    {kind==='products'&&<><AppText>Tipo: {details.productType==='MEDICINE'?'Medicamento':'Accesorio'}</AppText>{Boolean(details.categoryId)&&<AppText>Categoría: {String(catalog.data?.categories.find(item=>item.id===details.categoryId)?.name??'Categoría registrada')}</AppText>}<AppText>Precio: ${((Number(details.priceCents)||0)/100).toFixed(2)}</AppText><AppText>Stock físico: {String(details.stock??0)}</AppText>{details.reservedStock!==null&&details.reservedStock!==undefined&&<AppText>Unidades reservadas: {String(details.reservedStock)}</AppText>}<AppText>Estado: {details.isActive?'Activo':'Inactivo'}</AppText></>}
    {kind==='services'&&hasPermission('schedule.manage')&&<AppButton label="Horarios y disponibilidad" variant="secondary" onPress={()=>{setScheduleService(details.id);setScheduleName(String(details.name));setDetails(null);}}/>}
    {kind==='services'&&hasPermission('services.manage')&&<AppButton label="Eliminar servicio" variant="secondary" destructive onPress={()=>setDeleteTarget(details)}/>}
    <AppButton label="Cerrar" variant="secondary" onPress={()=>setDetails(null)}/>
   </>}
  </AppModal><AppModal size="wide" visible={Boolean(editing)} dismissible onClose={()=>confirmBeforeExit(()=>setEditing(null))}>
   {editing&&<>
    <AppText variant="title">{editing.id?'Editar':'Crear'} {form.title.toLowerCase()}</AppText>
    <QueryState {...catalog}/>
    {/* La API valida tipo, precio, stock e imagen con los permisos vigentes. */}
    {kind==='services' ? <>
      {!catalog.loading&&!catalog.data?.types.length&&<View style={{gap:8}}><AppText muted>{hasPermission('professional_types.manage')?'Para guardar un servicio primero necesitás crear un tipo profesional.':'No hay tipos profesionales disponibles. Pedile a un administrador que agregue uno antes de crear el servicio.'}</AppText>{hasPermission('professional_types.manage')&&<AppButton compact variant="secondary" label="Crear tipo profesional" onPress={()=>router.push('/admin/specialties')}/>}</View>}
      
<AdminFormSection title="Información del servicio" description="Definí cómo se presenta y qué debe saber el cliente." columns={2}>
        <AdminFormField>{renderAdminField(form.fields.find(field=>field.key==='name')!)}</AdminFormField>
        <AdminFormField>{renderAdminField(form.fields.find(field=>field.key==='durationMinutes')!)}</AdminFormField>
        <AdminFormField fullWidth>{renderAdminField(form.fields.find(field=>field.key==='description')!)}</AdminFormField>
        <AdminFormField fullWidth>{renderAdminField(form.fields.find(field=>field.key==='requirements')!)}</AdminFormField>
        <AdminFormField fullWidth>{renderAdminField(form.fields.find(field=>field.key==='imageUrl')!)}</AdminFormField>
      </AdminFormSection>
      
<AdminFormSection title="Atención y asignación" description="La asignación del profesional es opcional al crear el servicio." columns={2}>
        <AdminFormField fullWidth>{renderAdminField(form.fields.find(field=>field.key==='typeId')!)}</AdminFormField>
        <AdminFormField fullWidth>{renderAdminField(form.fields.find(field=>field.key==='specialtyId')!)}</AdminFormField>
        <AdminFormField fullWidth>{renderAdminField(form.fields.find(field=>field.key==='professionalId')!)}</AdminFormField>
      </AdminFormSection>
      
<AdminFormSection title="Precio y disponibilidad" columns={2}>
        <AdminFormField>{renderAdminField(form.fields.find(field=>field.key==='priceCents')!)}</AdminFormField>
        <AdminFormField>{renderAdminField(form.fields.find(field=>field.key==='isActive')!)}</AdminFormField>
      </AdminFormSection>
    </> : 
<AdminFormSection title={`Datos de ${form.title.toLowerCase()}`} description="Los campos obligatorios están marcados con asterisco.">
      {kind==='promotions'&&hasPermission('products.view')&&<QueryState {...promotionProducts}/>}
      {(kind==='products'?[...form.fields].sort((a,b)=>a.key==='imageUrl'?-1:b.key==='imageUrl'?1:0):form.fields).map(f=><View key={f.key} style={{gap:10}}>{renderAdminField(f)}</View>)}
    </AdminFormSection>}
    <FormNotice error message={error??action.error}/>
<AdminFormActions><AppButton label="Guardar" loading={action.loading} onPress={()=>void save()}/><AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={()=>confirmBeforeExit(()=>setEditing(null))}/></AdminFormActions>
   </>}
  </AppModal>
  <ConfirmModal visible={Boolean(statusTarget)} title={statusTarget?.isActive?'Desactivar elemento':'Reactivar elemento'} message={statusTarget?.isActive?'¿Querés desactivar este elemento? Dejará de estar disponible para nuevas operaciones, pero conservará su información.':'¿Querés reactivar este elemento para nuevas operaciones?'} confirmLabel={statusTarget?.isActive?'Desactivar':'Reactivar'} destructive={Boolean(statusTarget?.isActive)} onCancel={()=>setStatusTarget(null)} onConfirm={async()=>{const target=statusTarget;if(!target)return;await api.adminSave(kind,String(target.id),{isActive:!target.isActive});setStatusTarget(null);query.reload();catalog.reload();showToast(target.isActive?'Elemento desactivado':'Elemento reactivado','success');}} />
  <ConfirmModal visible={Boolean(deleteTarget)} title="Eliminar servicio" message="Si el servicio no tiene turnos, se borrará junto con sus horarios libres y asignaciones. Si ya tiene turnos o historial, no se borrará definitivamente: se retirará del catálogo para conservar esos registros." confirmLabel="Eliminar servicio" destructive onCancel={()=>setDeleteTarget(null)} onConfirm={async()=>{const target=deleteTarget;if(!target)return;let result:{deleted:boolean;archived?:boolean};try{result=await api.adminDeleteService(String(target.id));}catch(error){if(!(error instanceof ApiError)||error.status!==404)throw error;await api.adminSave('services',String(target.id),{isActive:false});result={deleted:false,archived:true};}setDeleteTarget(null);setDetails(null);if(result.archived)setStatusFilter('active');query.reload();catalog.reload();showToast(result.deleted?'Servicio eliminado':'El servicio tiene turnos asociados. Se retiró del catálogo y se conservó el historial.','success');}} />
  {kind==='services'&&<ServiceScheduleModal serviceId={scheduleService} serviceName={scheduleName} durationMinutes={Number(query.data?.find(service=>service.id===scheduleService)?.durationMinutes??0)} onClose={()=>setScheduleService('')} />}
  {unsavedChangesPrompt}
 </PetCareScreen>;
}

// Función CatalogDesktopTable: concentra la lógica dentro de este módulo.
function CatalogDesktopTable({rows,kind,summary,onView,onEdit,onStatus,onSchedule,canSchedule}:{rows:ClinicRow[];kind:string;summary:(row:ClinicRow)=>string;onView:(row:ClinicRow)=>void;onEdit:(row?:ClinicRow)=>void;onStatus:(row:ClinicRow)=>void;onSchedule:(row:ClinicRow)=>void;canSchedule:boolean}){
 const {colors}=useTheme();
 // Función actions: agrupa una operación que este módulo puede ejecutar o reutilizar.
const actions=(row:ClinicRow)=><View style={tableStyles.actions}>
  <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${String(row.name)}`} onPress={()=>onView(row)} style={[tableStyles.action,{backgroundColor:colors.accent}]}><Ionicons name="eye-outline" size={18} color={colors.primary}/></Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${String(row.name)}`} onPress={()=>onEdit(row)} style={[tableStyles.action,{backgroundColor:colors.accent}]}><Ionicons name="create-outline" size={18} color={colors.primary}/></Pressable>
  {canSchedule&&<Pressable accessibilityRole="button" accessibilityLabel={`Administrar horarios de ${String(row.name)}`} onPress={()=>onSchedule(row)} style={[tableStyles.action,{backgroundColor:colors.accent}]}><Ionicons name="calendar-outline" size={18} color={colors.primary}/></Pressable>}
  {kind!=='types'&&<Pressable accessibilityRole="button" accessibilityLabel={`${row.isActive?'Desactivar':'Reactivar'} ${String(row.name)}`} onPress={()=>onStatus(row)} style={[tableStyles.action,{backgroundColor:colors.accent}]}><Ionicons name={row.isActive?'pause-outline':'play-outline'} size={18} color={colors.primary}/></Pressable>}
 </View>;
 return <View accessibilityRole="table" style={[tableStyles.table,{borderColor:colors.border}]}>
  <View accessibilityRole="row" style={[tableStyles.header,{backgroundColor:colors.accent,borderBottomColor:colors.border}]}>
   <AppText accessibilityRole="columnheader" variant="caption" style={[tableStyles.name,{color:colors.muted}]}>Nombre</AppText>
   <AppText accessibilityRole="columnheader" variant="caption" style={[tableStyles.summary,{color:colors.muted}]}>Información</AppText>
   <AppText accessibilityRole="columnheader" variant="caption" style={[tableStyles.state,{color:colors.muted}]}>Estado</AppText>
   <AppText accessibilityRole="columnheader" variant="caption" style={[tableStyles.actionsHeader,{color:colors.muted}]}>Acciones</AppText>
  </View>
  {rows.map((row,index)=><View key={row.id} accessibilityRole="row" style={[tableStyles.row,{backgroundColor:colors.surface,borderBottomColor:colors.border}]}>
   <AppText accessibilityRole="cell" numberOfLines={2} style={tableStyles.name}>{String(row.name)}</AppText>
   <AppText accessibilityRole="cell" numberOfLines={2} variant="caption" muted style={tableStyles.summary}>{summary(row)||'—'}</AppText>
   <View accessibilityRole="cell" style={tableStyles.state}><View style={[tableStyles.badge,{backgroundColor:row.isActive?colors.accent:colors.background}]}><AppText variant="caption">{row.isActive?'Activo':'Inactivo'}</AppText></View></View>
   <View accessibilityRole="cell" style={tableStyles.actionsHeader}>{actions(row)}</View>
  </View>)}
 </View>;
}

// Dato tableStyles: conserva un valor calculado o de configuración usado por este módulo.
const tableStyles=StyleSheet.create({table:{width:'100%',borderWidth:1,borderRadius:14,overflow:'hidden'},header:{minHeight:42,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1},row:{minHeight:62,paddingHorizontal:12,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:StyleSheet.hairlineWidth},name:{flex:1.1,minWidth:110,fontWeight:'600'},summary:{flex:1.8,minWidth:150},state:{flex:0.65,minWidth:76},badge:{alignSelf:'flex-start',paddingHorizontal:9,paddingVertical:4,borderRadius:12},actionsHeader:{flex:1.15,minWidth:102},actions:{flexDirection:'row',justifyContent:'flex-end',gap:4,flexWrap:'wrap'},action:{width:34,height:34,borderRadius:10,alignItems:'center',justifyContent:'center'}});

// Función ServiceScheduleModal: concentra la lógica dentro de este módulo.
export function ServiceScheduleModal({serviceId,serviceName,durationMinutes,initialProfessionalId,onClose}:{serviceId:string;serviceName:string;durationMinutes:number;initialProfessionalId?:string;onClose:()=>void}){
 const api=useClinic(),catalog=useClientQuery(api.catalog),{hasPermission}=useAuth(),action=useAsyncAction(),{showToast}=useFeedback(),{colors}=useTheme();
 const [professional,setProfessional]=useState(initialProfessionalId??''),[days,setDays]=useState<string[]>([]),[fromDate,setFromDate]=useState(''),[toDate,setToDate]=useState(''),[fromTime,setFromTime]=useState(''),[toTime,setToTime]=useState(''),[error,setError]=useState<string|null>(null),[disableId,setDisableId]=useState(''),[restoreId,setRestoreId]=useState(''),[archiveId,setArchiveId]=useState(''),[selectedScheduleDay,setSelectedScheduleDay]=useState(''),[blockFrom,setBlockFrom]=useState(''),[blockTo,setBlockTo]=useState(''),[blockReason,setBlockReason]=useState(''),[blockError,setBlockError]=useState<string|null>(null),[section,setSection]=useState<'publish'|'published'|'blocks'>('publish');
 const schedule=useClientQuery(useCallback(()=>professional?api.availability(professional):Promise.resolve(null),[api,professional]));
 const service=catalog.data?.services.find(item=>item.id===serviceId);
 const requiredSpecialtyId=service?.specialtyId;
 const assignedProfessionals=(catalog.data?.professionals??[]).filter(person=>Boolean(person.isActive)&&catalog.data?.assignments.some(link=>link.professionalId===person.id&&link.serviceId===serviceId));
 const professionals=assignedProfessionals.filter(person=>!requiredSpecialtyId||String(person.specialtyIds??'').split(',').includes(String(requiredSpecialtyId)));
 const week=[['1','Lunes'],['2','Martes'],['3','Miércoles'],['4','Jueves'],['5','Viernes'],['6','Sábado'],['0','Domingo']];
 // Función validDate: concentra la lógica dentro de este módulo.
function validDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const parsed=new Date(`${value}T12:00:00Z`);return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;}
 // Función selectedDates: concentra la lógica dentro de este módulo.
function selectedDates(){const dates:string[]=[];if(!validDate(fromDate)||!validDate(toDate)||fromDate>toDate)return dates;const cursor=new Date(`${fromDate}T12:00:00Z`),last=new Date(`${toDate}T12:00:00Z`);while(cursor<=last){const date=cursor.toISOString().slice(0,10);if(days.includes(String(cursor.getUTCDay())))dates.push(date);cursor.setUTCDate(cursor.getUTCDate()+1);}return dates;}
 const occurrences=selectedDates();
 const startMinutes=Number(fromTime.slice(0,2))*60+Number(fromTime.slice(3,5)),endMinutes=Number(toTime.slice(0,2))*60+Number(toTime.slice(3,5));
 const serviceDuration=Number.isInteger(durationMinutes)&&durationMinutes>=5&&durationMinutes<=480?durationMinutes:0,dailyMinutes=endMinutes-startMinutes;
 const completeBlocks=dailyMinutes>0&&dailyMinutes%serviceDuration===0?dailyMinutes/serviceDuration:0;
 // Función publish: concentra la lógica dentro de este módulo.
async function publish(){
  if(!hasPermission('schedule.manage')||!serviceDuration){setError('No pudimos confirmar la duración actual del servicio. Actualizá la lista y volvé a abrir horarios.');return;}
  if(!professional||!days.length||!validDate(fromDate)||!validDate(toDate)||fromDate>toDate||Date.parse(`${toDate}T12:00:00Z`)-Date.parse(`${fromDate}T12:00:00Z`)>62*86_400_000||!/^([01]\d|2[0-3]):[0-5]\d$/.test(fromTime)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(toTime)||fromTime>=toTime){setError('Elegí el profesional, los días, un período de hasta 63 días y horas válidas.');return;}
  if(!professionals.some(person=>person.id===professional)){setError(requiredSpecialtyId?'El profesional seleccionado ya no tiene activa la especialidad requerida por este servicio. Actualizá la asignación antes de publicar.':'El profesional seleccionado ya no tiene asignado este servicio. Actualizá la asignación antes de publicar.');return;}
  if(!occurrences.length){setError('No hay días seleccionados dentro del período.');return;}
  if(!completeBlocks||completeBlocks>100){setError(`El horario debe completar bloques de ${serviceDuration} minutos (hasta 100 turnos por día).`);return;}
  // Función startAt, endAt: agrupa una operación que este módulo puede ejecutar o reutilizar.
const startAt=(date:string)=>new Date(`${date}T${fromTime}:00-03:00`),endAt=(date:string)=>new Date(`${date}T${toTime}:00-03:00`);
  if(occurrences.some(date=>startAt(date).getTime()<=Date.now())){setError('El período incluye horarios pasados. Elegí fechas futuras.');return;}
  setError(null);let savedDays=0;const saved=await action.run(async()=>{for(const date of occurrences){await api.saveAvailability({professionalId:professional,serviceId,startsAt:startAt(date).toISOString(),endsAt:endAt(date).toISOString(),block:false,reason:''});savedDays++;}});
  if(saved){showToast(`${occurrences.length*completeBlocks} turnos publicados`,'success');schedule.reload();setDays([]);setSection('published');}else if(savedDays>0){setError(`Se publicaron turnos para ${savedDays} de ${occurrences.length} días antes de un error. Revisá la lista antes de volver a publicar.`);schedule.reload();setSection('published');}
 }
 // Función saveBlock: actualiza o guarda información dentro de este módulo.
async function saveBlock(){
  const start=clinicInstant(blockFrom),end=clinicInstant(blockTo);
  if(!professional||!start||!end||end<=start||blockReason.trim().length<3){setBlockError('Elegí un inicio y un fin, y escribí un motivo de al menos 3 caracteres.');return;}
  setBlockError('');const saved=await action.run(()=>api.saveAvailability({professionalId:professional,startsAt:start,endsAt:end,block:true,reason:blockReason.trim()}));
  if(saved){showToast('Bloqueo guardado','success');setBlockReason('');setBlockFrom('');setBlockTo('');schedule.reload();}
 }
 const activeSlots=schedule.data?.slots.filter(slot=>slot.serviceId===serviceId&&Boolean(slot.isActive))??[];
 const activeBlocks=schedule.data?.blocks.filter(block=>Boolean(block.isActive))??[];
 const inactiveSlots=schedule.data?.slots.filter(slot=>slot.serviceId===serviceId&&!Boolean(slot.isActive)&&isFutureAvailability(slot.startsAt))??[];
 const inactiveBlocks=schedule.data?.blocks.filter(block=>!Boolean(block.isActive)&&isFutureAvailability(block.startsAt))??[];
 const selectedDaySlots=activeSlots.filter(slot=>clinicDayKey(String(slot.startsAt))===selectedScheduleDay).sort((a,b)=>String(a.startsAt).localeCompare(String(b.startsAt)));
 const disableTarget=disableId.split(':');
 const disablingDay=disableTarget[0]==='day';
 const disablingBlock=disableTarget[0]==='block';
 return <><AppModal size="wide" visible={Boolean(serviceId)} dismissible onClose={()=>{if(!action.loading)onClose();}}>
   <AppText variant="title">Publicar horarios · {serviceName}</AppText>
   <AppText muted>{serviceDuration?`Elegí quién brinda el servicio, qué días se repiten y en qué período. PetCare dividirá el horario en turnos de ${serviceDuration} minutos.`:'No se pudo cargar la duración actual del servicio. Cerrá esta ventana, actualizá la lista e intentá nuevamente.'}</AppText>
   
<QueryState {...catalog}/>
   
<AdminFormSection title="1. Profesional asignado" description="Seleccioná un profesional activo con el servicio y la especialidad requeridos." columns={2}>
    {professionals.map(person=><AdminFormField key={person.id}><SelectionRow radio label={String(person.name)} checked={professional===person.id} onPress={()=>setProfessional(person.id)}/></AdminFormField>)}
    {!catalog.loading&&!professionals.length&&<><PetCareEmptyState title={assignedProfessionals.length?'Falta asignar la especialidad requerida':'Este servicio todavía no tiene profesional'} message={assignedProfessionals.length?'Este servicio requiere una especialidad activa. Revisá la ficha de Veterinarios y la asignación del servicio.':'Primero asigná el servicio a un profesional para poder publicar turnos.'}/>{hasPermission('professionals.manage')&&<AppButton variant="secondary" label={assignedProfessionals.length?'Ir a Veterinarios':'Ir a Profesionales'} onPress={()=>{onClose();router.push((assignedProfessionals.length?'/admin/veterinarians':'/admin/professionals') as never);}}/>}</>}
   </AdminFormSection>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
    <AppButton compact label="Publicar turnos" variant={section==='publish'?'primary':'secondary'} onPress={()=>setSection('publish')}/>
    <AppButton compact label={`Turnos publicados (${activeSlots.length})`} variant={section==='published'?'primary':'secondary'} onPress={()=>setSection('published')}/>
    <AppButton compact label={`Bloqueos (${activeBlocks.length})`} variant={section==='blocks'?'primary':'secondary'} onPress={()=>setSection('blocks')}/>
   </View>
   {section==='publish'&&<>
    
<AdminFormSection title="2. Días que se repiten" description="Seleccioná los días de la semana en los que querés ofrecer este servicio.">
     <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{week.map(([value,label])=><AppButton key={value} compact label={label} variant={days.includes(value)?'primary':'secondary'} disabled={!serviceDuration||action.loading} onPress={()=>setDays(current=>current.includes(value)?current.filter(day=>day!==value):[...current,value])}/>)}</View>
    </AdminFormSection>
    
<AdminFormSection title="3. Período y horario" description="Las fechas se eligen en el calendario de la clínica." columns={2}>
     <AdminFormField><CalendarDateField label="Desde" value={fromDate} minDate={clinicToday()} disabled={!serviceDuration||action.loading} onChange={value=>{setFromDate(value);if(toDate&&toDate<value)setToDate('');}}/></AdminFormField>
     <AdminFormField><CalendarDateField label="Hasta" value={toDate} minDate={fromDate||clinicToday()} disabled={!serviceDuration||action.loading} onChange={setToDate}/></AdminFormField>
     <AdminFormField><ClinicTimeField label="Hora de inicio" value={fromTime} disabled={!serviceDuration||action.loading} onChange={setFromTime}/></AdminFormField>
     <AdminFormField><ClinicTimeField label="Hora de cierre" value={toTime} disabled={!serviceDuration||action.loading} onChange={setToTime}/></AdminFormField>
    </AdminFormSection>
    {professional&&days.length>0&&fromDate&&toDate&&<PetCareCard><AppText variant="subtitle">Resumen de publicación</AppText><AppText>{occurrences.length} días · {completeBlocks?occurrences.length*completeBlocks:'—'} turnos · {serviceDuration} minutos cada uno</AppText><AppText muted>{fromTime} a {toTime} · {days.map(day=>week.find(([value])=>value===day)?.[1]).filter(Boolean).join(', ')}</AppText></PetCareCard>}
    <FormNotice error message={error??action.error}/>
<AdminFormActions><AppButton label="Confirmar y publicar turnos" loading={action.loading} disabled={!professional||!days.length} onPress={()=>void publish()}/></AdminFormActions>
   </>}
   {section==='published'&&<><AppText muted>Los días marcados tienen turnos disponibles para {serviceName}. Tocá un día para revisar sus horarios. Desactivarlos no cancela reservas existentes.</AppText><QueryState {...schedule}/>{activeSlots.length?<PublishedScheduleCalendar slots={activeSlots} selectedDate={selectedScheduleDay} onSelect={setSelectedScheduleDay}/>:<PetCareEmptyState title="Todavía no hay turnos publicados" message="Elegí días, período y horario en Publicar turnos." icon="calendar-outline"/>}{Boolean(inactiveSlots.length)&&
<AdminFormSection title={`Horarios futuros desactivados (${inactiveSlots.length})`} description="Podés reactivarlos si el profesional y el servicio siguen disponibles y no hay conflictos.">{inactiveSlots.map(slot=><PetCareCard key={String(slot.id)}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><AppText style={{flex:1}}>{clinicDateTime(String(slot.startsAt))} · {serviceName}</AppText><Pressable accessibilityRole="button" accessibilityLabel="Quitar horario desactivado de la lista" disabled={action.loading} onPress={()=>setArchiveId(String(slot.id))} style={{padding:10,opacity:action.loading?0.5:1}}><Ionicons name="trash-outline" size={21} color={colors.danger}/></Pressable><AppButton compact label="Reactivar horario" disabled={action.loading} onPress={()=>setRestoreId(`slot:${String(slot.id)}`)}/></View></PetCareCard>)}</AdminFormSection>}</>}
   {section==='blocks'&&<><AppText muted>Bloqueá ausencias o franjas en las que el profesional no atenderá. Los turnos existentes se conservan.</AppText>
    
<AdminFormSection title="Nuevo bloqueo" description="Usá el bloqueo para registrar ausencias sin eliminar turnos existentes." columns={2}><AdminFormField><ClinicDateTimeField label="Inicio" value={blockFrom} disabled={action.loading} onChange={setBlockFrom}/></AdminFormField><AdminFormField><ClinicDateTimeField label="Fin" value={blockTo} disabled={action.loading} onChange={setBlockTo}/></AdminFormField><AdminFormField fullWidth><AppInput label="Motivo" required maxLength={200} value={blockReason} onChangeText={setBlockReason}/></AdminFormField><AdminFormField fullWidth><FormNotice error message={blockError}/></AdminFormField><AdminFormField fullWidth>
<AdminFormActions><AppButton label="Guardar bloqueo" variant="secondary" disabled={!professional||action.loading} loading={action.loading} onPress={()=>void saveBlock()}/></AdminFormActions></AdminFormField></AdminFormSection>
    <QueryState {...schedule}/>{activeBlocks.length?activeBlocks.map(block=><PetCareCard key={String(block.id)}><AppText variant="subtitle">{clinicDateTime(String(block.startsAt))} – {clinicDateTime(String(block.endsAt))}</AppText>{Boolean(block.reason)&&<AppText>{String(block.reason)}</AppText>}<AppButton compact label="Finalizar bloqueo" variant="secondary" onPress={()=>setDisableId(`block:${String(block.id)}`)}/></PetCareCard>):<PetCareEmptyState title="No hay bloqueos activos" message="Cuando el profesional tenga una ausencia, podés registrarla acá."/>}{Boolean(inactiveBlocks.length)&&
<AdminFormSection title={`Bloqueos futuros finalizados (${inactiveBlocks.length})`} description="Reactivarlos impedirá nuevas reservas en ese período, siempre que no haya turnos vigentes.">{inactiveBlocks.map(block=><PetCareCard key={String(block.id)}><AppText variant="subtitle">{clinicDateTime(String(block.startsAt))} – {clinicDateTime(String(block.endsAt))}</AppText>{Boolean(block.reason)&&<AppText>{String(block.reason)}</AppText>}<AppButton compact label="Reactivar bloqueo" onPress={()=>setRestoreId(`block:${String(block.id)}`)}/></PetCareCard>)}</AdminFormSection>}</>}
   <AppButton label="Cerrar" variant="secondary" disabled={action.loading} onPress={onClose}/>
  </AppModal><AppModal size="wide" visible={Boolean(selectedScheduleDay)} dismissible onClose={()=>setSelectedScheduleDay('')}>
   <AppText variant="title">Turnos · {selectedScheduleDay&&clinicDate(selectedScheduleDay)}</AppText>
   <AppText muted>{selectedDaySlots.length} {selectedDaySlots.length===1?'turno disponible':'turnos disponibles'} para {serviceName}. Las reservas existentes se conservan.</AppText>
   {selectedDaySlots.length>0&&<AppButton compact label="Desactivar todos los turnos de este día" variant="secondary" destructive onPress={()=>setDisableId(`day:${selectedScheduleDay}`)}/>}
   {selectedDaySlots.length?selectedDaySlots.map(slot=><PetCareCard key={slot.id}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
     <View style={{flex:1,minWidth:0}}><AppText variant="subtitle">{clinicDateTime(String(slot.startsAt)).split(' ')[1]}</AppText><AppText variant="caption" muted>{clinicDateTime(String(slot.endsAt)).split(' ')[1]} · {serviceName}</AppText></View>
     <AppButton compact label="Desactivar" variant="secondary" onPress={()=>setDisableId(`slot:${String(slot.id)}`)}/>
    </View>
   </PetCareCard>):<PetCareEmptyState title="No hay turnos activos para este día"/>}
   <AppButton label="Cerrar" variant="secondary" onPress={()=>setSelectedScheduleDay('')}/>
  </AppModal><ConfirmModal visible={Boolean(disableId)} title={disablingBlock?'Finalizar bloqueo':disablingDay?'Desactivar todos los turnos del día':'Desactivar turno'} message={disablingBlock?'El bloqueo dejará de impedir la creación de nuevos turnos.':disablingDay?`Se dejarán de ofrecer ${selectedDaySlots.length} turnos de ${serviceName} para el ${clinicDate(disableTarget[1]??'')}. Las reservas existentes no se cancelan.`:'Este turno dejará de ofrecerse. Si tiene una reserva, primero habrá que reprogramarla o cancelarla.'} destructive confirmLabel={disablingBlock?'Finalizar bloqueo':disablingDay?'Desactivar todos':'Desactivar turno'} onCancel={()=>setDisableId('')} onConfirm={async()=>{const [kind,id]=disableId.split(':');if(kind==='day'){for(const slot of selectedDaySlots)await api.disableAvailability('slot',String(slot.id));}else await api.disableAvailability(kind,id);setDisableId('');showToast(kind==='block'?'Bloqueo finalizado':kind==='day'?'Turnos del día desactivados':'Turno desactivado','success');schedule.reload();}} /><ConfirmModal visible={Boolean(restoreId)} title={restoreId.startsWith('block:')?'Reactivar bloqueo':'Reactivar horario'} message={restoreId.startsWith('block:')?'El bloqueo volverá a impedir nuevas reservas en ese período. Se verificará que no haya turnos vigentes.':'El horario volverá a ofrecerse para reservas. Se verificará que el profesional y el servicio estén disponibles y que no haya conflictos.'} confirmLabel="Reactivar" onCancel={()=>setRestoreId('')} onConfirm={async()=>{const [kind,id]=restoreId.split(':');const restored=await action.run(()=>api.setAvailabilityActive(kind,id,true));if(restored){setRestoreId('');showToast(kind==='block'?'Bloqueo reactivado':'Horario reactivado','success');schedule.reload();}}} /><ConfirmModal visible={Boolean(archiveId)} title="Quitar horario desactivado" message="¿Querés quitar este horario de la lista? Se conservarán el horario y su historial asociado." confirmLabel="Quitar horario" destructive onCancel={()=>setArchiveId('')} onConfirm={async()=>{const archived=await action.run(()=>api.archiveAvailability(archiveId));if(archived){setArchiveId('');showToast('Horario quitado de la lista','success');schedule.reload();}}} /><FormNotice error message={restoreId||archiveId?action.error:null}/></>;
}

// Función isFutureAvailability: comprueba una regla o condición dentro de este módulo.
function isFutureAvailability(value:unknown){if(typeof value!=='string')return false;const parsed=new Date(value.includes('T')?value:`${value.replace(' ','T')}Z`);return !Number.isNaN(parsed.getTime())&&parsed.getTime()>Date.now();}

// Función clinicDayKey: concentra la lógica dentro de este módulo.
function clinicDayKey(value:string){const date=clinicDate(value).split('/');return date.length===3?`${date[2]}-${date[1]}-${date[0]}`:'';}

// Función PublishedScheduleCalendar: concentra la lógica dentro de este módulo.
function PublishedScheduleCalendar({slots,selectedDate,onSelect}:{slots:ClinicRow[];selectedDate:string;onSelect:(date:string)=>void}){
 const {colors}=useTheme();
 const [month,setMonth]=useState(()=>clinicToday().slice(0,7));
 const [year,monthNumber]=month.split('-').map(Number);
 const firstDay=new Date(Date.UTC(year,monthNumber-1,1));
 const offset=(firstDay.getUTCDay()+6)%7;
 const daysInMonth=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
 const cellCount=Math.ceil((offset+daysInMonth)/7)*7;
 const dayCounts=new Map<string,number>();
 for(const slot of slots){const key=clinicDayKey(String(slot.startsAt));dayCounts.set(key,(dayCounts.get(key)??0)+1);}
 const monthLabel=new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric',timeZone:'UTC'}).format(firstDay);
 // Función shiftMonth: agrupa una operación que este módulo puede ejecutar o reutilizar.
const shiftMonth=(amount:number)=>{const shifted=new Date(Date.UTC(year,monthNumber-1+amount,1));setMonth(`${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth()+1).padStart(2,'0')}`);};
 const dayNames=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
 return <PetCareCard>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
   <AppButton compact label="‹" variant="secondary" accessibilityLabel="Mes anterior" onPress={()=>shiftMonth(-1)}/>
   <AppText variant="subtitle" style={{textTransform:'capitalize'}}>{monthLabel}</AppText>
   <AppButton compact label="›" variant="secondary" accessibilityLabel="Mes siguiente" onPress={()=>shiftMonth(1)}/>
  </View>
  <View style={{flexDirection:'row'}}>{dayNames.map(day=><View key={day} style={{flex:1,alignItems:'center',paddingVertical:5}}><AppText variant="caption" muted>{day}</AppText></View>)}</View>
  <View style={{flexDirection:'row',flexWrap:'wrap'}}>{Array.from({length:cellCount},(_,index)=>{
   const day=index-offset+1;const inMonth=day>0&&day<=daysInMonth;const key=inMonth?`${month}-${String(day).padStart(2,'0')}`:'';const count=dayCounts.get(key)??0;const selected=key===selectedDate;
   return <Pressable key={index} accessibilityRole="button" accessibilityLabel={inMonth?`${day} ${monthLabel}${count?`, ${count} turnos`:''}`:undefined} accessibilityState={{selected,disabled:!inMonth}} disabled={!inMonth} onPress={()=>onSelect(key)} style={{width:'14.2857%',minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:selected?colors.primary:count?colors.accent:'transparent',opacity:inMonth?1:0.25}}>
    {inMonth&&<><AppText style={{color:selected?colors.onPrimary:colors.text}}>{day}</AppText>{count>0&&<View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:2}}><View style={{width:5,height:5,borderRadius:3,backgroundColor:selected?colors.onPrimary:colors.primary}}/><AppText variant="caption" style={{fontSize:10,color:selected?colors.onPrimary:colors.primary}}>{count}</AppText></View>}</>}
   </Pressable>;
  })}</View>
  <AppText variant="caption" muted>El número indica cuántos turnos activos hay ese día.</AppText>
 </PetCareCard>;
}

