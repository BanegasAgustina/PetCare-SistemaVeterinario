// Este archivo se encarga de lo siguiente: Componente reutilizable del área clínica; permite al personal gestionar agenda, pacientes y atención.

/** Consulta y gestiona un turno, de acuerdo con los permisos vigentes. */
import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { PetCareScreen, PetCareHeader, PetCareCard, PetImage, QueryState, statusLabel } from '../client/PetCareUI';
import { SlotSelectionCard } from '../client/SlotSelectionCard';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { AppSelectField } from '../forms/AppSelectField';
import { AppModal } from '../ui/AppModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { FormNotice } from '../ui/FormNotice';
import { SelectionRow } from '../ui/SelectionRow';
import { clinicDate,clinicDateTime } from '../../utils/clinic-date';
import { appointmentDisplayValue,appointmentRouteId } from '../../utils/appointment-display';
import { AdminStatusBadge } from '../admin/AdminStatusBadge';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

// Función AppointmentScreen: concentra la lógica dentro de este módulo.
export function AppointmentScreen() {
  const { id:rawId } = useLocalSearchParams<{ id: string|string[] }>();
  const id=appointmentRouteId(rawId);
  const { width } = useWindowDimensions();
  const desktop = isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const api = useClinic();
  const { hasPermission,user } = useAuth();
  const patientScope=hasPermission('pets.view_all')||hasPermission('pets.view_assigned');
  const query = useClientQuery(useCallback(() => id?api.appointment(id):Promise.resolve(null), [api, id]));
  const groomingRecord = useClientQuery(useCallback(() => id&&user?.role==='GROOMER'&&query.data&&['IN_PROGRESS','COMPLETED'].includes(String(query.data.status))?api.groomingRecord(id):Promise.resolve(null),[api,id,user?.role,query.data]));
  const appointmentPetId=query.data?.petId?String(query.data.petId):'';
  const patient=useClientQuery(useCallback(()=>user?.role==='VETERINARIAN'&&hasPermission('pets.view_information')&&appointmentPetId?api.patient(appointmentPetId):Promise.resolve(null),[api,user?.role,appointmentPetId,hasPermission]));
  const history=useClientQuery(useCallback(()=>user?.role==='VETERINARIAN'&&patientScope&&appointmentPetId&&hasPermission('medical_records.view')?api.recordsPage(appointmentPetId,'medical-history',1):Promise.resolve(null),[api,user?.role,patientScope,appointmentPetId,hasPermission]));
  const [extraHistory,setExtraHistory]=useState<{petId:string;items:import('../../types/clinic').ClinicRow[];nextPage:number|null}|null>(null);
  const [selectedHistoryId,setSelectedHistoryId]=useState('');
  const historyPageAction=useAsyncAction();
  const historyItems=[...(history.data?.items??[]),...(extraHistory?.petId===appointmentPetId?extraHistory.items:[])];
  const historyNextPage=extraHistory?.petId===appointmentPetId?extraHistory.nextPage:history.data?.nextPage??null;
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
  const hasSavedConsultation=Boolean(id&&historyItems.some(record=>String(record.appointmentId)===id));

  // Función saveObservations: actualiza o guarda información dentro de este módulo.
async function saveObservations() {
    if(!id)return;
    const saved = await observationAction.run(() => api.changeAppointment(id, { observations: observationValue }));
    if (saved) { showToast('Observaciones guardadas', 'success'); query.reload(); }
  }
  // Función cancelAppointment: elimina, revoca o cancela una operación dentro de este módulo.
async function cancelAppointment() {
    if(!id)return;
    const reason = cancellationReason.trim();
    if (reason.length < 3 || reason.length > 500) { setCancellationError('Ingresá un motivo de entre 3 y 500 caracteres.'); return; }
    setCancellationError(null);
    const saved = await cancellationAction.run(() => api.changeAppointment(id, { status: 'CANCELLED', cancellationReason: reason }));
    if (saved) { setNext(null); showToast('Turno cancelado', 'success'); query.reload(); }
  }

  return <PetCareScreen wide>
    <PetCareHeader title="Detalle del turno" back/>
    
<QueryState {...query} />
    {!id&&<FormNotice error message="No se pudo identificar el turno. Volvé a la agenda y abrilo nuevamente."/>}
    {query.data && <>
      <View style={[styles.detailOverview,desktop&&styles.detailOverviewDesktop]}>
      <PetCareCard style={[styles.overviewCard,desktop&&styles.overviewMain]}>
        <View style={[styles.petIdentity,desktop&&styles.petIdentityDesktop]}>
          <PetImage uri={typeof query.data.petPhotoUrl === 'string' ? query.data.petPhotoUrl : null} size={desktop?76:64} />
          <View style={styles.petIdentityCopy}>
            <AppText variant="subtitle">{appointmentDisplayValue(query.data.petName,'Mascota sin nombre')}</AppText>
            <AdminStatusBadge status={String(query.data.status??'')}/>
            {hasPermission('users.view_basic') && Boolean(query.data.ownerName) && <AppText variant="caption" muted>Propietario: {String(query.data.ownerName)}</AppText>}
            {hasPermission('users.view_basic') && Boolean(query.data.ownerPhone) && <AppText variant="caption" muted>Teléfono: {String(query.data.ownerPhone)}</AppText>}
          </View>
        </View>
        <View style={[styles.detailFacts,desktop&&styles.detailFactsDesktop]}>
          <View style={[styles.detailFact,desktop&&styles.detailFactDesktop]}><AppText variant="caption" muted>Servicio</AppText><AppText>{appointmentDisplayValue(query.data.service,'Servicio no disponible')}</AppText></View>
          <View style={[styles.detailFact,desktop&&styles.detailFactDesktop]}><AppText variant="caption" muted>Profesional asignado</AppText><AppText>{appointmentDisplayValue(query.data.veterinarian,'Profesional no informado')}</AppText></View>
          <View style={[styles.detailFact,desktop&&styles.detailFactDesktop]}><AppText variant="caption" muted>Fecha y hora</AppText><AppText>{query.data.startsAt?clinicDateTime(String(query.data.startsAt)):'Fecha y horario no disponibles'}</AppText></View>
        </View>
        {Boolean(query.data.cancellationReason) && <AppText>Motivo de cancelación: {String(query.data.cancellationReason)}</AppText>}
        {user?.role==='VETERINARIAN'&&hasPermission('pets.view_information')&&<AppButton compact={desktop} label="Abrir ficha del paciente" variant="secondary" onPress={()=>router.push({pathname:'/vet/patient' as never,params:{id:String(query.data!.petId)}})}/>}
        {user?.role==='VETERINARIAN'&&patientScope&&hasPermission('medical_records.create')&&['CONFIRMED','IN_PROGRESS'].includes(String(query.data.status))&&<AppButton compact={desktop} label={query.data.status==='IN_PROGRESS'?'Continuar atención':'Completar ficha de atención'} onPress={()=>router.push({pathname:'/vet/record' as never,params:{id:String(query.data!.petId),kind:'medical-history',appointmentId:String(query.data!.id)}})}/>}
      </PetCareCard>
      {user?.role==='VETERINARIAN'&&<>
        {hasPermission('pets.view_information')&&<QueryState {...patient}/>}
        {patient.data&&<PetCareCard style={[styles.overviewCard,desktop&&styles.overviewSecondary]}><AppText variant="subtitle">Ficha del paciente</AppText><AppText>{String(patient.data.species)}{Boolean(patient.data.breed)?` · ${String(patient.data.breed)}`:''}</AppText><AppText>Sexo: {patient.data.sex==='FEMALE'?'Hembra':patient.data.sex==='MALE'?'Macho':'No especificado'}</AppText>{Boolean(patient.data.birthDate)&&<AppText>Fecha de nacimiento: {clinicDate(String(patient.data.birthDate))}</AppText>}{patient.data.weightKg!==null&&patient.data.weightKg!==undefined&&<AppText>Peso registrado: {String(patient.data.weightKg)} kg</AppText>}{Boolean(patient.data.microchipNumber)&&<AppText>Microchip: {String(patient.data.microchipNumber)}</AppText>}</PetCareCard>}
      </>}
      </View>
      {user?.role==='VETERINARIAN'&&<>
        {patientScope&&hasPermission('medical_records.view')&&<><AppText variant="subtitle">Antecedentes e historial previo</AppText><QueryState {...history}/>{history.data&&(historyItems.length?historyItems.map(record=><Pressable key={record.id} accessibilityRole="button" accessibilityLabel={`Ver consulta ${appointmentDisplayValue(record.title,'Consulta')}, ${record.occurredAt?clinicDateTime(String(record.occurredAt)):'fecha no disponible'}`} onPress={()=>setSelectedHistoryId(String(record.id))}><PetCareCard><AppText variant="subtitle" numberOfLines={1}>{appointmentDisplayValue(record.title,'Consulta sin título')}</AppText><AppText variant="caption" muted>{record.occurredAt?clinicDateTime(String(record.occurredAt)):'Fecha no disponible'}{Boolean(record.veterinarian)?` · ${String(record.veterinarian)}`:''}</AppText>{Boolean(record.content)&&<AppText numberOfLines={2}>{String(record.content)}</AppText>}<AppText variant="caption">Abrir detalle</AppText></PetCareCard></Pressable>):<AppText muted>No hay consultas anteriores registradas.</AppText>)}{!!historyNextPage&&<AppButton variant="secondary" label="Cargar más consultas" loading={historyPageAction.loading} onPress={()=>void historyPageAction.run(async()=>{const page=await api.recordsPage(appointmentPetId,'medical-history',historyNextPage);setExtraHistory(current=>({petId:appointmentPetId,items:[...(current?.petId===appointmentPetId?current.items:[]),...page.items],nextPage:page.nextPage}));})}/>}</>}
      </>}
      {user?.role==='GROOMER'&&['IN_PROGRESS','COMPLETED'].includes(String(query.data.status))&&<PetCareCard>
        <AppText variant="subtitle">Registro de peluquería</AppText>
        <AppText muted>Este historial se guarda separado de la historia clínica veterinaria.</AppText>
        
<QueryState {...groomingRecord}/>
        <AppInput label="Observaciones del pelaje" multiline maxLength={5000} value={coatNotes??String(groomingRecord.data?.coatNotes??'')} onChangeText={setCoatNotes}/>
        <AppInput label="Comportamiento durante el servicio" multiline maxLength={5000} value={behaviorNotes??String(groomingRecord.data?.behaviorNotes??'')} onChangeText={setBehaviorNotes}/>
        <AppInput label="Indicaciones de cuidado" multiline maxLength={5000} value={careInstructions??String(groomingRecord.data?.careInstructions??'')} onChangeText={setCareInstructions}/>
        <FormNotice error message={groomingSaveAction.error}/>
        <AppButton label="Guardar registro del servicio" loading={groomingSaveAction.loading} disabled={!id||!String(coatNotes??groomingRecord.data?.coatNotes??'').trim()&&!String(behaviorNotes??groomingRecord.data?.behaviorNotes??'').trim()&&!String(careInstructions??groomingRecord.data?.careInstructions??'').trim()} onPress={()=>void groomingSaveAction.run(async()=>{if(!id)return;await api.saveGroomingRecord(id,{coatNotes,behaviorNotes,careInstructions});setCoatNotes(null);setBehaviorNotes(null);setCareInstructions(null);groomingRecord.reload();showToast('Registro de peluquería guardado','success');})}/>
      </PetCareCard>}
      <View style={[styles.workflowGrid,desktop&&styles.workflowGridDesktop]}>
        <View style={styles.workflowColumn}>
          {user?.role!=='VETERINARIAN'&&user?.role!=='GROOMER'&&(hasPermission('appointments.manage') || hasPermission('appointments.update_own')) && <PetCareCard>
            <AppText variant="subtitle">Observaciones</AppText>
            <AppInput label="Comentarios del turno" multiline maxLength={5000} value={observationValue} onChangeText={setObservations} />
            <View style={[styles.saveActions,desktop&&styles.saveActionsDesktop]}><AppButton compact={desktop} label="Guardar observaciones" loading={observationAction.loading} disabled={observationValue === String(query.data.observations ?? '')} onPress={() => void saveObservations()} /></View>
            <FormNotice error message={observationAction.error} />
          </PetCareCard>}
          {(hasPermission('appointments.manage') || hasPermission('appointments.update_own')) && <View style={[styles.statusActions,desktop&&styles.statusActionsDesktop]}>{(transitions[String(query.data.status)] ?? []).filter(status => hasPermission('appointments.manage') || status !== 'CONFIRMED').filter(status=>user?.role!=='VETERINARIAN'||status!=='COMPLETED'||hasSavedConsultation).map(status => <AppButton compact={desktop} key={status} label={user?.role==='VETERINARIAN'&&status==='IN_PROGRESS'?'Iniciar atención':user?.role==='VETERINARIAN'&&status==='COMPLETED'?'Finalizar atención':statusLabel(status)} destructive={status === 'CANCELLED'} onPress={() => { if (status === 'CANCELLED') { setCancellationReason(''); setCancellationError(null); } setNext(status); }} />)}</View>}
        </View>
        {hasPermission('appointments.manage') && !['COMPLETED', 'CANCELLED'].includes(String(query.data.status)) && <PetCareCard style={[styles.rescheduleCard,desktop&&styles.rescheduleCardDesktop]}>
          <AppText variant="subtitle">Reprogramar turno</AppText>
          <AppText variant="caption" muted>Seleccioná un profesional y un horario disponible para este servicio.</AppText>
          
<QueryState {...catalog} />
          <AppSelectField label="Profesional" required value={professional} options={(catalog.data?.professionals.filter(person=>catalog.data?.assignments.some(item=>item.professionalId===person.id&&item.serviceId===query.data?.serviceId))??[]).map(person=>({id:String(person.id),name:String(person.name)}))} disabled={slots.loading} onChange={value=>{setProfessional(value);setSlot('');}}/>
          
<QueryState {...slots} />
          {slots.data && <SlotSelectionCard emptyMessage="No hay horarios disponibles para reasignar en este momento.">{slots.data.map(item => <SelectionRow key={item.id} label={clinicDateTime(item.startsAt)} hint={item.veterinarian} checked={slot === item.id} onPress={() => setSlot(item.id)} />)}</SlotSelectionCard>}
          <View style={[styles.saveActions,desktop&&styles.saveActionsDesktop]}><AppButton compact={desktop} label="Confirmar nuevo horario" disabled={!slot} onPress={() => setNext('reschedule')} /></View>
        </PetCareCard>}
      </View>
    </>}
    <AppModal visible={next === 'CANCELLED'} dismissible onClose={() => setNext(null)}>
      <AppText variant="title">Cancelar consulta</AppText>
      <AppText muted>El motivo quedará asociado al turno y se enviará al propietario.</AppText>
      <AppInput label="Motivo de cancelación" required multiline maxLength={500} value={cancellationReason} error={cancellationError ?? undefined} onChangeText={value => { setCancellationReason(value); setCancellationError(null); }} />
      <FormNotice error message={cancellationAction.error} />
      <View style={[styles.modalActions,desktop&&styles.modalActionsDesktop]}>
        <AppButton compact={desktop} label="Confirmar cancelación" destructive loading={cancellationAction.loading} onPress={() => void cancelAppointment()} />
        <AppButton compact={desktop} label="Volver" variant="secondary" disabled={cancellationAction.loading} onPress={() => setNext(null)} />
      </View>
    </AppModal>
    <ConfirmModal visible={Boolean(next&&id) && next !== 'CANCELLED'} title={user?.role==='VETERINARIAN'&&next==='IN_PROGRESS'?'Iniciar atención':user?.role==='VETERINARIAN'&&next==='COMPLETED'?'Finalizar atención':'Actualizar turno'} message={next === 'reschedule' ? 'Se guardará el nuevo horario y profesional.' : user?.role==='VETERINARIAN'&&next==='COMPLETED'?'La consulta ya está guardada. Se finalizará el turno y quedará registrado en la agenda.':'El nuevo estado se reflejará en la agenda.'} confirmLabel="Confirmar" onCancel={() => setNext(null)} onConfirm={async () => { if(!id)return;await api.changeAppointment(id, next === 'reschedule' ? { slotId: slot } : { status: next }); setNext(null); setSlot(''); showToast('Turno actualizado', 'success'); query.reload(); }} />
    <AppModal visible={Boolean(selectedHistoryId)} dismissible onClose={()=>setSelectedHistoryId('')}><AppText variant="title">Detalle de consulta</AppText>{(()=>{const record=historyItems.find(item=>String(item.id)===selectedHistoryId);if(!record)return null;return <PetCareCard><AppText variant="subtitle">{appointmentDisplayValue(record.title,'Consulta sin título')}</AppText><AppText>Fecha: {record.occurredAt?clinicDateTime(String(record.occurredAt)):'Fecha no disponible'}</AppText>{Boolean(record.veterinarian)&&<AppText>Profesional: {String(record.veterinarian)}</AppText>}{Boolean(record.content)&&<AppText>Indicaciones para el propietario: {String(record.content)}</AppText>}{Boolean(record.reason)&&<AppText>Motivo: {String(record.reason)}</AppText>}{Boolean(record.diagnosis)&&<AppText>Diagnóstico: {String(record.diagnosis)}</AppText>}{Boolean(record.treatment)&&<AppText>Tratamiento: {String(record.treatment)}</AppText>}{Boolean(record.internalNotes)&&<AppText>Observaciones internas: {String(record.internalNotes)}</AppText>}</PetCareCard>;})()}<AppButton label="Cerrar" onPress={()=>setSelectedHistoryId('')}/></AppModal>
  </PetCareScreen>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({
  detailOverview:{gap:16},detailOverviewDesktop:{flexDirection:'row',alignItems:'flex-start'},overviewCard:{minWidth:0},overviewMain:{flex:1.4},overviewSecondary:{flex:1},
  petIdentity:{flexDirection:'row',alignItems:'center',gap:14},petIdentityDesktop:{alignItems:'flex-start'},petIdentityCopy:{flex:1,minWidth:0,gap:6},detailFacts:{gap:10},detailFactsDesktop:{flexDirection:'row',flexWrap:'wrap'},detailFact:{gap:3},detailFactDesktop:{flex:1,minWidth:145},
  workflowGrid:{gap:16},workflowGridDesktop:{flexDirection:'row',alignItems:'flex-start'},workflowColumn:{flex:1,minWidth:0,gap:16},rescheduleCard:{flex:1,minWidth:0},rescheduleCardDesktop:{flex:1.2},professionalChoices:{gap:4},professionalChoicesDesktop:{maxHeight:230},
  statusActions:{gap:9},statusActionsDesktop:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:10},saveActions:{alignItems:'stretch'},saveActionsDesktop:{alignItems:'flex-end'},modalActions:{gap:9},modalActionsDesktop:{flexDirection:'row',justifyContent:'flex-end',flexWrap:'wrap',gap:10}
});
