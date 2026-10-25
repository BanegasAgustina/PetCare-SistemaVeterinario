/** Consulta y gestiona un turno, de acuerdo con los permisos vigentes. */
import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { PetCareScreen, PetCareCard, PetImage, QueryState, statusLabel } from '../client/PetCareUI';
import { SlotSelectionCard } from '../client/SlotSelectionCard';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { AppModal } from '../ui/AppModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { FormNotice } from '../ui/FormNotice';
import { AdminPageHeading } from '../admin/AdminPageHeading';
import { SelectionRow } from '../ui/SelectionRow';
import { clinicDate,clinicDateTime } from '../../utils/clinic-date';

export function AppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useClinic();
  const { hasPermission,user } = useAuth();
  const patientScope=hasPermission('pets.view_all')||hasPermission('pets.view_assigned');
  const query = useClientQuery(useCallback(() => api.appointment(id), [api, id]));
  const groomingRecord = useClientQuery(useCallback(() => user?.role==='GROOMER'&&query.data&&['IN_PROGRESS','COMPLETED'].includes(String(query.data.status))?api.groomingRecord(id):Promise.resolve(null),[api,id,user?.role,query.data]));
  const appointmentPetId=query.data?.petId?String(query.data.petId):'';
  const patient=useClientQuery(useCallback(()=>user?.role==='VETERINARIAN'&&hasPermission('pets.view_information')&&appointmentPetId?api.patient(appointmentPetId):Promise.resolve(null),[api,user?.role,appointmentPetId,hasPermission]));
  const history=useClientQuery(useCallback(()=>user?.role==='VETERINARIAN'&&patientScope&&appointmentPetId&&hasPermission('medical_records.view')?api.records(appointmentPetId,'medical-history'):Promise.resolve(null),[api,user?.role,patientScope,appointmentPetId,hasPermission]));
  const [next, setNext] = useState<string | null>(null);
  const [slot, setSlot] = useState('');
  const [professional, setProfessional] = useState('');
  const [observations, setObservations] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationError, setCancellationError] = useState<string | null>(null);
  const observationAction = useAsyncAction();
  const groomingSaveAction = useAsyncAction();
  const [coatNotes,setCoatNotes]=useState<string|null>(null),[behaviorNotes,setBehaviorNotes]=useState<string|null>(null),[careInstructions,setCareInstructions]=useState<string|null>(null);
  const cancellationAction = useAsyncAction();
  const catalog = useClientQuery(api.catalog);
  const slots = useClientQuery(useCallback(() => query.data && hasPermission('appointments.manage') ? api.slots(String(query.data.serviceId), professional || undefined) : Promise.resolve(null), [api, query.data, professional, hasPermission]));
  const { showToast } = useFeedback();
  const observationValue = observations ?? String(query.data?.observations ?? '');
  const transitions: Record<string, string[]> = { REQUESTED: ['CONFIRMED', 'REJECTED', 'CANCELLED'], CONFIRMED: ['IN_PROGRESS', 'CANCELLED'], IN_PROGRESS: ['COMPLETED', 'CANCELLED'] };
  const hasSavedConsultation=Boolean(history.data?.some(record=>String(record.appointmentId)===id));

  async function saveObservations() {
    const saved = await observationAction.run(() => api.changeAppointment(id, { observations: observationValue }));
    if (saved) { showToast('Observaciones guardadas', 'success'); query.reload(); }
  }
  async function cancelAppointment() {
    const reason = cancellationReason.trim();
    if (reason.length < 3 || reason.length > 500) { setCancellationError('Ingresá un motivo de entre 3 y 500 caracteres.'); return; }
    setCancellationError(null);
    const saved = await cancellationAction.run(() => api.changeAppointment(id, { status: 'CANCELLED', cancellationReason: reason }));
    if (saved) { setNext(null); showToast('Turno cancelado', 'success'); query.reload(); }
  }

  return <PetCareScreen wide>
    <AppModal size="wide" visible dismissible onClose={() => router.back()}>
    <AdminPageHeading title="Detalle del turno"/>
    <QueryState {...query} />
    {query.data && <>
      <PetCareCard>
        <PetImage uri={typeof query.data.petPhotoUrl === 'string' ? query.data.petPhotoUrl : null} size={104} />
        <AppText variant="subtitle">{String(query.data.petName)}</AppText>
        {hasPermission('users.view_basic') && Boolean(query.data.ownerName) && <AppText>Propietario: {String(query.data.ownerName)}</AppText>}
        {hasPermission('users.view_basic') && Boolean(query.data.ownerPhone) && <AppText>Teléfono: {String(query.data.ownerPhone)}</AppText>}
        <AppText>Servicio: {String(query.data.service)}</AppText>
        <AppText>Veterinario: {String(query.data.veterinarian)}</AppText>
        <AppText>{clinicDateTime(String(query.data.startsAt))}</AppText>
        <AppText>Estado: {statusLabel(String(query.data.status))}</AppText>
        {Boolean(query.data.cancellationReason) && <AppText>Motivo de cancelación: {String(query.data.cancellationReason)}</AppText>}
        {user?.role==='VETERINARIAN'&&hasPermission('pets.view_information')&&<AppButton label="Abrir ficha del paciente" variant="secondary" onPress={()=>router.push({pathname:'/vet/patient' as never,params:{id:String(query.data!.petId)}})}/>}
        {user?.role==='VETERINARIAN'&&patientScope&&hasPermission('medical_records.create')&&['CONFIRMED','IN_PROGRESS'].includes(String(query.data.status))&&<AppButton label={query.data.status==='IN_PROGRESS'?'Continuar atención':'Completar ficha de atención'} onPress={()=>router.push({pathname:'/vet/record' as never,params:{id:String(query.data!.petId),kind:'medical-history',appointmentId:String(query.data!.id)}})}/>}
      </PetCareCard>
      {user?.role==='VETERINARIAN'&&<>
        {hasPermission('pets.view_information')&&<QueryState {...patient}/>}
        {patient.data&&<PetCareCard><AppText variant="subtitle">Ficha del paciente</AppText><AppText>{String(patient.data.species)}{Boolean(patient.data.breed)?` · ${String(patient.data.breed)}`:''}</AppText><AppText>Sexo: {patient.data.sex==='FEMALE'?'Hembra':patient.data.sex==='MALE'?'Macho':'No especificado'}</AppText>{Boolean(patient.data.birthDate)&&<AppText>Fecha de nacimiento: {clinicDate(String(patient.data.birthDate))}</AppText>}{patient.data.weightKg!==null&&patient.data.weightKg!==undefined&&<AppText>Peso registrado: {String(patient.data.weightKg)} kg</AppText>}{Boolean(patient.data.microchipNumber)&&<AppText>Microchip: {String(patient.data.microchipNumber)}</AppText>}</PetCareCard>}
        {patientScope&&hasPermission('medical_records.view')&&<><AppText variant="subtitle">Antecedentes e historial previo</AppText><QueryState {...history}/>{history.data&&(history.data.length?history.data.slice(0,5).map(record=><PetCareCard key={record.id}><AppText variant="subtitle">{String(record.title)}</AppText><AppText muted>{clinicDateTime(String(record.occurredAt))}</AppText>{Boolean(record.internalNotes)&&<AppText>{String(record.internalNotes)}</AppText>}{Boolean(record.reason)&&<AppText>Motivo: {String(record.reason)}</AppText>}{Boolean(record.diagnosis)&&<AppText>Diagnóstico: {String(record.diagnosis)}</AppText>}{Boolean(record.treatment)&&<AppText>Tratamiento: {String(record.treatment)}</AppText>}{Boolean(record.content)&&<AppText>Indicaciones previas: {String(record.content)}</AppText>}</PetCareCard>):<AppText muted>No hay consultas anteriores registradas.</AppText>)}</>}
      </>}
      {user?.role==='GROOMER'&&['IN_PROGRESS','COMPLETED'].includes(String(query.data.status))&&<PetCareCard>
        <AppText variant="subtitle">Registro de peluquería</AppText>
        <AppText muted>Este historial se guarda separado de la historia clínica veterinaria.</AppText>
        <QueryState {...groomingRecord}/>
        <AppInput label="Observaciones del pelaje" multiline maxLength={5000} value={coatNotes??String(groomingRecord.data?.coatNotes??'')} onChangeText={setCoatNotes}/>
        <AppInput label="Comportamiento durante el servicio" multiline maxLength={5000} value={behaviorNotes??String(groomingRecord.data?.behaviorNotes??'')} onChangeText={setBehaviorNotes}/>
        <AppInput label="Indicaciones de cuidado" multiline maxLength={5000} value={careInstructions??String(groomingRecord.data?.careInstructions??'')} onChangeText={setCareInstructions}/>
        <FormNotice error message={groomingSaveAction.error}/>
        <AppButton label="Guardar registro del servicio" loading={groomingSaveAction.loading} disabled={!String(coatNotes??groomingRecord.data?.coatNotes??'').trim()&&!String(behaviorNotes??groomingRecord.data?.behaviorNotes??'').trim()&&!String(careInstructions??groomingRecord.data?.careInstructions??'').trim()} onPress={()=>void groomingSaveAction.run(async()=>{await api.saveGroomingRecord(id,{coatNotes,behaviorNotes,careInstructions});setCoatNotes(null);setBehaviorNotes(null);setCareInstructions(null);groomingRecord.reload();showToast('Registro de peluquería guardado','success');})}/>
      </PetCareCard>}
      {user?.role!=='VETERINARIAN'&&user?.role!=='GROOMER'&&(hasPermission('appointments.manage') || hasPermission('appointments.update_own')) && <PetCareCard>
        <AppText variant="subtitle">Observaciones</AppText>
        <AppInput label="Comentarios del turno" multiline maxLength={5000} value={observationValue} onChangeText={setObservations} />
        <AppButton label="Guardar observaciones" loading={observationAction.loading} disabled={observationValue === String(query.data.observations ?? '')} onPress={() => void saveObservations()} />
        <FormNotice error message={observationAction.error} />
      </PetCareCard>}
      {(hasPermission('appointments.manage') || hasPermission('appointments.update_own')) && (transitions[String(query.data.status)] ?? []).filter(status => hasPermission('appointments.manage') || status !== 'CONFIRMED').filter(status=>user?.role!=='VETERINARIAN'||status!=='COMPLETED'||hasSavedConsultation).map(status => <AppButton key={status} label={user?.role==='VETERINARIAN'&&status==='IN_PROGRESS'?'Iniciar atención':user?.role==='VETERINARIAN'&&status==='COMPLETED'?'Finalizar atención':statusLabel(status)} destructive={status === 'CANCELLED'} onPress={() => { if (status === 'CANCELLED') { setCancellationReason(''); setCancellationError(null); } setNext(status); }} />)}
      {hasPermission('appointments.manage') && !['COMPLETED', 'CANCELLED'].includes(String(query.data.status)) && <>
        <PetCareCard>
          <AppText variant="subtitle">Reprogramar o asignar profesional</AppText>
          <QueryState {...catalog} />
          {catalog.data?.professionals.filter(person => catalog.data?.assignments.some(item => item.professionalId === person.id && item.serviceId === query.data?.serviceId)).map(person => <SelectionRow key={person.id} label={String(person.name)} checked={professional === person.id} onPress={() => { setProfessional(person.id); setSlot(''); }} />)}
        </PetCareCard>
        <QueryState {...slots} />
        {slots.data && <SlotSelectionCard emptyMessage="No hay horarios disponibles para reasignar en este momento.">{slots.data.map(item => <SelectionRow key={item.id} label={clinicDateTime(item.startsAt)} hint={item.veterinarian} checked={slot === item.id} onPress={() => setSlot(item.id)} />)}</SlotSelectionCard>}
        <AppButton label="Confirmar nuevo horario" disabled={!slot} onPress={() => setNext('reschedule')} />
      </>}
    </>}
    <AppButton label="Cerrar" variant="secondary" onPress={() => router.back()} />
    </AppModal>
    <AppModal visible={next === 'CANCELLED'} dismissible onClose={() => setNext(null)}>
      <AppText variant="title">Cancelar consulta</AppText>
      <AppText muted>El motivo quedará asociado al turno y se enviará al propietario.</AppText>
      <AppInput label="Motivo de cancelación" required multiline maxLength={500} value={cancellationReason} error={cancellationError ?? undefined} onChangeText={value => { setCancellationReason(value); setCancellationError(null); }} />
      <FormNotice error message={cancellationAction.error} />
      <AppButton label="Confirmar cancelación" destructive loading={cancellationAction.loading} onPress={() => void cancelAppointment()} />
      <AppButton label="Volver" variant="secondary" disabled={cancellationAction.loading} onPress={() => setNext(null)} />
    </AppModal>
    <ConfirmModal visible={Boolean(next) && next !== 'CANCELLED'} title={user?.role==='VETERINARIAN'&&next==='IN_PROGRESS'?'Iniciar atención':user?.role==='VETERINARIAN'&&next==='COMPLETED'?'Finalizar atención':'Actualizar turno'} message={next === 'reschedule' ? 'Se guardará el nuevo horario y profesional.' : user?.role==='VETERINARIAN'&&next==='COMPLETED'?'La consulta ya está guardada. Se finalizará el turno y quedará registrado en la agenda.':'El nuevo estado se reflejará en la agenda.'} confirmLabel="Confirmar" onCancel={() => setNext(null)} onConfirm={async () => { await api.changeAppointment(id, next === 'reschedule' ? { slotId: slot } : { status: next }); setNext(null); setSlot(''); showToast('Turno actualizado', 'success'); query.reload(); }} />
  </PetCareScreen>;
}
