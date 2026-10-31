// Este archivo se encarga de lo siguiente: Componente reutilizable del área clínica; permite al personal gestionar agenda, pacientes y atención.

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinic } from '../../hooks/useClinic';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { router } from 'expo-router';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';
import { ConfirmModal } from '../ui/ConfirmModal';

/** Shared lifecycle actions for list details and the full patient chart. */
// Función PatientLifecycleControl: concentra la lógica dentro de este módulo.
export function PatientLifecycleControl({ patientId, isActive, canManage, onComplete }: { patientId: string; isActive: boolean | null; canManage: boolean; onComplete: () => void }) {
  const api = useClinic();
  const action = useAsyncAction();
  const { showToast } = useFeedback();
  const { user } = useAuth();
  const { colors } = useTheme();
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

  // Función deactivate: concentra la lógica dentro de este módulo.
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

  // Función reactivate: concentra la lógica dentro de este módulo.
async function reactivate() {
    const saved = await action.run(() => api.reactivatePatient(patientId));
    if (saved) {
      setReactivateOpen(false);
      showToast('Paciente reactivado y registrado en el historial.', 'success');
      onComplete();
    }
  }

  return <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isActive ? 'Desactivar paciente' : 'Reactivar paciente'}
      accessibilityState={{ disabled: action.loading, busy: action.loading }}
      disabled={action.loading}
      onPress={() => {
        action.clearError(); setReasonError('');
        if (isActive) { setReason(''); setDeactivateOpen(true); } else setReactivateOpen(true);
      }}
      style={[styles.lifecycleAction, desktop ? styles.desktopLifecycleAction : styles.mobileLifecycleAction, { borderColor: isActive ? colors.danger : colors.primary, backgroundColor: colors.surface, opacity: action.loading ? 0.55 : 1 }]}
    >
      <Ionicons name={isActive ? 'pause-circle-outline' : 'checkmark-circle-outline'} size={17} color={isActive ? colors.danger : colors.primary} />
      <AppText variant="caption" style={{ color: isActive ? colors.danger : colors.primary, fontWeight: '700' }}>{isActive ? desktop ? 'Desactivar' : 'Desactivar paciente' : desktop ? 'Reactivar' : 'Reactivar paciente'}</AppText>
    </Pressable>
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

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ actions: { gap: 9 }, desktopActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 }, lifecycleAction: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1 }, desktopLifecycleAction: { minHeight: 36, alignSelf: 'flex-start', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 6 }, mobileLifecycleAction: { width: '100%', minHeight: 46, justifyContent: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 } });
