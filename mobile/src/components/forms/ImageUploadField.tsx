/**
 * ARCHIVO: ImageUploadField.tsx
 * UBICACIÓN: mobile/src/components/forms/ImageUploadField.tsx
 * FUNCIÓN: Campo para elegir, preparar y cargar imágenes a almacenamiento externo firmado.
 * RESPONSABILIDAD: Gestionar fotos de mascotas/perfiles y recursos de productos, servicios y banners.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/forms/ProfilePhotoInput.tsx
 * FUNCIONAMIENTO: Solicita firma al backend con la sesión, limita tipo/tamaño/píxeles, prepara recorte, informa progreso y entrega referencia pública mediante onChange.
 * IMPORTANCIA: Mantiene la firma en PetCare y evita enviar la clave de almacenamiento desde el cliente.
 */
import { useState } from 'react';
import { Image,Platform,View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator,SaveFormat } from 'expo-image-manipulator';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';

type Kind='banner'|'product'|'service'|'pet'|'profile';
type Signature={uploadUrl:string;cloudName:string;apiKey:string;signature:string;params:Record<string,string|number|boolean>;maxBytes:number;maxPixels:number};
type Props={label:string;kind:Kind;value:string|null;onChange:(value:string|null)=>void;aspect?:[number,number];previewSize?:number;showPreview?:boolean;targetUserId?:string;disabled?:boolean;error?:string;showProgress?:boolean;onUploadingChange?:(busy:boolean)=>void};
const MAX_SOURCE_BYTES=30*1024*1024;

/** Calcula un recorte centrado que ajusta la imagen a la proporción solicitada. */
function cropForAspect(width:number,height:number,aspect:number){
  if(width/height>aspect){const cropWidth=Math.round(height*aspect);return {originX:Math.round((width-cropWidth)/2),originY:0,width:cropWidth,height};}
  const cropHeight=Math.round(width/aspect);return {originX:0,originY:Math.round((height-cropHeight)/2),width,height:cropHeight};
}
/** Recorta, redimensiona y convierte la imagen a WebP antes de subirla. */
async function prepareImage(uri:string,width:number,height:number,aspect:number){
  const crop=cropForAspect(width,height,aspect);
  const context=ImageManipulator.manipulate(uri);
  try {const rendered=await context.crop(crop).resize({width:1600}).renderAsync();try{return await rendered.saveAsync({format:SaveFormat.WEBP,compress:.82});}finally{rendered.release();}}
  finally{context.release();}
}
/** Envía el archivo y los parámetros firmados como multipart/form-data y reporta progreso. */
function uploadFile(signature:Signature,uri:string,onProgress:(value:number)=>void){
  return new Promise<{public_id:string}>((resolve,reject)=>{
    const data=new FormData();Object.entries(signature.params).forEach(([key,value])=>data.append(key,String(value)));data.append('api_key',signature.apiKey);data.append('signature',signature.signature);
    if(Platform.OS==='web'){
      void fetch(uri).then(response=>response.blob()).then(blob=>{if(blob.size>signature.maxBytes)throw new Error('IMAGE_TOO_LARGE');data.append('file',blob,'petcare.webp');send();}).catch(error=>reject(error instanceof Error&&error.message==='IMAGE_TOO_LARGE'?error:new Error('NETWORK_ERROR')));
    }else {data.append('file',{uri,type:'image/webp',name:'petcare.webp'} as unknown as Blob);send();}
    /** Realiza la carga HTTP firmada y resuelve o rechaza según el resultado de red. */
    function send(){const request=new XMLHttpRequest();request.open('POST',signature.uploadUrl);request.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.min(99,Math.round(event.loaded/event.total*100)));};request.onerror=()=>reject(new Error('NETWORK_ERROR'));request.onload=()=>{let payload:Record<string,unknown>;try{payload=JSON.parse(request.responseText) as Record<string,unknown>;}catch{reject(new Error('UPLOAD_FAILED'));return;}if(request.status<200||request.status>=300){const detail=payload.error&&typeof payload.error==='object'?(payload.error as Record<string,unknown>).message:undefined;const lower=String(detail??'').toLowerCase();reject(new Error(request.status===413||lower.includes('size')||lower.includes('large')?'IMAGE_TOO_LARGE':lower.includes('format')||lower.includes('invalid image')?'IMAGE_FORMAT_INVALID':'UPLOAD_FAILED'));return;}if(typeof payload.public_id!=='string'){reject(new Error('UPLOAD_FAILED'));return;}onProgress(100);resolve({public_id:payload.public_id});};request.send(data);}
  });
}

/** Selecciona, encuadra y comprime una imagen local, la carga directamente a Cloudinary y devuelve solo la URL verificada. */
export function ImageUploadField({label,kind,value,onChange,aspect=[4,3],previewSize=104,showPreview=true,targetUserId,disabled=false,error,showProgress=true,onUploadingChange}:Props){
  const auth=useAuth();const {colors}=useTheme();const [progress,setProgress]=useState<number|null>(null);const [message,setMessage]=useState<string|null>(null);const [busy,setBusy]=useState(false);const [retryUri,setRetryUri]=useState<string|null>(null);
  /** Solicita la firma, carga la imagen y confirma la URL final con la API. */
  async function uploadPrepared(uri:string){const signature=await auth.request<Signature>('/media/uploads/sign',{method:'POST',body:{kind,...(targetUserId?{targetUserId}:{})}});setProgress(0);const uploaded=await uploadFile(signature,uri,setProgress);const verified=await auth.request<{url:string}>('/media/uploads/complete',{method:'POST',body:{kind,publicId:uploaded.public_id,...(targetUserId?{targetUserId}:{})}});onChange(verified.url);setRetryUri(null);setMessage(null);}
  /** Solicita permisos, permite elegir una imagen, la prepara y coordina su carga con estado visible. */
  async function choose(){
    if(busy||disabled)return;setBusy(true);onUploadingChange?.(true);setMessage(null);setProgress(null);
    try{
      if(Platform.OS!=='web'){const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted)throw new Error('Permití el acceso a la galería para elegir una imagen.');}
      const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:Platform.OS!=='web',aspect,quality:1});if(result.canceled)return;
      const asset=result.assets[0];if(!asset?.uri||!asset.width||!asset.height||asset.width*asset.height>25_000_000)throw new Error('Seleccioná una imagen JPG, PNG o WebP de hasta 25 megapíxeles.');
      if(asset.mimeType&&!['image/jpeg','image/jpg','image/png','image/webp'].includes(asset.mimeType.toLowerCase()))throw new Error('El formato debe ser JPG, PNG o WebP.');
      if(asset.fileSize&&asset.fileSize>MAX_SOURCE_BYTES)throw new Error('La imagen original supera 30 MB. Elegí una versión más liviana.');
      const prepared=await prepareImage(asset.uri,asset.width,asset.height,aspect[0]/aspect[1]);
      const file=Platform.OS==='web'?await fetch(prepared.uri).then(response=>response.blob()):null;
      const size=file?.size??asset.fileSize??0;if(size>15*1024*1024)throw new Error('La imagen preparada supera 15 MB. Elegí otra imagen.');
      setRetryUri(prepared.uri);await uploadPrepared(prepared.uri);
    }catch(err){setProgress(null);setMessage(err instanceof Error&&err.message==='IMAGE_TOO_LARGE'?'La imagen supera el tamaño máximo de 15 MB.':err instanceof Error&&err.message==='IMAGE_FORMAT_INVALID'?'Solo se admiten imágenes JPG, PNG o WebP.':err instanceof Error&&err.message==='NETWORK_ERROR'?'No se pudo conectar con el almacenamiento. Revisá internet e intentá nuevamente.':err instanceof Error&&err.message==='UPLOAD_FAILED'?'No se pudo subir la imagen. Intentá nuevamente.':err instanceof Error?err.message:'No se pudo subir la imagen. Intentá nuevamente.');}
    finally{setBusy(false);onUploadingChange?.(false);}
  }
  /** Reintenta la carga de la imagen preparada y actualiza su progreso o error. */
  async function retry(){if(!retryUri||busy)return;setBusy(true);onUploadingChange?.(true);setMessage(null);try{await uploadPrepared(retryUri);}catch(err){setProgress(null);setMessage(err instanceof Error&&err.message==='IMAGE_TOO_LARGE'?'La imagen supera el tamaño máximo de 15 MB.':err instanceof Error&&err.message==='IMAGE_FORMAT_INVALID'?'Solo se admiten imágenes JPG, PNG o WebP.':err instanceof Error&&err.message==='NETWORK_ERROR'?'No se pudo conectar con el almacenamiento. Revisá internet e intentá nuevamente.':'No se pudo subir la imagen. Intentá nuevamente.');}finally{setBusy(false);onUploadingChange?.(false);}}
  const avatar=kind==='pet'||kind==='profile';
  return <View style={{gap:8,alignItems:avatar?'center':undefined}}>
    <AppText variant="caption">{label}</AppText>
    {showPreview&&(value?<Image source={{uri:value}} accessibilityLabel={`Vista previa: ${label}`} resizeMode="cover" style={avatar?{width:previewSize,height:previewSize,borderRadius:previewSize/2,backgroundColor:colors.accent}:{width:'100%',maxWidth:kind==='product'?240:480,height:kind==='product'?160:150,borderRadius:14,backgroundColor:colors.accent}}/>:<View accessibilityLabel={avatar?'Imagen predeterminada':'Sin imagen seleccionada'} style={avatar?{width:previewSize,height:previewSize,borderRadius:previewSize/2,backgroundColor:colors.accent,alignItems:'center',justifyContent:'center'}:{width:'100%',maxWidth:kind==='product'?240:480,height:kind==='product'?160:92,borderRadius:14,backgroundColor:colors.accent,alignItems:'center',justifyContent:'center'}}>{avatar?<Ionicons name={kind==='pet'?'paw-outline':'person-outline'} size={Math.round(previewSize*.46)} color={colors.primary}/>:<AppText variant="caption" muted>Aún no hay una imagen seleccionada.</AppText>}</View>)}
    <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:avatar?'center':undefined,gap:8}}><AppButton compact variant="secondary" label={busy?'Subiendo imagen…':value?'Cambiar imagen':'Seleccionar imagen'} loading={busy} disabled={disabled} onPress={()=>void choose()}/>{retryUri&&message&&<AppButton compact variant="secondary" label="Reintentar subida" disabled={disabled||busy} onPress={()=>void retry()}/ >}{Boolean(value)&&<AppButton compact variant="secondary" label="Quitar imagen" disabled={disabled||busy} onPress={()=>{onChange(null);setMessage(null);}}/>}</View>
    {showProgress&&progress!==null&&<AppText variant="caption" accessibilityLiveRegion="polite">Subiendo imagen: {progress}%</AppText>}
    <FormNotice error message={error??message}/>
  </View>;
}
