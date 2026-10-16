/** Lista y detalle de reservas reales. CLIENT ve las propias; el personal necesita permisos del servidor. */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, PetImage, QueryState, statusLabel, money, ResponsiveGrid } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { SelectionRow } from '../ui/SelectionRow';
import { FilterDisclosure } from '../ui/FilterDisclosure';
import { CompactPagination } from '../ui/CompactPagination';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { ConfirmModal } from '../ui/ConfirmModal';
import { AppModal } from '../ui/AppModal';
import { clinicDateFilterToApi, clinicDateTime } from '../../utils/clinic-date';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { FormNotice } from '../ui/FormNotice';

export function ReservationsScreen() {
  const api = useClinic();
  const { user, hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [confirmReservation, setConfirmReservation] = useState<string | null>(null);
  const [rejectReservation, setRejectReservation] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectionError, setRejectionError] = useState('');
  const { showToast } = useFeedback();
  const [page, setPage] = useState(1);
  const query = useClientQuery(useCallback(() => api.reservations({ ...filters, fromDate: clinicDateFilterToApi(filters.fromDate ?? ''), toDate: clinicDateFilterToApi(filters.toDate ?? ''), search: submittedSearch, page: String(page) }), [api, filters, submittedSearch, page]));
  const detail = useClientQuery(useCallback(() => selectedReservation ? api.reservation(selectedReservation) : Promise.resolve(null), [api, selectedReservation]));
  const base = user?.role === 'CLIENT' ? '/client' : user?.role === 'SECRETARY' ? '/secretary' : '/admin';
  const update = (key: string, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  return <PetCareScreen wide><PetCareHeader title={user?.role === 'CLIENT' ? 'Mis reservas' : 'Reservas para retiro'} subtitle="Se paga y retira en la veterinaria" back/>
    <SearchFilterBar>
      <AppInput label="Buscar reservas" placeholder="Número o nombre del cliente" value={search} onChangeText={value => { setSearch(value); if(user?.role!=='CLIENT'){setSubmittedSearch(value.trim());setPage(1);} }} returnKeyType="search" onSubmitEditing={() => { setSubmittedSearch(search.trim()); setPage(1); }}/>
      <FilterDisclosure fullWidth activeCount={Object.values(filters).filter(Boolean).length} onApply={() => setPage(1)} onClear={() => { setFilters({}); setPage(1); }}>
        <AppText variant="subtitle">Estado</AppText>
        {['', 'PLACED', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED', 'EXPIRED'].map(status => <SelectionRow key={status || 'all'} label={status ? reservationStatusLabel(status) : 'Todos los estados'} checked={(filters.status ?? '') === status} onPress={() => update('status', status)}/>)}
        <AppText variant="subtitle">Fecha de creación</AppText>
        <AppInput label="Desde (DD/MM/AAAA)" placeholder="13/10/2026" value={filters.fromDate ?? ''} onChangeText={value => update('fromDate', value)}/>
        <AppInput label="Hasta (DD/MM/AAAA)" placeholder="13/10/2026" value={filters.toDate ?? ''} onChangeText={value => update('toDate', value)}/>
      </FilterDisclosure>
      {user?.role === 'CLIENT' && <AppButton compact label="Buscar" onPress={() => { setSubmittedSearch(search.trim()); setPage(1); }}/>}
    </SearchFilterBar>
    <QueryState {...query}/>
    {query.data && (query.data.length ? <ResponsiveGrid>{query.data.slice(0,100).map(reservation => {
      const items = reservation.items as Record<string,unknown>[] | undefined;
      const first = items?.[0];
      if (user?.role === 'CLIENT') return <PetCareCard key={reservation.id}>
        <AppText variant="subtitle">Reserva #{reservation.id}</AppText>
        {Boolean(reservation.clientName) && <AppText>{String(reservation.clientName)}</AppText>}
        <AppText>{reservationStatusLabel(String(reservation.status))}</AppText>
        <AppText>{clinicDateTime(String(reservation.createdAt))}</AppText>
        {Boolean(reservation.expiresAt)&&<AppText>Vence: {clinicDateTime(String(reservation.expiresAt))}</AppText>}
        {items?.map((item,index)=><AppText key={`${String(item.productId)}-${index}`}>{String(item.name)} · {productTypeLabel(String(item.productType))} · {String(item.quantity)} × {money(Number(item.priceCents))}</AppText>)}
        <AppText>Precio reservado: {money(Number(reservation.totalCents))}</AppText>
        <AppButton label="Ver reserva" onPress={() => router.push({ pathname: `${base}/reservation` as never, params: { id: reservation.id } })}/>
      </PetCareCard>;
      return <PetCareCard key={reservation.id}><View style={{flexDirection:'row',alignItems:'center',gap:14}}>{first&&<PetImage uri={typeof first.imageUrl==='string'?first.imageUrl:null} size={64}/>}<View style={{flex:1,minWidth:0,gap:3}}><AppText variant="subtitle" numberOfLines={1}>{String(first?.name??`Reserva #${reservation.id}`)}</AppText>{Boolean(reservation.clientName)&&<AppText numberOfLines={1}>{String(reservation.clientName)}</AppText>}<AppText muted>{items?.reduce((total,item)=>total+Number(item.quantity??0),0)??0} unidades · {reservationStatusLabel(String(reservation.status))}</AppText></View><Pressable accessibilityRole="button" accessibilityLabel={`Ver reserva ${String(reservation.id)}`} onPress={()=>setSelectedReservation(String(reservation.id))} style={{padding:10}}><Ionicons name="eye-outline" size={22}/></Pressable></View>{hasPermission('reservations.manage')&&reservation.status==='PLACED'&&<View style={{flexDirection:'row',gap:10,flexWrap:'wrap'}}><AppButton compact label="Aceptar reserva" onPress={()=>setConfirmReservation(String(reservation.id))}/><AppButton compact label="Rechazar reserva" destructive onPress={()=>{setRejectReservation(String(reservation.id));setRejectionReason('');setRejectionError('');}}/></View>}</PetCareCard>;
    })}</ResponsiveGrid> : <PetCareEmptyState title="No hay reservas en esta consulta" icon="bag-handle-outline"/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={Boolean(query.data && query.data.length>100)} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)}/>
    {user?.role !== 'CLIENT' && <AppModal size="wide" visible={Boolean(selectedReservation)} dismissible onClose={()=>setSelectedReservation(null)}>
      <AppText variant="title">Detalle de la reserva</AppText>
      <QueryState {...detail}/>
      {detail.data && <>
        <PetCareCard>
          {detail.data.items?.map((item,index) => <View key={`${String(item.productId)}-${index}`} style={{flexDirection:'row',alignItems:'center',gap:12}}>
            <PetImage uri={typeof item.imageUrl==='string' ? item.imageUrl : null} size={72}/>
            <View style={{flex:1,minWidth:0}}>
              <AppText variant="subtitle">{String(item.name)}</AppText>
              {Boolean(item.description) && <AppText muted>{String(item.description)}</AppText>}
              <AppText>Cantidad: {String(item.quantity)}</AppText>
              <AppText>Precio registrado: {money(Number(item.priceCents))} por unidad</AppText>
            </View>
          </View>)}
        </PetCareCard>
        <PetCareCard>
          <AppText variant="subtitle">Datos de la reserva</AppText>
          <AppText>Cliente: {String(detail.data.clientName ?? '')}</AppText>
          {Boolean(detail.data.phone) && <AppText>Teléfono: {String(detail.data.phone)}</AppText>}
          <AppText>Creada: {clinicDateTime(String(detail.data.createdAt))}</AppText>
          {Boolean(detail.data.expiresAt) && <AppText>Vence: {clinicDateTime(String(detail.data.expiresAt))}</AppText>}
          <AppText>Estado: {reservationStatusLabel(String(detail.data.status))}</AppText>
          <AppText>Total registrado: {money(Number(detail.data.totalCents))}</AppText>
          {Boolean(detail.data.statusHistory?.at(-1)?.reason) && <AppText>Motivo: {String(detail.data.statusHistory?.at(-1)?.reason)}</AppText>}
        </PetCareCard>
        {hasPermission('reservations.manage') && detail.data.status==='PLACED' && <>
          <AppButton label="Aceptar reserva" onPress={() => setConfirmReservation(String(detail.data!.id))}/>
          <AppButton label="Rechazar reserva" destructive onPress={() => { setRejectReservation(String(detail.data!.id)); setRejectionReason(''); setRejectionError(''); }}/>
        </>}
        <AppButton label="Cerrar" variant="secondary" onPress={() => setSelectedReservation(null)}/>
      </>}
    </AppModal>}
    {user?.role !== 'CLIENT' && <ConfirmModal visible={Boolean(confirmReservation)} title="Aceptar reserva" message="La reserva cambiará al siguiente estado permitido." confirmLabel="Aceptar" onCancel={()=>setConfirmReservation(null)} onConfirm={async()=>{if(!confirmReservation)return;await api.changeReservation(confirmReservation,'CONFIRMED');setConfirmReservation(null);setSelectedReservation(null);showToast('Reserva aceptada','success');query.reload();}}/>}
    {user?.role !== 'CLIENT' && <AppModal visible={Boolean(rejectReservation)} dismissible onClose={()=>{if(!rejecting)setRejectReservation(null);}}><AppText variant="title">Rechazar reserva</AppText><AppText muted>El motivo quedará asociado a la reserva y se informará al cliente.</AppText><AppInput label="Motivo del rechazo" required multiline maxLength={500} value={rejectionReason} error={rejectionError||undefined} onChangeText={value=>{setRejectionReason(value);setRejectionError('');}}/><AppButton label="Confirmar rechazo" destructive loading={rejecting} onPress={()=>{const reason=rejectionReason.trim();if(reason.length<3){setRejectionError('Ingresá un motivo de al menos 3 caracteres.');return;}if(!rejectReservation)return;setRejecting(true);void api.changeReservation(rejectReservation,'CANCELLED',reason).then(()=>{setRejectReservation(null);setRejectionReason('');showToast('Reserva rechazada','success');query.reload();}).catch(()=>showToast('No se pudo rechazar la reserva. Revisá los datos e intentá nuevamente.','error')).finally(()=>setRejecting(false));}}/><AppButton label="Cancelar" variant="secondary" disabled={rejecting} onPress={()=>setRejectReservation(null)}/></AppModal>}
  </PetCareScreen>;
}

export function ReservationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useClinic();
  const { hasPermission } = useAuth();
  const query = useClientQuery(useCallback(() => api.reservation(id), [api, id]));
  const [next, setNext] = useState<string | null>(null);
  const [now,setNow]=useState(0);
  const [cancellationReason,setCancellationReason]=useState('');
  const [cancellationError,setCancellationError]=useState<string|null>(null);
  const cancellationAction=useAsyncAction();
  const { showToast } = useFeedback();
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  const transitions: Record<string, string[]> = { PLACED: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PROCESSING', 'CANCELLED'], PROCESSING: ['READY', 'CANCELLED'], READY: ['COMPLETED', 'CANCELLED'] };
  async function cancelReservation(){const reason=cancellationReason.trim();if(reason.length<3||reason.length>500){setCancellationError('Ingresá un motivo de entre 3 y 500 caracteres.');return;}setCancellationError(null);await cancellationAction.run(async()=>{await api.changeReservation(id,'CANCELLED',reason);setNext(null);setCancellationReason('');showToast('Reserva cancelada','success');query.reload();});}
  return <PetCareScreen wide><PetCareHeader title={`Reserva #${id}`} back/><QueryState {...query}/>
    {query.data && <><PetCareCard><AppText variant="subtitle">{reservationStatusLabel(String(query.data.status))}</AppText><AppText>Se paga y se retira en el local de la veterinaria. Sin pagos en línea.</AppText>{Boolean(query.data.clientName) && <AppText>{String(query.data.clientName)}</AppText>}{Boolean(query.data.phone) && <AppText>Contacto: {String(query.data.phone)}</AppText>}<AppText>Reservada: {clinicDateTime(String(query.data.createdAt))}</AppText><AppText>Precio reservado: {money(Number(query.data.totalCents))}</AppText>{Boolean(query.data.expiresAt)&&<AppText>Vencimiento: {clinicDateTime(String(query.data.expiresAt))}</AppText>}{Boolean(query.data.expiresAt)&&['PLACED','CONFIRMED','PROCESSING','READY'].includes(String(query.data.status))&&<AppText>Tiempo restante: {now?remainingTime(String(query.data.expiresAt),now):'Calculando…'}</AppText>}</PetCareCard>
      {/* Cada evento describe un cambio persistido y el usuario que lo registró, sin llamar compra a una reserva. */}
      {query.data.statusHistory?.length ? <PetCareCard><AppText variant="subtitle">Historial de estados</AppText>{query.data.statusHistory.map((event,index)=><AppText key={`${event.occurredAt}-${index}`}>{reservationStatusLabel(event.newStatus)} · {clinicDateTime(event.occurredAt)}{event.actorName?` · ${event.actorName}`:''}</AppText>)}</PetCareCard> : null}
      {query.data.items?.map(item => <PetCareCard key={String(item.productId)}>{hasPermission('reservations.view_all')&&<PetImage uri={typeof item.imageUrl==='string'?item.imageUrl:null} size={100}/>}<AppText variant="subtitle">{String(item.name)}</AppText>{hasPermission('reservations.view_all')&&Boolean(item.description)&&<AppText>{String(item.description)}</AppText>}<AppText>Tipo: {productTypeLabel(String(item.productType))}</AppText><AppText>Cantidad: {String(item.quantity)}</AppText><AppText>Precio al reservar: {money(Number(item.priceCents)*Number(item.quantity))}</AppText>{Boolean(item.petName) && <AppText>Mascota: {String(item.petName)}</AppText>}{Boolean(item.prescriptionId) && <AppText>Receta asociada: #{String(item.prescriptionId)}</AppText>}</PetCareCard>)}
      {hasPermission('reservations.manage') && (transitions[String(query.data.status)] ?? []).map(status => <AppButton key={status} label={status === 'COMPLETED' ? 'Marcar retirada' : status === 'PROCESSING' ? 'Preparar' : reservationStatusLabel(status)} destructive={status==='CANCELLED'} onPress={() => {if(status==='CANCELLED'){setCancellationReason('');setCancellationError(null);}setNext(status);}}/>)}
    </>}
    <AppModal visible={next==='CANCELLED'} dismissible onClose={()=>{if(!cancellationAction.loading)setNext(null);}}><AppText variant="title">Cancelar reserva</AppText><AppText muted>El motivo quedará registrado y se informará al cliente. Las unidades se liberarán.</AppText><AppInput label="Motivo de cancelación" required multiline maxLength={500} value={cancellationReason} error={cancellationError??undefined} editable={!cancellationAction.loading} onChangeText={value=>{setCancellationReason(value);setCancellationError(null);}}/><FormNotice error message={cancellationAction.error}/><AppButton label="Confirmar cancelación" destructive loading={cancellationAction.loading} onPress={()=>void cancelReservation()}/><AppButton label="Volver" variant="secondary" disabled={cancellationAction.loading} onPress={()=>setNext(null)}/></AppModal>
    <ConfirmModal visible={Boolean(next)&&next!=='CANCELLED'} title="Actualizar reserva" message={next === 'COMPLETED' ? 'Se registrará el retiro y se descontarán las unidades del stock físico.' : 'El cliente verá el estado actualizado.'} confirmLabel="Confirmar" onCancel={() => setNext(null)} onConfirm={async () => { await api.changeReservation(id, next!); setNext(null); showToast('Reserva actualizada', 'success'); query.reload(); }}/>
  </PetCareScreen>;
}

function remainingTime(expiresAt:string,now:number){const milliseconds=Math.max(0,new Date(expiresAt).getTime()-now);const hours=Math.floor(milliseconds/3_600_000);const minutes=Math.floor(milliseconds%3_600_000/60_000);const seconds=Math.floor(milliseconds%60_000/1000);return `${hours} h ${String(minutes).padStart(2,'0')} min ${String(seconds).padStart(2,'0')} s`;}
function productTypeLabel(type:string){return type==='ACCESSORY'?'Accesorio':type==='MEDICINE'?'Medicamento':'Producto sin clasificar';}

function reservationStatusLabel(value:string){return ({PLACED:'Reservada',COMPLETED:'Retirada',CANCELLED:'Cancelada',EXPIRED:'Vencida'} as Record<string,string>)[value]??statusLabel(value);}
