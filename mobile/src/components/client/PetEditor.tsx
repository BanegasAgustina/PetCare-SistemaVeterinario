/**
 * Formulario de alta o edición según el id recibido. Carga mascotas y catálogos mediante useClient, selecciona foto con ImagePicker y envía cambios al backend; los errores se muestran inline.
 */
import { useCallback,useRef,useState,type ComponentRef } from 'react';
import { Image,Pressable,TextInput,View,StyleSheet,Platform } from 'react-native';
import { Ionicons,MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator as ImageProcessor, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,QueryState } from './PetCareUI';
import { AppInput } from '../forms/AppInput';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';
import { SelectionRow } from '../ui/SelectionRow';
import { PetBirthDate } from './PetBirthDate';
import { validPetDate } from '../../utils/pet-date';
import type { PetValues } from '../../types/client';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { firstInvalidField } from '../../utils/auth-validation';
async function compressPetPhoto(uri:string,originalWidth:number,originalHeight:number){
  for(const [maxDimension,quality] of [[1200,0.82],[900,0.7],[640,0.55]] as const){
    const scale=Math.min(1,maxDimension/Math.max(originalWidth,originalHeight));
    const width=Math.max(1,Math.round(originalWidth*scale));
    const height=Math.max(1,Math.round(originalHeight*scale));
    const context=ImageProcessor.manipulate(uri,{maxWidth:width,maxHeight:height});
    try {
      const image=await context.resize({width,height}).renderAsync();
      try {
        const result=await image.saveAsync({format:SaveFormat.JPEG,compress:quality,base64:true});
        if(result.base64&&result.base64.length<=6_990_508)return result;
      } finally {image.release();}
    } finally {context.release();}
  }
  return null;
}
const empty:PetValues={name:'',sex:'',speciesId:'',breedId:'',breedName:'',birthDate:'',microchipNumber:'',photoUrl:'',weightKg:''};
export function PetEditor({id}:{id?:string}) {
  const api=useClient();const action=useAsyncAction();const {showToast}=useFeedback();const {colors}=useTheme();
  const [values,setValues]=useState<PetValues>(empty);
  const [errors,setErrors]=useState<Partial<Record<keyof PetValues,string>>>({});
  const inputRefs=useRef<Partial<Record<'name'|'breedName'|'weightKg'|'microchipNumber',ComponentRef<typeof TextInput>|null>>>({});
  const [photo,setPhoto]=useState<{uri:string;base64:string}|null>(null);
  const [initialValues,setInitialValues]=useState(JSON.stringify(empty));
  const [picking,setPicking]=useState(false);const pickerBusy=useRef(false);
  const load=useCallback(async()=>{
    const catalog=await api.petCatalog();const pet=id?await api.pet(id):null;
    if(pet){const loaded:PetValues={name:pet.name,sex:pet.sex??'',speciesId:pet.speciesId,breedId:pet.breedId??'',breedName:pet.breed??'',birthDate:pet.birthDate??'',microchipNumber:pet.microchipNumber??'',photoUrl:pet.photoUrl??'',weightKg:pet.weightKg??''};setValues(loaded);setInitialValues(JSON.stringify(loaded));}
    return {catalog,pet};
  },[api,id]);const query=useClientQuery(load);const disabled=action.loading||picking;
  function change(key:keyof PetValues,value:string) {
    setValues(v=>({...v,[key]:value,...(key==='speciesId'||key==='breedName'?{breedId:''}:{})}));
    setErrors(e=>({...e,[key]:undefined}));
  }
  async function choosePhoto(source:'gallery'|'camera') {
    if(pickerBusy.current||action.loading)return;pickerBusy.current=true;setPicking(true);setErrors(e=>({...e,photoUrl:undefined}));
    try {
      if(source==='camera'&&Platform.OS==='web'){setErrors(e=>({...e,photoUrl:'La cámara está disponible desde la app móvil.'}));return;}
      if(source==='camera') {
        const permission=await ImagePicker.requestCameraPermissionsAsync();
        if(!permission.granted){setErrors(e=>({...e,photoUrl:'Permití el acceso a la cámara desde los ajustes del teléfono.'}));return;}
      } else if(Platform.OS!=='web') {
        const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
        if(!permission.granted){setErrors(e=>({...e,photoUrl:'Permití el acceso a la galería desde los ajustes del teléfono para elegir una foto.'}));return;}
      }
      const options={mediaTypes:['images' as const],allowsEditing:true,aspect:[1,1] as [number,number],quality:0.9};
      const result=source==='camera'?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);
      if(result.canceled)return;
      const asset=result.assets[0];
      if(!asset?.uri||!asset.width||!asset.height){setErrors(e=>({...e,photoUrl:'No pudimos leer esta foto. Intentá con otra imagen.'}));return;}
      const compressed=await compressPetPhoto(asset.uri,asset.width,asset.height);
      if(!compressed?.base64){setErrors(e=>({...e,photoUrl:'No pudimos preparar esta foto. Intentá elegir otra imagen.'}));return;}
      setPhoto({uri:compressed.uri,base64:compressed.base64});
    }catch {setErrors(e=>({...e,photoUrl:'No pudimos abrir la foto. Intentá elegir otra imagen.'}));}
    finally {pickerBusy.current=false;setPicking(false);}
  }
  const hasUnsavedChanges=JSON.stringify(values)!==initialValues||Boolean(photo);
  const {confirmation:unsavedChangesPrompt,allowNavigation}=useUnsavedChangesGuard(hasUnsavedChanges);
  function save() {
    if(disabled)return;const next:typeof errors={};
    if(!values.name.trim()||values.name.trim().length>100)next.name='Ingresá un nombre de hasta 100 caracteres.';
    if(!values.sex)next.sex='Seleccioná el sexo de tu mascota.';
    if(!values.speciesId)next.speciesId='Seleccioná una especie.';
    if((values.breedName??'').trim().length>100)next.breedName='La raza admite hasta 100 caracteres.';
    if(values.birthDate&&!validPetDate(values.birthDate))next.birthDate='Seleccioná una fecha válida, sin fechas futuras.';
    if(values.weightKg&&(!/^\d+(\.\d{1,2})?$/.test(values.weightKg)||Number(values.weightKg)<=0||Number(values.weightKg)>9999.99))next.weightKg='Ingresá un peso mayor a 0, de hasta 9999,99 kg y dos decimales.';
    if(values.microchipNumber.trim().length>32)next.microchipNumber='El microchip admite hasta 32 caracteres.';
    setErrors(next);if(Object.keys(next).length){const firstInvalid=firstInvalidField(['name','speciesId','sex','breedName','birthDate','weightKg','microchipNumber'] as const,next);if(firstInvalid==='name'||firstInvalid==='breedName'||firstInvalid==='weightKg'||firstInvalid==='microchipNumber')setTimeout(()=>inputRefs.current[firstInvalid]?.focus(),0);return;}
    void action.run(async()=>{
      const saved=await api.savePet({...values,name:values.name.trim(),breedName:values.breedName?.trim(),microchipNumber:values.microchipNumber.trim(),...(photo?{photoBase64:photo.base64}:{})},id);
      setInitialValues(JSON.stringify(values));setPhoto(null);
      showToast(id?'Mascota actualizada':'Mascota agregada','success');
      allowNavigation();
      router.replace({pathname:'/client/pets/[id]',params:{id:saved.id}});
    });
  }
  const preview=photo?.uri||values.photoUrl;
  return <PetCareScreen><PetCareHeader title={id?'Editar mascota':'Agregar mascota'} back/><QueryState {...query}/>{query.data&&!query.loading&&!query.error&&<>
    {!query.data.catalog.species.length?<PetCareEmptyState title="No hay especies disponibles" message="El catálogo debe ser configurado por la clínica antes de registrar una mascota."/>:<>
      <PetCareCard><AppText variant="subtitle">Foto de la mascota</AppText><View style={styles.photoSection}><View style={[styles.photo,{backgroundColor:colors.accent}]}>
        {preview?<Image source={{uri:preview}} style={styles.photo} accessibilityLabel="Foto de la mascota" onError={()=>setErrors(e=>({...e,photoUrl:'No pudimos mostrar la foto. Podés elegir otra imagen.'}))}/>:<Ionicons name="paw-outline" size={54} color={colors.primary} accessible={false}/>}
      </View></View>
      <AppButton variant="secondary" label={preview?'Cambiar foto desde la galería':'Elegir de la galería'} loading={picking} disabled={action.loading} onPress={()=>void choosePhoto('gallery')}/>
      {Platform.OS!=='web'&&<AppButton variant="secondary" label="Tomar foto con la cámara" loading={picking} disabled={action.loading} onPress={()=>void choosePhoto('camera')}/>}
      {Boolean(preview)&&<AppButton variant="secondary" label="Quitar foto" disabled={disabled} onPress={()=>{setPhoto(null);change('photoUrl','');}}/>}<FormNotice error message={errors.photoUrl??null}/></PetCareCard>
      <PetCareCard><AppInput ref={input=>{inputRefs.current.name=input;}} label="Nombre" required value={values.name} error={errors.name} maxLength={100} editable={!disabled} onChangeText={v=>change('name',v)}/>
      <AppText variant="subtitle" accessibilityLabel="Especie, obligatorio">Especie *</AppText><View style={styles.speciesOptions}>{query.data.catalog.species.map(s=>{const name=s.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');const icon=name.includes('perro')||name.includes('dog')?'dog':name.includes('gato')||name.includes('cat')?'cat':'paw';return <Pressable key={s.id} accessibilityRole="radio" accessibilityLabel={s.name} accessibilityState={{checked:s.id===values.speciesId}} disabled={disabled} onPress={()=>change('speciesId',s.id)} style={[styles.speciesChoice,{backgroundColor:s.id===values.speciesId?colors.accent:colors.surface,borderColor:s.id===values.speciesId?colors.primary:colors.border}]}><MaterialCommunityIcons name={icon} size={46} color={s.id===values.speciesId?colors.primary:colors.muted}/><AppText variant="caption" style={{fontWeight:'700'}}>{s.name}</AppText>{s.id===values.speciesId&&<View style={[styles.speciesSelected,{backgroundColor:colors.primary}]}><Ionicons name="checkmark" size={13} color={colors.onPrimary}/></View>}</Pressable>;})}</View><FormNotice error message={errors.speciesId??null}/>
      <AppText variant="subtitle" accessibilityLabel="Sexo, obligatorio">Sexo *</AppText>{([{value:'FEMALE',label:'Hembra'},{value:'MALE',label:'Macho'},{value:'UNKNOWN',label:'No lo sé'}] as const).map(option=><SelectionRow radio key={option.value} label={option.label} checked={values.sex===option.value} disabled={disabled} onPress={()=>change('sex',option.value)}/>) }<FormNotice error message={errors.sex??null}/>
      <AppInput ref={input=>{inputRefs.current.breedName=input;}} label="Raza (opcional)" placeholder="Escribí la raza de tu mascota" value={values.breedName??''} error={errors.breedName} maxLength={100} editable={!disabled} onChangeText={v=>change('breedName',v)}/>
      <PetBirthDate value={values.birthDate} disabled={disabled} onChange={v=>change('birthDate',v)}/><FormNotice error message={errors.birthDate??null}/>
      <AppInput ref={input=>{inputRefs.current.weightKg=input;}} label="Peso en kg (opcional)" value={values.weightKg} error={errors.weightKg} keyboardType="decimal-pad" maxLength={8} editable={!disabled} onChangeText={v=>change('weightKg',v.replace(',','.'))}/>
      <AppInput ref={input=>{inputRefs.current.microchipNumber=input;}} label="Microchip (opcional)" value={values.microchipNumber} error={errors.microchipNumber} maxLength={32} editable={!disabled} onChangeText={v=>change('microchipNumber',v)}/></PetCareCard>
      <FormNotice error message={action.error}/><AppButton label={id?'GUARDAR CAMBIOS':'AGREGAR MASCOTA'} loading={action.loading} disabled={picking} onPress={save}/>
    </>}
  </>}{unsavedChangesPrompt}</PetCareScreen>;
}
const styles=StyleSheet.create({photoSection:{alignItems:'center',paddingVertical:8},photo:{width:132,height:132,borderRadius:66,alignItems:'center',justifyContent:'center',overflow:'hidden'},speciesOptions:{flexDirection:'row',flexWrap:'wrap',gap:12},speciesChoice:{position:'relative',width:116,minHeight:114,borderWidth:2,borderRadius:20,alignItems:'center',justifyContent:'center',gap:6,padding:12},speciesSelected:{position:'absolute',top:8,right:8,width:22,height:22,borderRadius:11,alignItems:'center',justifyContent:'center'}});
