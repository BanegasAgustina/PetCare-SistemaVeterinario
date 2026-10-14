/** Lista y detalle de reservas reales. CLIENT ve las propias; el personal necesita permisos del servidor. */
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, QueryState, statusLabel, money } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { SelectionRow } from '../ui/SelectionRow';
import { FilterDisclosure } from '../ui/FilterDisclosure';
import { CompactPagination } from '../ui/CompactPagination';
import { ConfirmModal } from '../ui/ConfirmModal';
import { clinicDateTime } from '../../utils/clinic-date';
import { useFeedback } from '../../contexts/FeedbackContext';

export function ReservationsScreen() {
  const api = useClinic();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const query = useClientQuery(useCallback(() => api.reservations({ ...filters, search: submittedSearch, page: String(page) }), [api, filters, submittedSearch, page]));
  const base = user?.role === 'CLIENT' ? '/client' : user?.role === 'SECRETARY' ? '/secretary' : '/admin';
  const update = (key: string, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  return <PetCareScreen><PetCareHeader title={user?.role === 'CLIENT' ? 'Mis reservas' : 'Reservas para retiro'} subtitle="PetCare no procesa pagos" back/>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
      <View style={{ flex: 1, minWidth: 180 }}><AppInput label="Buscar reservas" placeholder="Número o nombre del cliente" value={search} onChangeText={setSearch}/></View>
      <FilterDisclosure activeCount={Object.values(filters).filter(Boolean).length} onApply={() => setPage(1)} onClear={() => { setFilters({}); setPage(1); }}>
        <AppText variant="subtitle">Estado</AppText>
        {['', 'PLACED', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'].map(status => <SelectionRow key={status || 'all'} label={status ? statusLabel(status) : 'Todos los estados'} checked={(filters.status ?? '') === status} onPress={() => update('status', status)}/>)}
        <AppText variant="subtitle">Fecha de creación</AppText>
        <AppInput label="Desde (AAAA-MM-DD)" value={filters.fromDate ?? ''} onChangeText={value => update('fromDate', value)}/>
        <AppInput label="Hasta (AAAA-MM-DD)" value={filters.toDate ?? ''} onChangeText={value => update('toDate', value)}/>
      </FilterDisclosure>
      <AppButton compact label="Buscar" onPress={() => { setSubmittedSearch(search.trim()); setPage(1); }}/>
    </View>
    <QueryState {...query}/>
    {query.data && (query.data.length ? query.data.map(reservation => <PetCareCard key={reservation.id}>
      <AppText variant="subtitle">Reserva #{reservation.id}</AppText>
      {reservation.clientName && <AppText>{String(reservation.clientName)}</AppText>}
      <AppText>{statusLabel(String(reservation.status))}</AppText>
      <AppText>{clinicDateTime(String(reservation.createdAt))}</AppText>
      <AppText>Importe informativo: {money(Number(reservation.totalCents))}</AppText>
      <AppButton label="Ver reserva" onPress={() => router.push({ pathname: `${base}/reservation` as never, params: { id: reservation.id } })}/>
    </PetCareCard>) : <PetCareEmptyState title="No hay reservas en esta consulta" icon="bag-handle-outline"/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={Boolean(query.data?.length === 100)} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)}/>
  </PetCareScreen>;
}

export function ReservationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useClinic();
  const { hasPermission } = useAuth();
  const query = useClientQuery(useCallback(() => api.reservation(id), [api, id]));
  const [next, setNext] = useState<string | null>(null);
  const { showToast } = useFeedback();
  const transitions: Record<string, string[]> = { PLACED: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PROCESSING', 'CANCELLED'], PROCESSING: ['READY', 'CANCELLED'], READY: ['COMPLETED', 'CANCELLED'] };
  return <PetCareScreen><PetCareHeader title={`Reserva #${id}`} back/><QueryState {...query}/>
    {query.data && <><PetCareCard><AppText variant="subtitle">{statusLabel(String(query.data.status))}</AppText><AppText>Retiro y gestión en la veterinaria. Sin pago online.</AppText>{query.data.clientName && <AppText>{String(query.data.clientName)}</AppText>}{query.data.phone && <AppText>Contacto: {String(query.data.phone)}</AppText>}<AppText>Importe informativo: {money(Number(query.data.totalCents))}</AppText></PetCareCard>
      {query.data.items?.map(item => <PetCareCard key={String(item.productId)}><AppText variant="subtitle">{String(item.name)}</AppText><AppText>Cantidad: {String(item.quantity)}</AppText>{item.petName && <AppText>Mascota: {String(item.petName)}</AppText>}{item.prescriptionId && <AppText>Receta asociada: #{String(item.prescriptionId)}</AppText>}</PetCareCard>)}
      {hasPermission('reservations.manage') && (transitions[String(query.data.status)] ?? []).map(status => <AppButton key={status} label={status === 'COMPLETED' ? 'Marcar retirada' : status === 'PROCESSING' ? 'Preparar' : statusLabel(status)} onPress={() => setNext(status)}/>)}
    </>}
    <ConfirmModal visible={Boolean(next)} title="Actualizar reserva" message={next === 'CANCELLED' ? 'Se cancelará la reserva y se liberarán sus unidades.' : next === 'COMPLETED' ? 'Se registrará el retiro y se descontarán las unidades del stock físico.' : 'El cliente verá el estado actualizado.'} destructive={next === 'CANCELLED'} confirmLabel="Confirmar" onCancel={() => setNext(null)} onConfirm={async () => { await api.changeReservation(id, next!); setNext(null); showToast('Reserva actualizada', 'success'); query.reload(); }}/>
  </PetCareScreen>;
}
