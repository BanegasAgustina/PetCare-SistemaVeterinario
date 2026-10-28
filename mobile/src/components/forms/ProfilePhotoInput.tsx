// Este archivo se encarga de lo siguiente: Control de formulario reutilizable; captura o valida datos ingresados en la aplicación.

import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';
import { PetImage } from '../client/PetCareUI';
import { isValidProfilePhotoAsset } from '../../utils/profile-photo';

// Tipo PickedProfilePhoto: define la forma o las opciones válidas de los datos usados por este módulo.
export type PickedProfilePhoto={uri:string;base64:string};
// Función ProfilePhotoInput: concentra la lógica dentro de este módulo.
export function ProfilePhotoInput({currentUri,photo,onSelect,onRemove,disabled=false,allowCamera=false,removable=true,size=100}:{currentUri:string|null;photo:PickedProfilePhoto|null;onSelect:(photo:PickedProfilePhoto)=>void;onRemove:()=>void;disabled?:boolean;allowCamera?:boolean;removable?:boolean;size?:number}) {
  const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(false);const [settingsRequired,setSettingsRequired]=useState(false);
  // Función choose: concentra la lógica dentro de este módulo.
async function choose(source:'gallery'|'camera'){if(loading||disabled)return;setLoading(true);setError(null);try{
    setSettingsRequired(false);
    if(source==='camera'&&Platform.OS==='web'){setError('La cámara está disponible desde la app móvil.');return;}
    if(source==='camera'||Platform.OS!=='web'){const permission=source==='camera'?await ImagePicker.requestCameraPermissionsAsync():await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted){setSettingsRequired(true);setError(source==='camera'?'No se concedió acceso a la cámara. Podés habilitarlo desde los ajustes del dispositivo.':'No se concedió acceso a la galería. Podés elegir la foto desde los ajustes del dispositivo.');return;}}
    const options={mediaTypes:['images' as const],allowsEditing:true,aspect:[1,1] as [number,number],quality:0.8,base64:true};
    const result=source==='camera'?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);if(result.canceled)return;
    const asset=result.assets[0];if(!asset||!isValidProfilePhotoAsset(asset)){setError('Elegí una imagen de hasta 5 MB y 25 megapíxeles.');return;}
    onSelect({uri:asset.uri,base64:asset.base64!});
  }catch{setError('No pudimos abrir la imagen. Intentá elegir otra.');}finally{setLoading(false);}}
  return <>
    <AppText variant="caption" muted>Foto de perfil del profesional</AppText>
    <PetImage uri={photo?.uri??currentUri} size={size}/>
    <AppButton variant="secondary" label={photo||currentUri?'Elegir otra foto':'Elegir foto'} disabled={disabled||loading} loading={loading} onPress={()=>void choose('gallery')}/>
    {allowCamera&&Platform.OS!=='web'&&<AppButton variant="secondary" label="Tomar foto con la cámara" disabled={disabled||loading} onPress={()=>void choose('camera')}/>}
    {settingsRequired&&Platform.OS!=='web'&&<AppButton variant="secondary" label="Abrir ajustes" onPress={()=>void Linking.openSettings()}/>}
    {removable&&Boolean(photo||currentUri)&&<AppButton variant="secondary" label="Quitar foto" disabled={disabled||loading} onPress={()=>{setError(null);onRemove();}}/>}
    <FormNotice error message={error}/>
  </>;
}
