import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { File } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { useTheme } from '../../../hooks/useTheme';
import { PetCareCard, PetCareHeader, PetCareScreen, QueryState, money } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/forms/AppInput';
import { FormNotice } from '../../../components/ui/FormNotice';

export default function PaymentIntentScreen(){
 const params=useLocalSearchParams<{id:string|string[]}>();const id=Array.isArray(params.id)?params.id[0]:params.id;const api=useClient();const {colors}=useTheme();
 const loadOrder=useCallback(()=>id?api.order(id):Promise.reject(new Error('No encontramos el pedido.')),[api,id]);const orderQuery=useClientQuery(loadOrder);const loadBank=useCallback(()=>api.fulfillment(),[api]);const bankQuery=useClientQuery(loadBank);
 const [now,setNow]=useState(0);const [uploading,setUploading]=useState(false);const [renewing,setRenewing]=useState(false);const [error,setError]=useState<string|null>(null);const [success,setSuccess]=useState(false);const [aliasCopied,setAliasCopied]=useState(false);const [transferReference,setTransferReference]=useState('');
 const expiryRefresh=useRef(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const order=orderQuery.data;const remaining=order?.paymentExpiresAt?Math.max(0,Math.ceil((new Date(order.paymentExpiresAt).getTime()-now)/1000)):0;const expired=now>0&&Boolean(order?.paymentExpiresAt)&&remaining===0;
 useEffect(()=>{if(expired&&order?.paymentIntentStatus==='ACTIVE'&&!expiryRefresh.current){expiryRefresh.current=true;orderQuery.reload();}},[expired,order?.paymentIntentStatus,orderQuery]);
 const copyAlias=async()=>{const alias=bankQuery.data?.bankAlias;if(!alias)return;try{await Clipboard.setStringAsync(alias);setAliasCopied(true);}catch{setError('No pudimos copiar el alias.');}};
 const renew=async()=>{if(!order)return;setRenewing(true);setError(null);try{await api.renewTransferIntent(order.id);expiryRefresh.current=false;setNow(0);orderQuery.reload();}catch(e){setError(e instanceof Error?e.message:'No pudimos iniciar un nuevo plazo.');}finally{setRenewing(false);}};
 const upload=async()=>{if(!order?.paymentIntentId)return;setError(null);try{
   const result=await DocumentPicker.getDocumentAsync({type:['application/pdf','image/jpeg','image/png','image/webp'],copyToCacheDirectory:true,multiple:false});if(result.canceled)return;const asset=result.assets[0];if(!asset)return;
   if(!asset.size||asset.size<8||asset.size>5*1024*1024){setError('El comprobante debe pesar hasta 5 MB.');return;}
   const contentType=asset.mimeType??(asset.name.toLowerCase().endsWith('.pdf')?'application/pdf':'');if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(contentType)){setError('Elegí un PDF, JPG, PNG o WebP.');return;}
   setUploading(true);const blob=Platform.OS==='web'&&asset.file?asset.file:new Blob([await new File(asset.uri).arrayBuffer()],{type:contentType});await api.uploadPaymentProof(order.paymentIntentId,blob,contentType,transferReference.trim());setSuccess(true);orderQuery.reload();
  }catch(e){setError(e instanceof Error?e.message:'No pudimos enviar el comprobante. Intentá nuevamente.');}finally{setUploading(false);}};
 const openOrder=()=>router.replace({pathname:'/client/orders/[id]',params:{id:order?.id??id??''}});
 return <PetCareScreen wide tabbed><PetCareHeader title="Transferencia bancaria" subtitle={order?`Pedido #${order.id}`:'Cargando pedido'} back/><QueryState {...orderQuery}/><QueryState {...bankQuery}/>
  {order&&<>
   <PetCareCard><View style={[styles.badge,{backgroundColor:colors.accent}]}><Ionicons name="shield-checkmark-outline" size={25} color={colors.primary}/></View><AppText variant="subtitle">Transferí a PetCare</AppText><AppText muted>El pago queda pendiente hasta que el administrador principal confirme el ingreso en la cuenta.</AppText><View style={styles.row}><AppText variant="caption" muted>Banco / billetera</AppText><AppText>{bankQuery.data?.bankName??'—'}</AppText></View><View style={styles.row}><AppText variant="caption" muted>Titular</AppText><AppText>{bankQuery.data?.bankAccountHolder??'—'}</AppText></View><View style={styles.row}><AppText variant="caption" muted>CBU / CVU</AppText><AppText selectable>{bankQuery.data?.bankCbuCvu??'—'}</AppText></View><View style={styles.row}><AppText variant="caption" muted>Alias</AppText><AppText selectable variant="subtitle">{bankQuery.data?.bankAlias??'—'}</AppText></View><AppButton variant="secondary" label="Copiar alias" onPress={()=>void copyAlias()}/>{aliasCopied&&<FormNotice message="Alias copiado al portapapeles."/>}<View style={styles.total}><AppText variant="subtitle">Importe exacto</AppText><AppText variant="title">{money(order.totalCents)}</AppText></View><AppText>Referencia de transferencia: PEDIDO-{order.id}</AppText><AppText variant="caption" muted>Verificá los datos bancarios antes de transferir. PetCare no usa el alias ilustrativo; acá solo aparecen los datos cargados por el administrador.</AppText></PetCareCard>
   <PetCareCard><AppText variant="subtitle">Tiempo para iniciar la transferencia</AppText><AppText variant="title" style={{color:expired?colors.muted:colors.primary}}>{now===0?'--:--':String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0')}</AppText><AppText variant="caption" muted>{expired?'El plazo venció. Si transferiste dentro del plazo, podés enviar el comprobante igualmente; quedará marcado para revisión manual.':'El vencimiento se calcula con la hora del servidor y se conserva si cerrás la aplicación.'}</AppText>{success&&order.paymentReviewStatus!=='SUBMITTED'&&<FormNotice message="Comprobante enviado. Estamos verificando tu transferencia."/>}{order.paymentReviewStatus==='SUBMITTED'?<FormNotice message="Comprobante enviado. Estamos verificando tu transferencia."/>:order.paymentStatus==='PAID'?<FormNotice message="La transferencia fue confirmada."/>:order.paymentStatus==='PAYMENT_FAILED'?<><FormNotice error message="El comprobante fue rechazado. Podés iniciar otro plazo para transferir nuevamente."/><AppButton label={renewing?'Iniciando…':'Iniciar un nuevo plazo de transferencia'} loading={renewing} disabled={renewing} onPress={()=>void renew()}/></>:expired?<AppButton label={renewing?'Iniciando…':'Iniciar un nuevo plazo de transferencia'} loading={renewing} disabled={renewing} onPress={()=>void renew()}/>:<><AppInput label="Referencia o código de operación (opcional)" value={transferReference} onChangeText={setTransferReference} maxLength={120}/><AppButton label={uploading?'Enviando comprobante…':'Enviar comprobante'} loading={uploading} disabled={uploading||!order.paymentIntentId} onPress={()=>void upload()}/></>}<AppText variant="caption" muted>Archivos PDF o imagen hasta 5 MB. El comprobante se guarda de forma privada y no confirma el pago por sí solo.</AppText>{error&&<FormNotice error message={error}/>}<AppButton variant="secondary" label="Ver pedido" onPress={openOrder}/></PetCareCard>
  </>}
 </PetCareScreen>;
}
const styles=StyleSheet.create({badge:{width:54,height:54,borderRadius:18,alignItems:'center',justifyContent:'center'},row:{flexDirection:'row',justifyContent:'space-between',gap:12},total:{borderTopWidth:StyleSheet.hairlineWidth,borderColor:'#789',paddingTop:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}});
