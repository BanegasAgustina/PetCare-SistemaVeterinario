import { useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useClinic } from '../../hooks/useClinic';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useAuth } from '../../hooks/useAuth';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { router } from 'expo-router';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';
import { ConfirmModal } from '../ui/ConfirmModal';

/** Shared lifecycle actions for list details and the full patient chart. */
export function PatientLifecycleControl({ patientId, isActive, canManage, onComplete }: { patientId: string; isActive: boolean | null; canManage: boolean; onComplete: () => void }) {
  const api = useClinic();
  const action = useAsyncAction();
  const { showToast } = useFeedback();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const desktop = isWebAtLeast(Platform.OS, width, responsiveLayout.breakpoints.desktop);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  if (!canManage) return null;
  if (isActive === null) return <AppText variant="caption" muted>El estado no está disponible; no se puede cambiar hasta recibir un valor válido del servidor.</AppText>;
  const hasAppointmentConflict = /turno/i.test(action.error ?? '');
  const agendaPath = user?.role === 'GROOMER' ? '/professional/agenda' : user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin/agenda' : '/vet/agenda';

  async function deactivate() {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3 || normalizedReason.length > 500) {
      setReasonError('Ingresá un motivo de entre 3 y 500 caracteres.');
      return;
    }
    setReasonError('');
    const saved = await action.run(() => api.deactivatePatient(patientId, normalizedReason));
    if (saved) {
      setDeactivateOpen(false);
      setReason('');
      showToast('Paciente desactivado; su historia y sus turnos históricos se conservaron.', 'success');
      onComplete();
    }
  }

  async function reactivate() {
    const saved = await action.run(() => api.reactivatePatient(patientId));
    if (saved) {
      setReactivateOpen(false);
      showToast('Paciente reactivado y registrado en el historial.', 'success');
      onComplete();
    }
  }

  return <>
    <AppButton compact={desktop} label={isActive ? 'Desactivar paciente' : 'Reactivar paciente'} destructive={isActive} variant={isActive ? 'primary' : 'secondary'} loading={action.loading} onPress={() => {
      action.clearError(); setReasonError('');
      if (isActive) { setReason(''); setDeactivateOpen(true); } else setReactivateOpen(true);
    }} />
    <AppModal visible={deactivateOpen} dismissible={!action.loading} onClose={() => setDeactivateOpen(false)}>
      <AppText variant="subtitle">Desactivar paciente</AppText>
      <AppText muted>El motivo será visible para el propietario. Los turnos futuros no se cancelan; si hay turnos pendientes, la operación será rechazada.</AppText>
      <AppInput label="Motivo de desactivación" required multiline maxLength={500} value={reason} onChangeText={value => { setReason(value); setReasonError(''); action.clearError(); }} />
      <FormNotice error message={reasonError || action.error} />
      {hasAppointmentConflict && <AppButton compact={desktop} variant="secondary" label="Abrir agenda para resolver los turnos" onPress={() => router.push(agendaPath as never)} />}
      <View style={[styles.actions, desktop && styles.desktopActions]}>
        <AppButton compact={desktop} label={action.loading ? 'Desactivando…' : 'Confirmar desactivación'} destructive loading={action.loading} onPress={() => void deactivate()} />
        <AppButton compact={desktop} label="Cancelar" variant="secondary" disabled={action.loading} onPress={() => setDeactivateOpen(false)} />
      </View>
    </AppModal>
    <ConfirmModal visible={reactivateOpen} title="Reactivar paciente" message="La mascota volverá a aparecer en los listados activos. Sus datos e historial clínico se conservan y la operación quedará registrada." confirmLabel="Reactivar paciente" onCancel={() => setReactivateOpen(false)} onConfirm={reactivate} />
  </>;
}

const styles = StyleSheet.create({ actions: { gap: 9 }, desktopActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 } });
