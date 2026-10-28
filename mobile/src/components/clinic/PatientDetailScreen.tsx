// Este archivo se encarga de lo siguiente: Componente reutilizable del área clínica; permite al personal gestionar agenda, pacientes y atención.

import { useCallback, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useTheme } from '../../hooks/useTheme';
import { patientDetailPresentation } from '../../constants/responsive';
import type { ClinicRow } from '../../types/clinic';
import { clinicDate, clinicDateTime } from '../../utils/clinic-date';
import { patientScreenConfig } from '../../utils/patient-screen-config';
import { normalizePetActiveFlag, petStatusBadge } from '../../utils/pet-status';
import { AdminDataTable } from '../admin/AdminDataTable';
import { AdminStatusBadge } from '../admin/AdminStatusBadge';
import { AppButton } from '../ui/AppButton';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';
import { PatientLifecycleControl } from './PatientLifecycleControl';
import { PetCareCard, PetCareEmptyState, PetCareHeader, PetCareScreen, PetImage, QueryState, statusLabel } from '../client/PetCareUI';

// Configuración clinicalSections: reúne valores o reglas que consume el resto del módulo.
const clinicalSections = [
  { kind: 'medical-history', label: 'Consultas', view: 'medical_records.view', create: 'medical_records.create' },
  { kind: 'vaccines', label: 'Vacunas', view: 'vaccines.view', create: 'vaccines.create' },
  { kind: 'prescriptions', label: 'Recetas y tratamientos', view: 'prescriptions.view', create: 'prescriptions.create' },
  { kind: 'recommendations', label: 'Recomendaciones', view: 'medical_records.view', create: 'recommendations.create' },
];

/** Ficha clínica compartida: una fuente de datos y permisos con presentaciones móvil y escritorio. */
// Función PatientDetailScreen: concentra la lógica dentro de este módulo.
export function PatientDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const api = useClinic();
  const { user, hasPermission } = useAuth();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const presentation = patientDetailPresentation(Platform.OS, width);
  const desktop = presentation.twoColumns;
  const desktopTable = presentation.clinicalTables;
  const veterinarian = user?.role === 'VETERINARIAN';
  const canManageLifecycle = patientScreenConfig(user?.role ?? '', code => hasPermission(code)).canManagePatientLifecycle;
  const [kind, setKind] = useState(clinicalSections.find(section => veterinarian && hasPermission(section.view))?.kind ?? '');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const details = useClientQuery(useCallback(() => api.patient(id), [api, id]));
  const canViewAppointments = user?.role === 'GROOMER' ? hasPermission('appointments.view_own') : hasPermission('appointments.view_own') || hasPermission('appointments.view_all');
  const appointments = useClientQuery(useCallback(() => canViewAppointments ? api.appointments({ petId: id }) : Promise.resolve(null), [api, canViewAppointments, id]));
  const allowedSections = clinicalSections.filter(section => veterinarian && hasPermission(section.view));
  const records = useClientQuery(useCallback(() => kind && veterinarian ? api.recordsPage(id, kind, 1) : Promise.resolve(null), [api, id, kind, veterinarian]));
  const pagingAction = useAsyncAction();
  const [extraRecords, setExtraRecords] = useState<{ key: string; items: ClinicRow[]; nextPage: number | null } | null>(null);
  const recordKey = `${id}:${kind}`;
  const recordItems = [...(records.data?.items ?? []), ...(extraRecords?.key === recordKey ? extraRecords.items : [])];
  const nextRecordPage = extraRecords?.key === recordKey ? extraRecords.nextPage : records.data?.nextPage ?? null;
  // Función field: agrupa una operación que este módulo puede ejecutar o reutilizar.
const field = (key: string) => details.data?.[key];
  const name = String(field('name') ?? 'Paciente');
  const species = String(field('species') ?? 'Sin especie registrada');
  const breed = Boolean(field('breed')) ? String(field('breed')) : 'Sin raza registrada';
  const isGroomer = user?.role === 'GROOMER';
  const appointmentPath = user?.role === 'GROOMER' ? '/professional/appointment' : user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin/appointment' : '/vet/appointment';
  const groomingHistory = Array.isArray(field('groomingHistory')) ? field('groomingHistory') as unknown as ClinicRow[] : [];

  const recordColumns = [
    { key: 'title', label: 'Registro', flex: 1.1, minWidth: 185, render: (record: ClinicRow) => <AppText style={styles.recordTitle}>{String(record.title)}</AppText> },
    { key: 'date', label: 'Fecha', flex: .85, minWidth: 145, render: (record: ClinicRow) => <AppText variant="caption">{clinicDateTime(String(record.occurredAt))}</AppText> },
    { key: 'professional', label: 'Profesional', flex: .8, minWidth: 135, render: (record: ClinicRow) => <AppText variant="caption">{String(record.veterinarian ?? 'No informado')}</AppText> },
    { key: 'summary', label: 'Resumen', flex: 1.35, minWidth: 190, render: (record: ClinicRow) => <AppText variant="caption">{String(record.content ?? record.treatment ?? record.reason ?? 'Sin resumen')}</AppText> },
    { key: 'detail', label: '', flex: .35, minWidth: 72, align: 'right' as const, render: (record: ClinicRow) => <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${String(record.title)}`} onPress={() => setSelectedRecordId(String(record.id))} style={styles.rowAction}><AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>Abrir</AppText></Pressable> },
  ];

  return <PetCareScreen wide>
    <PetCareHeader title={isGroomer ? 'Historial de peluquería' : 'Ficha clínica'} subtitle={isGroomer ? 'Servicios realizados en tus turnos' : undefined} back hideForAdmin />
    
<QueryState {...details} />
    {details.data && <>
      <View style={[styles.patientHeader, { backgroundColor: colors.surface, borderColor: colors.border }, desktop && styles.patientHeaderDesktop]}>
        <PetImage uri={typeof field('photoUrl') === 'string' ? String(field('photoUrl')) : null} size={desktop ? 104 : 72} species={species} />
        <View style={styles.patientHeaderCopy}>
          <AppText variant={desktop ? 'title' : 'subtitle'}>{name}</AppText>
          <AppText muted>{species}{Boolean(field('breed')) ? ` · ${String(field('breed'))}` : ''}</AppText>
          {!isGroomer && <View style={styles.badgeRow}><AdminStatusBadge status={petStatusBadge(field('isActive') as boolean|number|string|null|undefined)} />{veterinarian && <AppText variant="caption" muted>{field('sex') === 'FEMALE' ? 'Hembra' : field('sex') === 'MALE' ? 'Macho' : 'Sexo no registrado'}</AppText>}</View>}
          {isGroomer && <AppText variant="caption" muted>Servicios de peluquería asignados a tu usuario</AppText>}
        </View>
      </View>

      {isGroomer ? <>
        <AppText variant="subtitle">Servicios realizados</AppText>
        <PatientLifecycleControl patientId={id} isActive={normalizePetActiveFlag(field('isActive') as boolean|number|string|null|undefined)} canManage={canManageLifecycle} onComplete={() => details.reload()} />
        <PatientLifecycleHistory events={field('lifecycleHistory')} />
        {groomingHistory.length ? desktopTable ? <AdminDataTable rows={groomingHistory} rowKey={item => String(item.id)} columns={[
          { key: 'service', label: 'Servicio', flex: 1, minWidth: 175, render: (item: ClinicRow) => <AppText style={styles.recordTitle}>{String(item.service)}</AppText> },
          { key: 'date', label: 'Fecha', flex: 1, minWidth: 180, render: (item: ClinicRow) => <AppText variant="caption">{clinicDateTime(String(item.startsAt))}</AppText> },
          { key: 'status', label: 'Estado', flex: .6, minWidth: 105, render: (item: ClinicRow) => <AppText variant="caption">{statusLabel(String(item.status))}</AppText> },
          { key: 'action', label: '', flex: .55, minWidth: 90, align: 'right' as const, render: (item: ClinicRow) => <Pressable accessibilityRole="button" accessibilityLabel="Abrir turno" onPress={() => router.push({ pathname: '/professional/appointment' as never, params: { id: String(item.appointmentId) } })} style={styles.rowAction}><AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>Abrir turno</AppText></Pressable> },
        ]} /> : <View style={styles.mobileList}>{groomingHistory.map(item => <PetCareCard key={item.id}>
          <AppText variant="caption" muted>{clinicDateTime(String(item.startsAt))} · {statusLabel(String(item.status))}</AppText>
          <AppText variant="subtitle">{String(item.service)}</AppText>
          <AppText variant="caption" muted>Registrado por {user?.firstName} {user?.lastName} · {clinicDateTime(String(item.createdAt))}</AppText>
          {Boolean(item.coatNotes) && <PatientDisclosure title="Observaciones del pelaje"><AppText>{String(item.coatNotes)}</AppText></PatientDisclosure>}
          {Boolean(item.behaviorNotes) && <PatientDisclosure title="Comportamiento"><AppText>{String(item.behaviorNotes)}</AppText></PatientDisclosure>}
          {Boolean(item.careInstructions) && <PatientDisclosure title="Indicaciones de cuidado"><AppText>{String(item.careInstructions)}</AppText></PatientDisclosure>}
          <AppButton compact variant="secondary" label="Abrir turno" onPress={() => router.push({ pathname: '/professional/appointment' as never, params: { id: String(item.appointmentId) } })} />
        </PetCareCard>)}</View> : <PetCareEmptyState title="Todavía no hay servicios realizados" message="El historial se completa con los turnos de peluquería que atendés." />}
      </> : <>
        <View style={[styles.profileColumns, desktop && styles.profileColumnsDesktop]}>
          <View style={[styles.profileColumn, desktop && styles.profileColumnDesktop]}>
            <PetCareCard><AppText variant="subtitle">Resumen clínico</AppText><View style={styles.infoGrid}>
              {Boolean(field('lastConsultationAt')) && <PatientInfo label="Última consulta" value={clinicDateTime(String(field('lastConsultationAt')))} />}
              {Boolean(field('nextAppointmentAt')) && <PatientInfo label="Próximo turno" value={clinicDateTime(String(field('nextAppointmentAt')))} emphasis />}
              {field('weightKg') !== null && field('weightKg') !== undefined && <PatientInfo label="Último peso registrado" value={`${String(field('weightKg'))} kg`} />}
              {!field('lastConsultationAt') && !field('nextAppointmentAt') && (field('weightKg') === null || field('weightKg') === undefined) && <AppText muted>No hay datos de seguimiento registrados.</AppText>}
            </View></PetCareCard>
            <PetCareCard><AppText variant="subtitle">Datos generales</AppText><View style={styles.infoGrid}>
              <PatientInfo label="Especie" value={species} /><PatientInfo label="Raza" value={breed} />
              {veterinarian && <PatientInfo label="Sexo" value={field('sex') === 'FEMALE' ? 'Hembra' : field('sex') === 'MALE' ? 'Macho' : 'No especificado'} />}
              {Boolean(field('birthDate')) && <PatientInfo label="Fecha de nacimiento" value={clinicDate(String(field('birthDate')))} />}
              {veterinarian && Boolean(field('microchipNumber')) && <PatientInfo label="Microchip" value={String(field('microchipNumber'))} />}
            </View></PetCareCard>
          </View>
          <View style={[styles.profileColumn, desktop && styles.profileColumnDesktop]}>
            <PetCareCard><AppText variant="subtitle">Propietario y contacto</AppText>
              {Boolean(field('ownerName')) ? <AppText style={styles.ownerName}>{String(field('ownerName'))}</AppText> : <AppText muted>No hay propietario informado.</AppText>}
              {veterinarian && Boolean(field('ownerEmail')) && <PatientInfo label="Correo" value={String(field('ownerEmail'))} />}
              {veterinarian && Boolean(field('ownerPhone')) && <PatientInfo label="Teléfono" value={String(field('ownerPhone'))} />}
              {veterinarian && Boolean(field('ownerId')) && <Pressable accessibilityRole="button" accessibilityLabel="Abrir ficha autorizada del propietario" onPress={() => router.push({ pathname: '/vet/client' as never, params: { id: String(field('ownerId')) } })} style={styles.ownerAction}><AppText style={{ color: colors.primary, fontWeight: '700' }}>Ver propietario y sus mascotas ›</AppText></Pressable>}
            </PetCareCard>
            {normalizePetActiveFlag(field('isActive') as boolean|number|string|null|undefined)===false && <PetCareCard style={{ borderColor: colors.danger }}><AppText variant="subtitle">Paciente inactivo</AppText><AppText>{String(field('deactivationReason') ?? 'Sin motivo registrado.')}</AppText>{Boolean(field('deactivatedAt')) && <AppText variant="caption" muted>Desactivado el {clinicDateTime(String(field('deactivatedAt')))}</AppText>}</PetCareCard>}
              <PatientLifecycleControl patientId={id} isActive={normalizePetActiveFlag(field('isActive') as boolean|number|string|null|undefined)} canManage={canManageLifecycle} onComplete={() => details.reload()} />
            <PatientLifecycleHistory events={field('lifecycleHistory')} />
          </View>
        </View>

        {canViewAppointments && <View style={styles.clinicalSection}>
          <View><AppText variant="subtitle">Turnos del paciente</AppText><AppText variant="caption" muted>Historial y próximas atenciones dentro de tu alcance</AppText></View>
          
<QueryState {...appointments} />
          {appointments.data && (appointments.data.length ? desktopTable ? <AdminDataTable rows={appointments.data} rowKey={appointment => String(appointment.id)} columns={[
            { key: 'date', label: 'Fecha y hora', flex: .9, minWidth: 160, render: (appointment: ClinicRow) => <AppText variant="caption">{clinicDateTime(String(appointment.startsAt))}</AppText> },
            { key: 'service', label: 'Servicio', flex: 1.1, minWidth: 180, render: (appointment: ClinicRow) => <AppText style={styles.recordTitle}>{String(appointment.service)}</AppText> },
            { key: 'status', label: 'Estado', flex: .6, minWidth: 110, render: (appointment: ClinicRow) => <AppText variant="caption">{statusLabel(String(appointment.status))}</AppText> },
            { key: 'detail', label: '', flex: .5, minWidth: 90, align: 'right' as const, render: (appointment: ClinicRow) => <Pressable accessibilityRole="button" accessibilityLabel="Abrir detalle del turno" onPress={() => router.push({ pathname: appointmentPath as never, params: { id: String(appointment.id) } })} style={styles.rowAction}><AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>Abrir turno</AppText></Pressable> },
          ]} /> : <View style={styles.mobileList}>{appointments.data.map(appointment => <PetCareCard key={appointment.id}>
            <AppText variant="caption" muted>{clinicDateTime(String(appointment.startsAt))} · {statusLabel(String(appointment.status))}</AppText><AppText variant="subtitle">{String(appointment.service)}</AppText>
            <AppButton compact variant="secondary" label="Abrir turno" onPress={() => router.push({ pathname: appointmentPath as never, params: { id: String(appointment.id) } })} />
          </PetCareCard>)}</View> : <PetCareEmptyState title="No hay turnos para este paciente" />)}
        </View>}

        {allowedSections.length > 0 && <View style={styles.clinicalSection}>
          <View><AppText variant="subtitle">Historia clínica</AppText><AppText variant="caption" muted>Consulta cronológica de registros autorizados</AppText></View>
          <View accessibilityRole="radiogroup" accessibilityLabel="Sección de historia clínica" style={styles.sectionPicker}>{allowedSections.map(section => <Pressable key={section.kind} accessibilityRole="radio" accessibilityState={{ checked: kind === section.kind }} onPress={() => { setKind(section.kind); setExtraRecords(null); }} style={[styles.sectionChip, { backgroundColor: kind === section.kind ? colors.primary : colors.surface, borderColor: kind === section.kind ? colors.primary : colors.border }]}><AppText variant="caption" style={{ color: kind === section.kind ? colors.onPrimary : colors.text, fontWeight: '700' }}>{section.label}</AppText></Pressable>)}</View>
          
<QueryState {...records} />
          {records.data && (recordItems.length ? desktopTable ? <AdminDataTable rows={recordItems} rowKey={record => String(record.id)} columns={recordColumns} /> : <View style={styles.timeline}>{recordItems.map(record => <Pressable key={record.id} accessibilityRole="button" accessibilityLabel={`Ver ${String(record.title)}, ${clinicDateTime(String(record.occurredAt))}`} onPress={() => setSelectedRecordId(String(record.id))} style={styles.timelineItem}><View style={[styles.timelineMarker, { backgroundColor: colors.primary, borderColor: colors.surface }]} /><PetCareCard><AppText variant="caption" muted>{clinicDateTime(String(record.occurredAt))}{Boolean(record.veterinarian) ? ` · ${String(record.veterinarian)}` : ''}</AppText><AppText variant="subtitle">{String(record.title)}</AppText>{Boolean(record.content) && <AppText>{String(record.content)}</AppText>}<AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>Ver detalle clínico</AppText></PetCareCard></Pressable>)}</View> : <PetCareEmptyState title="No hay registros para esta sección" />)}
          {!!nextRecordPage && <View style={styles.loadMore}><AppButton compact={desktop} variant="secondary" label="Cargar más registros" loading={pagingAction.loading} onPress={() => void pagingAction.run(async () => { const page = await api.recordsPage(id, kind, nextRecordPage); setExtraRecords(current => ({ key: recordKey, items: [...(current?.key === recordKey ? current.items : []), ...page.items], nextPage: page.nextPage })); })} /></View>}
          <FormNotice error message={pagingAction.error} />
        </View>}

        <AppModal size="wide" visible={Boolean(selectedRecordId)} dismissible onClose={() => setSelectedRecordId('')}>
          <AppText variant="title">Detalle clínico</AppText>
          {(() => { const record = recordItems.find(item => String(item.id) === selectedRecordId); if (!record) return null; const staff = ['VETERINARIAN', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role ?? ''); return <PetCareCard>
            <AppText variant="subtitle">{String(record.title)}</AppText><PatientInfo label="Tipo de atención" value={clinicalSections.find(section => section.kind === record.kind)?.label ?? String(record.kind)} /><PatientInfo label="Fecha" value={clinicDateTime(String(record.occurredAt))} />
            {Boolean(record.veterinarian) && <PatientInfo label="Profesional responsable" value={String(record.veterinarian)} />}
            {Boolean(record.content) && <PatientInfo label="Indicaciones para el propietario" value={String(record.content)} />}
            {staff && Boolean(record.internalNotes) && <PatientDisclosure title="Observaciones internas"><AppText>{String(record.internalNotes)}</AppText></PatientDisclosure>}
            {staff && Boolean(record.reason) && <PatientInfo label="Motivo" value={String(record.reason)} />}{staff && Boolean(record.diagnosis) && <PatientInfo label="Diagnóstico" value={String(record.diagnosis)} />}{staff && Boolean(record.treatment) && <PatientInfo label="Tratamiento" value={String(record.treatment)} />}
            {Boolean(record.productName) && <PatientInfo label="Producto indicado" value={String(record.productName)} />}{veterinarian && Boolean(record.dose) && <PatientInfo label="Dosis" value={String(record.dose)} />}{veterinarian && Boolean(record.frequency) && <PatientInfo label="Frecuencia" value={String(record.frequency)} />}{veterinarian && Boolean(record.duration) && <PatientInfo label="Duración" value={String(record.duration)} />}
            {Boolean(record.nextDueAt) && <PatientInfo label="Próximo control" value={clinicDateTime(String(record.nextDueAt))} />}{Boolean(record.validUntil) && <PatientInfo label="Vigencia" value={clinicDateTime(String(record.validUntil))} />}
          </PetCareCard>; })()}
          <AppButton compact={desktop} label="Cerrar" onPress={() => setSelectedRecordId('')} />
        </AppModal>
        {clinicalSections.filter(section => veterinarian && hasPermission(section.create)).map(section => <View key={section.kind} style={[styles.createAction, desktop && styles.createActionDesktop]}><AppButton compact={desktop} label={`Registrar ${section.label.toLocaleLowerCase()}`} onPress={() => router.push({ pathname: '/vet/record' as never, params: { id, kind: section.kind } })} /></View>)}
      </>}
    </>}
  </PetCareScreen>;
}

// Función PatientInfo: concentra la lógica dentro de este módulo.
function PatientInfo({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <View style={styles.infoItem}><AppText variant="caption" muted>{label}</AppText><AppText style={emphasis ? styles.infoEmphasis : undefined}>{value}</AppText></View>;
}

// Función PatientDisclosure: concentra la lógica dentro de este módulo.
function PatientDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  return <View style={[styles.disclosure, { borderColor: colors.border }]}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={styles.disclosureToggle}><AppText style={styles.recordTitle}>{title}</AppText><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} /></Pressable>
    {open && <View style={styles.disclosureContent}>{children}</View>}
  </View>;
}

// Función PatientLifecycleHistory: concentra la lógica dentro de este módulo.
function PatientLifecycleHistory({ events }: { events: unknown }) {
  if (!Array.isArray(events)) return null;
  const history = events as ClinicRow[];
  return <PatientDisclosure title="Historial de estado">{history.length ? <View style={styles.mobileList}>{history.map((event, index) => <View key={String(event.id ?? index)} style={styles.historyEvent}>
    <AdminStatusBadge status={petStatusBadge(event.isActive as boolean|number|string|null|undefined)} />
    <AppText variant="caption" muted>{clinicDateTime(String(event.createdAt ?? ''))}{Boolean(event.actorName) ? ` · ${String(event.actorName)}` : ''}{Boolean(event.actorRole) ? ` (${String(event.actorRole)})` : ''}</AppText>
    <AppText>{String(event.reason ?? '')}</AppText>
  </View>)}</View> : <AppText muted>No hay cambios de estado registrados.</AppText>}</PatientDisclosure>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  patientHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: 1, borderRadius: 18 },
  patientHeaderDesktop: { gap: 20, padding: 22 }, patientHeaderCopy: { flex: 1, minWidth: 0, gap: 4 }, badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  profileColumns: { width: '100%', gap: 14 }, profileColumnsDesktop: { flexDirection: 'row', alignItems: 'flex-start' }, profileColumn: { width: '100%', gap: 14 }, profileColumnDesktop: { width: 'auto', flex: 1, minWidth: 0 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, infoItem: { width: '100%', minWidth: 0, gap: 2 }, infoEmphasis: { fontWeight: '700' }, ownerName: { fontWeight: '700' }, ownerAction: { alignSelf: 'flex-start', paddingVertical: 10 },
  clinicalSection: { width: '100%', gap: 12 }, sectionPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, sectionChip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  timeline: { width: '100%', gap: 4, paddingLeft: 12, borderLeftWidth: 2, borderColor: '#D7E7E0' }, timelineItem: { position: 'relative', paddingLeft: 14 }, timelineMarker: { position: 'absolute', left: -19, top: 18, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  mobileList: { width: '100%', gap: 12 }, historyEvent: { gap: 6, paddingVertical: 8 }, recordTitle: { fontWeight: '700' }, rowAction: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 10 }, loadMore: { alignItems: 'flex-start' }, createAction: { width: '100%' }, createActionDesktop: { width: 'auto', alignSelf: 'flex-start' },
  disclosure: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' }, disclosureToggle: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, disclosureContent: { paddingHorizontal: 12, paddingBottom: 12 },
});
