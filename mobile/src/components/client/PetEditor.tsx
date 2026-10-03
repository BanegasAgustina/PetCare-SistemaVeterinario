import { useCallback,useRef,useState } from 'react';
import { Image,View,StyleSheet,Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
const empty:PetValues={name:'',speciesId:'',breedId:'',breedName:'',birthDate:'',microchipNumber:'',photoUrl:'',weightKg:''};
export function PetEditor({id}:{id?:string}) {
  const api=useClient();const action=useAsyncAction();const {showToast}=useFeedback();const {colors}=useTheme();
  const [values,setValues]=useState<PetValues>(empty);
  const [errors,setErrors]=useState<Partial<Record<keyof PetValues,string>>>({});
  const [photo,setPhoto]=useState<{uri:string;base64:string}|null>(null);
  const [picking,setPicking]=useState(false);const pickerBusy=useRef(false);
  const load=useCallback(async()=>{
    const catalog=await api.petCatalog();const pet=id?await api.pet(id):null;
    if(pet)setValues({name:pet.name,speciesId:pet.speciesId,breedId:pet.breedId??'',breedName:pet.breed??'',birthDate:pet.birthDate??'',microchipNumber:pet.microchipNumber??'',photoUrl:pet.photoUrl??'',weightKg:pet.weightKg??''});
    return {catalog,pet};
  },[api,id]);const query=useClientQuery(load);const disabled=action.loading||picking;
  function change(key:keyof PetValues,value:string) {
    setValues(v=>({...v,[key]:value,...(key==='speciesId'||key==='breedName'?{breedId:''}:{})}));
    setErrors(e=>({...e,[key]:undefined}));
  }
  async function choosePhoto() {
    if(pickerBusy.current||action.loading)return;pickerBusy.current=true;setPicking(true);setErrors(e=>({...e,photoUrl:undefined}));
    try {
      if(Platform.OS!=='web') {
        const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
        if(!permission.granted){setErrors(e=>({...e,photoUrl:'Permití el acceso a la galería desde los ajustes del teléfono para elegir una foto.'}));return;}
      }
      const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.8,base64:true});
      if(result.canceled)return;
      const asset=result.assets[0];
      if(!asset?.base64||asset.base64.length>7_000_000||(asset.fileSize??0)>5*1024*1024||asset.width*asset.height>25_000_000){setErrors(e=>({...e,photoUrl:'Elegí una foto de hasta 5 MB y 25 megapíxeles.'}));return;}
      setPhoto({uri:asset.uri,base64:asset.base64});
    }catch {setErrors(e=>({...e,photoUrl:'No pudimos abrir la foto. Intentá elegir otra imagen.'}));}
    finally {pickerBusy.current=false;setPicking(false);}
  }
  function save() {
    if(disabled)return;const next:typeof errors={};
    if(!values.name.trim()||values.name.trim().length>100)next.name='Ingresá un nombre de hasta 100 caracteres.';
    if(!values.speciesId)next.speciesId='Seleccioná una especie.';
    if((values.breedName??'').trim().length>100)next.breedName='La raza admite hasta 100 caracteres.';
    if(values.birthDate&&!validPetDate(values.birthDate))next.birthDate='Seleccioná una fecha válida, sin fechas futuras.';
    if(values.weightKg&&(!/^\d+(\.\d{1,2})?$/.test(values.weightKg)||Number(values.weightKg)<=0||Number(values.weightKg)>9999.99))next.weightKg='Ingresá un peso mayor a 0, de hasta 9999,99 kg y dos decimales.';
    if(values.microchipNumber.trim().length>32)next.microchipNumber='El microchip admite hasta 32 caracteres.';
    setErrors(next);if(Object.keys(next).length)return;
    void action.run(async()=>{
      const saved=await api.savePet({...values,name:values.name.trim(),breedName:values.breedName?.trim(),microchipNumber:values.microchipNumber.trim(),...(photo?{photoBase64:photo.base64}:{})},id);
      showToast(id?'Mascota actualizada':'Mascota agregada','success');
      router.replace({pathname:'/client/pets/[id]',params:{id:saved.id}});
    });
  }
  const preview=photo?.uri||values.photoUrl;
  return <PetCareScreen><PetCareHeader title={id?'Editar mascota':'Agregar mascota'} back/><QueryState {...query}/>{query.data&&!query.loading&&!query.error&&<>
    {!query.data.catalog.species.length?<PetCareEmptyState title="No hay especies disponibles" message="El catálogo debe ser configurado por la clínica antes de registrar una mascota."/>:<>
      <PetCareCard><AppText variant="subtitle">Foto de la mascota</AppText><View style={styles.photoSection}><View style={[styles.photo,{backgroundColor:colors.accent}]}>
        {preview?<Image source={{uri:preview}} style={styles.photo} accessibilityLabel="Foto de la mascota" onError={()=>setErrors(e=>({...e,photoUrl:'No pudimos mostrar la foto. Podés elegir otra imagen.'}))}/>:<Ionicons name="paw-outline" size={54} color={colors.primary} accessible={false}/>}
      </View></View>
      <AppButton variant="secondary" label={preview?'Cambiar foto':'Elegir de la galería'} loading={picking} disabled={action.loading} onPress={()=>void choosePhoto()}/>
      {Boolean(preview)&&<AppButton variant="secondary" label="Quitar foto" disabled={disabled} onPress={()=>{setPhoto(null);change('photoUrl','');}}/>}<FormNotice error message={errors.photoUrl??null}/></PetCareCard>
      <PetCareCard><AppInput label="Nombre" value={values.name} error={errors.name} maxLength={100} editable={!disabled} onChangeText={v=>change('name',v)}/>
      <AppText variant="subtitle">Especie</AppText><FormNotice error message={errors.speciesId??null}/>{query.data.catalog.species.map(s=><SelectionRow radio key={s.id} label={s.name} checked={s.id===values.speciesId} disabled={disabled} onPress={()=>change('speciesId',s.id)}/>)}
      <AppInput label="Raza (opcional)" placeholder="Escribí la raza de tu mascota" value={values.breedName??''} error={errors.breedName} maxLength={100} editable={!disabled} onChangeText={v=>change('breedName',v)}/>
      <PetBirthDate value={values.birthDate} disabled={disabled} onChange={v=>change('birthDate',v)}/><FormNotice error message={errors.birthDate??null}/>
      <AppInput label="Peso en kg (opcional)" value={values.weightKg} error={errors.weightKg} keyboardType="decimal-pad" maxLength={8} editable={!disabled} onChangeText={v=>change('weightKg',v.replace(',','.'))}/>
      <AppInput label="Microchip (opcional)" value={values.microchipNumber} error={errors.microchipNumber} maxLength={32} editable={!disabled} onChangeText={v=>change('microchipNumber',v)}/></PetCareCard>
      <FormNotice error message={action.error}/><AppButton label={id?'GUARDAR CAMBIOS':'AGREGAR MASCOTA'} loading={action.loading} disabled={picking} onPress={save}/>
    </>}
  </>}</PetCareScreen>;
}
const styles=StyleSheet.create({photoSection:{alignItems:'center',paddingVertical:8},photo:{width:132,height:132,borderRadius:66,alignItems:'center',justifyContent:'center',overflow:'hidden'}});
