import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useFeedback } from '../../contexts/FeedbackContext';
import { PetCareCard, PetCareHeader, PetCareScreen, QueryState, money } from '../../components/client/PetCareUI';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/forms/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useTheme } from '../../hooks/useTheme';
import type { StoreOrderDetail } from '../../services/clinic.service';

const statuses=['PLACED','CONFIRMED','PROCESSING','READY','IN_TRANSIT','DELIVERED','PICKED_UP','CANCELLED'];
const statusLabels:Record<string,string>={PLACED:'Pendiente',CONFIRMED:'Confirmado',PROCESSING:'En preparación',READY:'Listo para retirar',IN_TRANSIT:'En camino',DELIVERED:'Entregado',PICKED_UP:'Retirado',CANCELLED:'Cancelado'};
const nextByMethod=(status:string,method:string|null)=>{if(status==='PLACED')return ['CONFIRMED'];if(status==='CONFIRMED')return ['PROCESSING'];if(status==='PROCESSING')return [method==='PICKUP'?'READY':'IN_TRANSIT'];if(status==='READY')return ['PICKED_UP'];if(status==='IN_TRANSIT')return ['DELIVERED'];return [];};
export default function StoreOrders(){
 const api=useClinic();const auth=useAuth();const {colors}=useTheme();const {showToast}=useFeedback();
 const [draft,setDraft]=useState({search:'',status:'',fulfillmentMethod:'',from:'',to:''});const [filters,setFilters]=useState(draft);const [selected,setSelected]=useState<string|null>(null);const [pending,setPending]=useState<{id:string;orderStatus?:string;paymentStatus?:string;label:string}|null>(null);const [detail,setDetail]=useState<StoreOrderDetail|null>(null);
 const load=useCallback(()=>api.storeOrders(Object.fromEntries(Object.entries(filters).filter(([,value])=>value))),[api,filters]);const query=useClientQuery(load);
 const loadDetail=useCallback(async()=>{if(!selected){setDetail(null);return null;}const row=await api.storeOrder(selected);setDetail(row);return row;},[api,selected]);const detailQuery=useClientQuery(loadDetail);
 const canManage=auth.hasPermission('orders.manage');const canManagePayment=auth.hasPermission('orders.payment.manage');
 const commit=async()=>{if(!pending)return;await api.updateStoreOrder(pending.id,{...(pending.orderStatus?{orderStatus:pending.orderStatus}:{}),...(pending.paymentStatus?{paymentStatus:pending.paymentStatus}:{})});setPending(null);query.reload();detailQuery.reload();showToast('Pedido actualizado','success');};
 const filterChip=(label:string,value:string,key:'status'|'fulfillmentMethod')=><Pressable key={`${key}-${value}`} accessibilityRole="button" accessibilityState={{selected:draft[key]===value}} onPress={()=>setDraft(current=>({...current,[key]:current[key]===value?'':value}))} style={[styles.chip,{borderColor:draft[key]===value?colors.primary:colors.border,backgroundColor:draft[key]===value?colors.accent:colors.surface}]}><AppText variant="caption">{label}</AppText></Pressable>;
 return <PetCareScreen wide><PetCareHeader title="Pedidos de tienda" subtitle="Preparación, retiro, entregas y pagos" back hideForAdmin/>
 <PetCareCard><AppInput label="Pedido, cliente o email" value={draft.search} onChangeText={search=>setDraft(current=>({...current,search}))}/><View style={styles.chips}>{filterChip('Todos','', 'status')}{statuses.map(status=>filterChip(statusLabels[status],status,'status'))}</View><View style={styles.chips}>{filterChip('Retiro','PICKUP','fulfillmentMethod')}{filterChip('Envío','DELIVERY','fulfillmentMethod')}</View><View style={styles.row}><View style={styles.flex}><AppInput label="Desde (AAAA-MM-DD)" value={draft.from} onChangeText={from=>setDraft(current=>({...current,from}))}/></View><View style={styles.flex}><AppInput label="Hasta (AAAA-MM-DD)" value={draft.to} onChangeText={to=>setDraft(current=>({...current,to}))}/></View></View><AppButton compact label="Aplicar filtros" onPress={()=>setFilters({...draft})}/></PetCareCard>
 <QueryState {...query}/>
 {query.data?.length===0&&!query.loading&&<PetCareCard><AppText variant="subtitle">Todavía no hay pedidos de tienda</AppText><AppText muted>Los pedidos aparecerán aquí cuando se habilite la compra real. El checkout demostrativo no genera compras.</AppText></PetCareCard>}
 {query.data?.map(order=><Pressable key={order.id} accessibilityRole="button" onPress={()=>setSelected(order.id)}><PetCareCard><View style={styles.heading}><AppText variant="subtitle" style={{flex:1}}>Pedido #{order.id}</AppText><Ionicons name="chevron-forward" size={18} color={colors.muted}/></View><AppText>{order.clientName} · {order.clientEmail}</AppText><View style={styles.row}><AppText variant="caption" muted>{order.fulfillmentMethod==='PICKUP'?'Retiro':'Envío'} · {statusLabels[order.orderStatus]??order.orderStatus}</AppText><AppText variant="caption">{money(order.totalCents)}</AppText></View><AppText variant="caption" muted>Pago: {order.paymentStatus} · {order.paymentMethod??'Sin método'}</AppText></PetCareCard></Pressable>)}
 {selected&&<PetCareCard><View style={styles.heading}><AppText variant="subtitle" style={{flex:1}}>Detalle del pedido #{selected}</AppText><Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle" onPress={()=>{setSelected(null);setDetail(null);}}><Ionicons name="close" size={22} color={colors.muted}/></Pressable></View><QueryState {...detailQuery}/>{detail&&<>
 <AppText>{detail.clientName} · {detail.clientEmail} · {detail.clientPhone??'Sin teléfono'}</AppText><AppText variant="caption" muted>Pedido: {statusLabels[detail.orderStatus]??detail.orderStatus} · Pago: {detail.paymentStatus} · Entrega: {detail.deliveryStatus}</AppText>
 {detail.fulfillmentMethod==='DELIVERY'&&<AppText muted>{detail.recipientName} · {detail.recipientPhone}{'\n'}{detail.deliveryStreet} {detail.deliveryNumber}{detail.deliveryUnit?`, ${detail.deliveryUnit}`:''}{'\n'}{detail.deliveryCity}, {detail.deliveryProvince} · CP {detail.deliveryPostalCode}{detail.deliveryReference?`\nReferencias: ${detail.deliveryReference}`:''}</AppText>}
 {detail.items.map((item,index)=><View key={`${item.productId}-${index}`} style={styles.row}><AppText style={{flex:1}}>{item.quantity} × {item.name}</AppText><AppText>{money(item.subtotalCents)}</AppText></View>)}
 <View style={styles.totals}><AppText>Productos · {money(detail.subtotalCents)}</AppText><AppText>Envío · {money(detail.deliveryFeeCents)}</AppText><AppText variant="subtitle">Total · {money(detail.totalCents)}</AppText></View>
 {canManage&&nextByMethod(detail.orderStatus,detail.fulfillmentMethod).map(next=><AppButton key={next} label={detail.fulfillmentMethod==='PICKUP'&&next==='PICKED_UP'?'Marcar como retirado':detail.fulfillmentMethod==='DELIVERY'&&next==='DELIVERED'?'Marcar como entregado':`Marcar: ${statusLabels[next]}`} onPress={()=>setPending({id:detail.id,orderStatus:next,label:statusLabels[next]})}/>)}
 {canManage&&['PLACED','CONFIRMED','PROCESSING'].includes(detail.orderStatus)&&<AppButton variant="secondary" label="Cancelar pedido" onPress={()=>setPending({id:detail.id,orderStatus:'CANCELLED',label:'Cancelar pedido'})}/>}
 {canManagePayment&&detail.paymentStatus==='PENDING'&&<AppButton variant="secondary" label="Registrar pago recibido" onPress={()=>setPending({id:detail.id,paymentStatus:'PAID',label:'Registrar pago recibido'})}/>}
 <AppText variant="caption" muted>Historial de estados</AppText>{detail.history.map((event,index)=><AppText key={`${event.stateType}-${index}`} variant="caption" muted>{event.stateType}: {event.previousStatus??'—'} → {event.newStatus} · {event.actorName??'Sistema'} · {String(event.occurredAt)}</AppText>)}
 </>}</PetCareCard>}
 <ConfirmModal visible={pending!==null} title={pending?.label??'Actualizar pedido'} message={pending?.paymentStatus?'La confirmación del pago se registra por separado del retiro o la entrega.':`Se registrará el cambio de estado del pedido #${pending?.id}.`} destructive={pending?.orderStatus==='CANCELLED'} confirmLabel="Confirmar" onCancel={()=>setPending(null)} onConfirm={commit}/>
 </PetCareScreen>;
}
const styles=StyleSheet.create({heading:{flexDirection:'row',alignItems:'center',gap:8},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},flex:{flex:1,minWidth:0},chips:{flexDirection:'row',flexWrap:'wrap',gap:6},chip:{paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderRadius:16},totals:{gap:7,borderTopWidth:StyleSheet.hairlineWidth,borderColor:'#789',paddingTop:10}});
