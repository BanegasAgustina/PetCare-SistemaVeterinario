import { View } from 'react-native';
import { ImageUploadField } from './ImageUploadField';
import { PetImage } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';

export type PickedProfilePhoto={uri:string;url:string};
export function ProfilePhotoInput({currentUri,photo,onSelect,onRemove,disabled=false,allowCamera=false,removable=true,size=100,targetUserId}:{currentUri:string|null;photo:PickedProfilePhoto|null;onSelect:(photo:PickedProfilePhoto)=>void;onRemove:()=>void;disabled?:boolean;allowCamera?:boolean;removable?:boolean;size?:number;targetUserId?:string}){
  void allowCamera;
  const value=photo?.url??currentUri;
  return <View style={{gap:8}}><AppText variant="caption" muted>Foto de perfil del profesional</AppText><PetImage uri={value} size={size}/><ImageUploadField label="Foto de perfil" kind="profile" aspect={[1,1]} value={value} targetUserId={targetUserId} disabled={disabled} showProgress onChange={url=>{if(url)onSelect({uri:url,url});else onRemove();}}/>{removable&&photo&&<AppText variant="caption" muted>La imagen seleccionada reemplazará la foto al guardar.</AppText>}</View>;
}
