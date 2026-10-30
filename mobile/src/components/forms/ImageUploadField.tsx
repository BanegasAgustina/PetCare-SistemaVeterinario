import { useState } from 'react';
import { Image,Platform,View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator,SaveFormat } from 'expo-image-manipulator';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';

type Kind='banner'|'product'|'service'|'pet'|'profile';
type Signature={uploadUrl:string;cloudName:string;apiKey:string;signature:string;params:Record<string,string|number|boolean>;maxBytes:number;maxPixels:number};
type Props={label:string;kind:Kind;value:string|null;onChange:(value:string|null)=>void;aspect?:[number,number];targetUserId?:string;disabled?:boolean;error?:string;showProgress?:boolean;onUploadingChange?:(busy:boolean)=>void};
const MAX_SOURCE_BYTES=30*1024*1024;

function cropForAspect(width:number,height:number,aspect:number){
  if(width/height>aspect){const cropWidth=Math.round(height*aspect);return {originX:Math.round((width-cropWidth)/2),originY:0,width:cropWidth,height};}
  const cropHeight=Math.round(width/aspect);return {originX:0,originY:Math.round((height-cropHeight)/2),width,height:cropHeight};
}
async function prepareImage(uri:string,width:number,height:number,aspect:number){
  const crop=cropForAspect(width,height,aspect);
  const context=ImageManipulator.manipulate(uri);
  try {const rendered=await context.crop(crop).resize({width:1600}).renderAsync();try{return await rendered.saveAsync({format:SaveFormat.WEBP,compress:.82});}finally{rendered.release();}}
  finally{context.release();}
}
function uploadFile(signature:Signature,uri:string,onProgress:(value:number)=>void){
  return new Promise<{public_id:string}>((resolve,reject)=>{
    const data=new FormData();Object.entries(signature.params).forEach(([key,value])=>data.append(key,String(value)));data.append('api_key',signature.apiKey);data.append('signature',signature.signature);
    if(Platform.OS==='web'){
      void fetch(uri).then(response=>response.blob()).then(blob=>{if(blob.size>signature.maxBytes)throw new Error('IMAGE_TOO_LARGE');data.append('file',blob,'petcare.webp');send();}).catch(error=>reject(error instanceof Error&&error.message==='IMAGE_TOO_LARGE'?error:new Error('NETWORK_ERROR')));
    }else {data.append('file',{uri,type:'image/webp',name:'petcare.webp'} as unknown as Blob);send();}
    function send(){const request=new XMLHttpRequest();request.open('POST',signature.uploadUrl);request.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.min(99,Math.round(event.loaded/event.total*100)));};request.onerror=()=>reject(new Error('NETWORK_ERROR'));request.onload=()=>{let payload:Record<string,unknown>;try{payload=JSON.parse(request.responseText) as Record<string,unknown>;}catch{reject(new Error('UPLOAD_FAILED'));return;}if(request.status<200||request.status>=300){const detail=payload.error&&typeof payload.error==='object'?(payload.error as Record<string,unknown>).message:undefined;const lower=String(detail??'').toLowerCase();reject(new Error(request.status===413||lower.includes('size')||lower.includes('large')?'IMAGE_TOO_LARGE':lower.includes('format')||lower.includes('invalid image')?'IMAGE_FORMAT_INVALID':'UPLOAD_FAILED'));return;}if(typeof payload.public_id!=='string'){reject(new Error('UPLOAD_FAILED'));return;}onProgress(100);resolve({public_id:payload.public_id});};request.send(data);}
  });
}

/** Selecciona, encuadra y comprime una imagen local, la carga directamente a Cloudinary y devuelve solo la URL verificada. */
export function ImageUploadField({label,kind,value,onChange,aspect=[4,3],targetUserId,disabled=false,error,showProgress=true,onUploadingChange}:Props){
  const auth=useAuth();const {colors}=useTheme();const [progress,setProgress]=useState<number|null>(null);const [message,setMessage]=useState<string|null>(null);const [busy,setBusy]=useState(false);const [retryUri,setRetryUri]=useState<string|null>(null);
  async function uploadPrepared(uri:string){const signature=await auth.request<Signature>('/media/uploads/sign',{method:'POST',body:{kind,...(targetUserId?{targetUserId}:{})}});setProgress(0);const uploaded=await uploadFile(signature,uri,setProgress);const verified=await auth.request<{url:string}>('/media/uploads/complete',{method:'POST',body:{kind,publicId:uploaded.public_id,...(targetUserId?{targetUserId}:{})}});onChange(verified.url);setRetryUri(null);setMessage(null);}
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
  async function retry(){if(!retryUri||busy)return;setBusy(true);onUploadingChange?.(true);setMessage(null);try{await uploadPrepared(retryUri);}catch(err){setProgress(null);setMessage(err instanceof Error&&err.message==='IMAGE_TOO_LARGE'?'La imagen supera el tamaño máximo de 15 MB.':err instanceof Error&&err.message==='IMAGE_FORMAT_INVALID'?'Solo se admiten imágenes JPG, PNG o WebP.':err instanceof Error&&err.message==='NETWORK_ERROR'?'No se pudo conectar con el almacenamiento. Revisá internet e intentá nuevamente.':'No se pudo subir la imagen. Intentá nuevamente.');}finally{setBusy(false);onUploadingChange?.(false);}}
  return <View style={{gap:8}}>
    <AppText variant="caption">{label}</AppText>
    {value?<Image source={{uri:value}} accessibilityLabel={`Vista previa: ${label}`} resizeMode="cover" style={{width:'100%',maxWidth:480,height:150,borderRadius:14,backgroundColor:colors.accent}}/>:<AppText variant="caption" muted>Aún no hay una imagen seleccionada.</AppText>}
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><AppButton compact variant="secondary" label={busy?'Subiendo imagen…':value?'Cambiar imagen':'Seleccionar imagen'} loading={busy} disabled={disabled} onPress={()=>void choose()}/>{retryUri&&message&&<AppButton compact variant="secondary" label="Reintentar subida" disabled={disabled||busy} onPress={()=>void retry()}/ >}{Boolean(value)&&<AppButton compact variant="secondary" label="Quitar imagen" disabled={disabled||busy} onPress={()=>{onChange(null);setMessage(null);}}/>}</View>
    {showProgress&&progress!==null&&<AppText variant="caption" accessibilityLiveRegion="polite">Subiendo imagen: {progress}%</AppText>}
    <FormNotice error message={error??message}/>
  </View>;
}
