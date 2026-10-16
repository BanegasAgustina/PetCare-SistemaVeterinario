import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';
import { PetImage } from '../client/PetCareUI';

export type PickedProfilePhoto={uri:string;base64:string};
export function ProfilePhotoInput({currentUri,photo,onSelect,onRemove,disabled=false}:{currentUri:string|null;photo:PickedProfilePhoto|null;onSelect:(photo:PickedProfilePhoto)=>void;onRemove:()=>void;disabled?:boolean}) {
  const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(false);
  async function choose(){if(loading||disabled)return;setLoading(true);setError(null);try{
    if(Platform.OS!=='web'){const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted){setError('Permití el acceso a la galería para elegir una foto.');return;}}
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.8,base64:true});if(result.canceled)return;
    const asset=result.assets[0];if(!asset?.base64||asset.base64.length>7_000_000||(asset.fileSize??0)>5*1024*1024||asset.width*asset.height>25_000_000){setError('Elegí una imagen de hasta 5 MB y 25 megapíxeles.');return;}
    onSelect({uri:asset.uri,base64:asset.base64});
  }catch{setError('No pudimos abrir la imagen. Intentá elegir otra.');}finally{setLoading(false);}}
  return <>
    <AppText variant="caption" muted>Foto de perfil del profesional</AppText>
    <PetImage uri={photo?.uri??currentUri}/>
    <AppButton variant="secondary" label={photo||currentUri?'Elegir otra foto':'Elegir foto'} disabled={disabled||loading} loading={loading} onPress={()=>void choose()}/>
    {Boolean(photo||currentUri)&&<AppButton variant="secondary" label="Quitar foto" disabled={disabled||loading} onPress={()=>{setError(null);onRemove();}}/>}
    <FormNotice error message={error}/>
  </>;
}
