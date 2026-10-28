// Este archivo se encarga de lo siguiente: Componente reutilizable del área administrativa; organiza formularios, listas o controles de gestión.

import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../layout/ScreenContainer';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { FormNotice } from '../ui/FormNotice';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { SelectionRow } from '../ui/SelectionRow';
import { AppModal } from '../ui/AppModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { PetCareEmptyState, ResponsiveGrid } from '../client/PetCareUI';
import { responsiveLayout } from '../../constants/responsive';
import { useTheme } from '../../hooks/useTheme';
import type { ClinicRow } from '../../types/clinic';
import type { Specialty } from '../../types/veterinarian';

// Tipo Tab: define la forma o las opciones válidas de los datos usados por este módulo.
type Tab = 'types' | 'specialties';
// Tipo EditItem: define la forma o las opciones válidas de los datos usados por este módulo.
type EditItem = { kind: 'type'; row: ClinicRow | null } | { kind: 'specialty'; row: Specialty | null };
// Tipo ListedRow: define la forma o las opciones válidas de los datos usados por este módulo.
type ListedRow = { kind: 'type'; row: ClinicRow } | { kind: 'specialty'; row: Specialty };

/** Catálogos separados, con permisos y recorridos existentes. */
// Función SpecialtiesScreen: concentra la lógica dentro de este módulo.
export default function SpecialtiesScreen() {
  const auth = useAuth();
  const admin = useAdmin();
  const clinic = useClinic();
  const action = useAsyncAction();
  const { colors } = useTheme();
  const { showToast } = useFeedback();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EditItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<Specialty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Specialty | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'inactive'>('all');
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canEditTypes = auth.hasPermission('professional_types.manage');
  const canEditSpecialties = auth.hasPermission('specialties.manage');
  const [tab, setTab] = useState<Tab>(() => canEditTypes || !canEditSpecialties ? 'types' : 'specialties');
  const request = auth.request;
  const specialties = useClientQuery(useCallback(() => canEditSpecialties ? request<Specialty[]>('/admin/specialties/query',{method:'POST',body:{}}) : Promise.resolve([]), [request, canEditSpecialties]));
  const types = useClientQuery(useCallback(() => canEditTypes ? clinic.adminList('types') : Promise.resolve([]), [clinic, canEditTypes]));
  const roles = useClientQuery(useCallback(() => canEditTypes ? admin.catalog() : Promise.resolve(null), [admin, canEditTypes]));

  const rows = useMemo<ListedRow[]>(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (tab === 'types') return (types.data ?? [])
      .filter(row => String(row.name).toLocaleLowerCase().includes(needle))
      .map(row => ({ kind: 'type', row }));
    return (specialties.data ?? [])
      .filter(row => row.name.toLocaleLowerCase().includes(needle) && (statusFilter === 'all' || (row.isActive !== false) === (statusFilter === 'active')))
      .map(row => ({ kind: 'specialty', row }));
  }, [tab, types.data, specialties.data, search, statusFilter]);

  const loading = tab === 'types' ? types.loading : specialties.loading;
  const listError = tab === 'types' ? types.error ?? roles.error : specialties.error;
  const currentCount = tab === 'types' ? types.data?.length ?? 0 : specialties.data?.length ?? 0;

  // Función begin: concentra la lógica dentro de este módulo.
function begin(kind: EditItem['kind'], row: EditItem['row'] = null) {
    setEditing(kind === 'type' ? { kind, row: row as ClinicRow | null } : { kind, row: row as Specialty | null });
    setName(row?.name == null ? '' : String(row.name));
    const professionalType = kind === 'type' ? row as ClinicRow | null : null;
    setRoleId(professionalType?.roleId == null ? '' : String(professionalType.roleId));
    setError(null);
    action.clearError();
  }

  // Función close: concentra la lógica dentro de este módulo.
function close() {
    if (action.loading) return;
    setEditing(null);
    setName('');
    setRoleId('');
    setError(null);
    action.clearError();
  }

  // Función save: actualiza o guarda información dentro de este módulo.
async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) {
      setError('Ingresá un nombre de hasta 100 caracteres.');
      return;
    }
    if (editing?.kind === 'type' && !editing.row && !roleId) {
      setError('Seleccioná el tipo de profesional.');
      return;
    }
    setError(null);
    const saved = await action.run(async () => {
      if (editing?.kind === 'specialty') {
        const id = editing.row?.id;
        await auth.request(id ? `/admin/specialties/${id}` : '/admin/specialties', { method: id ? 'PUT' : 'POST', body: { name: trimmed } });
        specialties.reload();
      } else if (editing?.kind === 'type') {
        const id = editing.row?.id;
        const role = roles.data?.roles.find(item => item.id === roleId || (id && item.id === editing.row?.roleId));
        await clinic.adminSave('types', id ? String(id) : undefined, id ? { name: trimmed } : { name: trimmed, roleId, isClinical: role?.code === 'VETERINARIAN' });
        types.reload();
      }
      showToast(editing?.row ? 'Cambios guardados' : 'Registro creado', 'success');
    });
    if (saved) close();
  }

  // Función renderRow: concentra la lógica dentro de este módulo.
function renderRow({ kind, row }: ListedRow) {
    const permitted = kind === 'type' ? canEditTypes : canEditSpecialties;
    const role = kind === 'type' ? roles.data?.roles.find(item => item.id === String(row.roleId)) : null;
    const active = kind === 'specialty' ? (row as Specialty).isActive !== false : null;
    const descriptor = kind === 'type'
      ? `${role?.name ?? 'Tipo profesional'}${row.isClinical ? ' · Atención clínica' : ''}`
      : 'Especialidad veterinaria';
    return <View key={`${kind}-${row.id}`} style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.accent }]}>
        <Ionicons name={kind === 'type' ? 'people-outline' : 'ribbon-outline'} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <AppText variant="subtitle" numberOfLines={1}>{String(row.name)}</AppText>
        <AppText variant="caption" muted numberOfLines={1}>{descriptor}</AppText>
      </View>
      {active !== null && <View style={[styles.statusPill, { backgroundColor: active ? '#e6f3ed' : colors.accent }]}>
        <View style={[styles.statusDot, { backgroundColor: active ? '#23805d' : colors.muted }]} />
        <AppText variant="caption" style={{ color: active ? '#176347' : colors.muted }}>{active ? 'Activa' : 'Inactiva'}</AppText>
      </View>}
      {permitted && kind === 'specialty' && <Pressable accessibilityRole="button" accessibilityLabel={active ? `Desactivar ${String(row.name)}` : `Reactivar ${String(row.name)}`} hitSlop={6} onPress={() => setStatusTarget(row as Specialty)} style={[styles.iconButton, { backgroundColor: colors.accent }]}>
        <Ionicons name={active ? 'pause-outline' : 'play-outline'} size={19} color={colors.primary} />
      </Pressable>}
      {permitted && kind === 'specialty' && <Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${String(row.name)}`} hitSlop={6} onPress={() => setDeleteTarget(row as Specialty)} style={[styles.iconButton, { backgroundColor: colors.accent }]}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>}
      {permitted && <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${String(row.name)}`} hitSlop={6} onPress={() => begin(kind, row)} style={[styles.iconButton, { backgroundColor: colors.accent }]}>
        <Ionicons name="create-outline" size={19} color={colors.primary} />
      </Pressable>}
    </View>;
  }

  const editingExisting = Boolean(editing?.row);
  const saveLabel = editingExisting ? 'Guardar cambios' : editing?.kind === 'type' ? 'Crear tipo profesional' : 'Crear especialidad';

  return <ScreenContainer keyboardAvoiding wide>
    <View style={styles.content}>
      {(canEditTypes || canEditSpecialties) && <View style={[styles.tabs, { backgroundColor: colors.accent }]}>
        {canEditTypes && <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'types' }} onPress={() => { setTab('types'); setSearch(''); }} style={[styles.tab, tab === 'types' && { backgroundColor: colors.primary }]}>
          <Ionicons name="people-outline" size={17} color={tab === 'types' ? colors.onPrimary : colors.text} />
          <AppText variant="caption" style={{ color: tab === 'types' ? colors.onPrimary : colors.text }}>Tipos profesionales</AppText>
          <AppText variant="caption" style={{ color: tab === 'types' ? colors.onPrimary : colors.muted }}>{types.data?.length ?? 0}</AppText>
        </Pressable>}
        {canEditSpecialties && <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'specialties' }} onPress={() => { setTab('specialties'); setSearch(''); }} style={[styles.tab, tab === 'specialties' && { backgroundColor: colors.primary }]}>
          <Ionicons name="ribbon-outline" size={17} color={tab === 'specialties' ? colors.onPrimary : colors.text} />
          <AppText variant="caption" style={{ color: tab === 'specialties' ? colors.onPrimary : colors.text }}>Especialidades</AppText>
          <AppText variant="caption" style={{ color: tab === 'specialties' ? colors.onPrimary : colors.muted }}>{specialties.data?.length ?? 0}</AppText>
        </Pressable>}
      </View>}

      <AppInput compact label="Buscar por nombre" placeholder="Ej.: Cardiología" value={search} onChangeText={setSearch} returnKeyType="search" icon="search-outline" />
      {tab === 'specialties' && <View style={styles.filters}>{(['all','active','inactive'] as const).map(status=><AppButton key={status} compact variant={statusFilter === status ? 'primary' : 'secondary'} label={status === 'all' ? 'Todas' : status === 'active' ? 'Activas' : 'Inactivas'} onPress={() => setStatusFilter(status)} />)}</View>}

      {((tab === 'types' && canEditTypes) || (tab === 'specialties' && canEditSpecialties)) && <View style={styles.listHeading}>
        <AppButton compact label={tab === 'types' ? 'Nuevo tipo' : 'Nueva especialidad'} onPress={() => begin(tab === 'types' ? 'type' : 'specialty')} />
      </View>}

      <FormNotice error message={listError} />
      {loading && <AppText muted>Consultando {tab === 'types' ? 'tipos profesionales' : 'especialidades'}…</AppText>}
      {!loading && rows.length > 0 && <View style={styles.rows}><ResponsiveGrid minItemWidth={responsiveLayout.grid.minWideItemWidth} maxColumns={2}>{rows.map(renderRow)}</ResponsiveGrid></View>}
      {!loading && !rows.length && (currentCount > 0 || search.trim()
        ? <PetCareEmptyState title="No hay coincidencias" message="Probá con otro nombre o limpiá la búsqueda." />
        : <PetCareEmptyState title={tab === 'types' ? 'Todavía no hay tipos profesionales' : 'Todavía no hay especialidades'} message="Los registros que agregues aparecerán en esta lista." />)}
    </View>

    <AppModal visible={Boolean(editing)} dismissible onClose={close}>
      {editing && <>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleBlock}>
            <AppText variant="title">{editingExisting ? 'Editar' : 'Crear'} {editing.kind === 'type' ? 'tipo profesional' : 'especialidad'}</AppText>
            <AppText variant="caption" muted>{editing.kind === 'type' ? 'Completá los datos del perfil profesional.' : 'Definí el nombre que se asignará a los profesionales.'}</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario" disabled={action.loading} onPress={close} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </Pressable>
        </View>
        <View style={styles.formSection}>
          <AppInput label="Nombre" required value={name} maxLength={100} editable={!action.loading} onChangeText={value => { setName(value); setError(null); }} />
          {editing.kind === 'type' && !editing.row && <>
            <AppText variant="caption" muted>Rol profesional</AppText>
            {(roles.data?.roles ?? []).filter(role => ['VETERINARIAN', 'GROOMER'].includes(role.code)).map(role => <SelectionRow radio key={role.id} label={role.name} checked={roleId === role.id} onPress={() => { setRoleId(role.id); setError(null); }} />)}
          </>}
        </View>
        <FormNotice error message={error ?? action.error} />
        <View style={styles.formActions}>
          <AppButton compact label={saveLabel} loading={action.loading} onPress={() => void save()} />
          <AppButton compact label="Cancelar" variant="secondary" disabled={action.loading} onPress={close} />
        </View>
      </>}
    </AppModal>

    <ConfirmModal visible={Boolean(statusTarget)} title={statusTarget?.isActive === false ? 'Reactivar especialidad' : 'Desactivar especialidad'} message={statusTarget?.isActive === false ? 'La especialidad volverá a estar disponible para nuevas asignaciones y reservas.' : 'La especialidad dejará de ofrecerse para nuevas asignaciones. Se conservarán sus relaciones e historiales existentes.'} confirmLabel={statusTarget?.isActive === false ? 'Reactivar' : 'Desactivar'} destructive={statusTarget?.isActive !== false} onCancel={() => setStatusTarget(null)} onConfirm={async () => {
      const target = statusTarget;
      if (!target) return;
      await auth.request(`/admin/specialties/${encodeURIComponent(target.id)}`, { method: 'PUT', body: { isActive: target.isActive === false } });
      setStatusTarget(null);
      specialties.reload();
      showToast(target.isActive === false ? 'Especialidad reactivada' : 'Especialidad desactivada', 'success');
    }} />
    <ConfirmModal visible={Boolean(deleteTarget)} title="Eliminar especialidad" message="Solo se eliminará si no tiene servicios ni profesionales asociados. Si existen relaciones, el sistema conservará el registro y te indicará que lo desactives." confirmLabel="Eliminar" destructive onCancel={() => setDeleteTarget(null)} onConfirm={async()=>{
      const target=deleteTarget;if(!target)return;
      await auth.request(`/admin/specialties/${encodeURIComponent(target.id)}`,{method:'DELETE'});
      setDeleteTarget(null);specialties.reload();showToast('Especialidad eliminada','success');
    }} />
  </ScreenContainer>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  content: { width: '100%', alignSelf: 'center', gap: 14 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 42, borderRadius: 11, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  listHeading: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 2 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rows: { gap: 9 },
  rowCard: { minHeight: 76, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, minWidth: 0, gap: 3 },
  statusPill: { minHeight: 26, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  iconButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalTitleBlock: { flex: 1, minWidth: 0, gap: 4 },
  closeButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formSection: { gap: 12, paddingTop: 4 },
  formActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 4 },
});
