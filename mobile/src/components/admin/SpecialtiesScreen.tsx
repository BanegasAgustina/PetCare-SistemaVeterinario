import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
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
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { AppModal } from '../ui/AppModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { PetCareCard, PetCareEmptyState } from '../client/PetCareUI';
import { AdminFormActions, AdminFormSection } from './AdminFormLayout';
import { AdminPageHeading } from './AdminPageHeading';
import type { ClinicRow } from '../../types/clinic';
import type { Specialty } from '../../types/veterinarian';

type EditItem = { kind: 'type'; row: ClinicRow | null } | { kind: 'specialty'; row: Specialty | null };

/** Presenta tipos profesionales y especialidades en un único espacio, sin mezclar sus relaciones. */
export default function SpecialtiesScreen() {
  const auth = useAuth();
  const admin = useAdmin();
  const clinic = useClinic();
  const action = useAsyncAction();
  const { showToast } = useFeedback();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EditItem | null>(null);
  const [statusTarget,setStatusTarget]=useState<Specialty|null>(null);
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canEditTypes = auth.hasPermission('professional_types.manage');
  const canEditSpecialties = auth.hasPermission('specialties.manage');
  const request = auth.request;
  const specialties = useClientQuery(useCallback(() => canEditSpecialties ? request<Specialty[]>('/admin/specialties') : Promise.resolve([]), [request, canEditSpecialties]));
  const types = useClientQuery(useCallback(() => canEditTypes ? clinic.adminList('types') : Promise.resolve([]), [clinic, canEditTypes]));
  const roles = useClientQuery(useCallback(() => canEditTypes ? admin.catalog() : Promise.resolve(null), [admin, canEditTypes]));
  const rows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return [
      ...(types.data ?? []).filter(row => String(row.name).toLocaleLowerCase().includes(needle)).map(row => ({ kind: 'type' as const, row })),
      ...(specialties.data ?? []).filter(row => row.name.toLocaleLowerCase().includes(needle)).map(row => ({ kind: 'specialty' as const, row })),
    ];
  }, [types.data, specialties.data, search]);
  const typeRows = rows.filter(item => item.kind === 'type');
  const specialtyRows = rows.filter(item => item.kind === 'specialty');

  function begin(kind: EditItem['kind'], row: EditItem['row'] = null) {
    setEditing(kind === 'type' ? { kind, row: row as ClinicRow | null } : { kind, row: row as Specialty | null });
    setName(row?.name == null ? '' : String(row.name));
    const professionalType = kind === 'type' ? row as ClinicRow | null : null;
    setRoleId(professionalType?.roleId == null ? '' : String(professionalType.roleId));
    setError(null);
  }
  function close() {
    if (action.loading) return;
    setEditing(null);
    setName('');
    setRoleId('');
    setError(null);
  }
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
      showToast('Cambios guardados', 'success');
    });
    if (saved) close();
  }
  function renderRow({ kind, row }: (typeof rows)[number]) {
    const permitted = kind === 'type' ? canEditTypes : canEditSpecialties;
    const role = kind === 'type' ? roles.data?.roles.find(item => item.id === String(row.roleId)) : null;
    return <PetCareCard key={`${kind}-${row.id}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="subtitle" numberOfLines={1}>{String(row.name)}</AppText>
          <AppText muted>{kind === 'type' ? `${role?.name ?? 'Tipo profesional'}${row.isClinical ? ' · Atención clínica' : ''}` : `Especialidad veterinaria · ${(row as Specialty).isActive===false?'Inactiva':'Activa'}`}</AppText>
        </View>
        {permitted&&kind==='specialty'&&<AppButton compact variant={(row as Specialty).isActive===false?'primary':'secondary'} destructive={(row as Specialty).isActive!==false} label={(row as Specialty).isActive===false?'Reactivar':'Desactivar'} onPress={()=>setStatusTarget(row as Specialty)}/>}
        {permitted && <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${String(row.name)}`} onPress={() => begin(kind, row)} style={{ padding: 10 }}><Ionicons name="create-outline" size={22} /></Pressable>}
      </View>
    </PetCareCard>;
  }

  return <ScreenContainer keyboardAvoiding wide>
    <AdminPageHeading title="Tipos y especialidades"/>
    <AppText muted>Administrá cada catálogo por separado; las asignaciones actuales se conservan.</AppText>
    <SearchFilterBar><AppInput icon="search-outline" label="Buscar" placeholder="Nombre" value={search} onChangeText={setSearch} returnKeyType="search" /></SearchFilterBar>
    {(canEditTypes || canEditSpecialties) && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {canEditTypes && <AppButton compact label="Crear tipo profesional" onPress={() => begin('type')} />}
      {canEditSpecialties && <AppButton compact label="Crear especialidad" variant="secondary" onPress={() => begin('specialty')} />}
    </View>}
    <FormNotice error message={types.error ?? specialties.error ?? roles.error} />
    {(types.loading || specialties.loading) && <AppText muted>Consultando catálogos…</AppText>}
    {!types.loading && !specialties.loading && !rows.length && <PetCareEmptyState title="No hay resultados" message="Probá con otro nombre o creá un registro." />}
    {typeRows.length > 0 && <AppText variant="subtitle">Tipos profesionales</AppText>}
    {typeRows.map(renderRow)}
    {specialtyRows.map(renderRow)}
    <AppModal visible={Boolean(editing)} dismissible onClose={close}>
      {editing && <>
        <AppText variant="title">{editing.row ? 'Editar' : 'Crear'} {editing.kind === 'type' ? 'tipo profesional' : 'especialidad'}</AppText>
        <AdminFormSection title={editing.kind === 'type' ? 'Tipo profesional' : 'Especialidad'}>
          <AppInput label="Nombre" required value={name} maxLength={100} editable={!action.loading} onChangeText={value => { setName(value); setError(null); }} />
          {editing.kind === 'type' && !editing.row && <>
            <AppText>Rol profesional</AppText>
            {(roles.data?.roles ?? []).filter(role => ['VETERINARIAN', 'GROOMER'].includes(role.code)).map(role => <SelectionRow radio key={role.id} label={role.name} checked={roleId === role.id} onPress={() => { setRoleId(role.id); setError(null); }} />)}
          </>}
        </AdminFormSection>
        <FormNotice error message={error ?? action.error} />
        <AdminFormActions><AppButton label="Guardar cambios" loading={action.loading} onPress={() => void save()} /><AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={close} /></AdminFormActions>
      </>}
    </AppModal>
    <ConfirmModal visible={Boolean(statusTarget)} title={statusTarget?.isActive===false?'Reactivar especialidad':'Desactivar especialidad'} message={statusTarget?.isActive===false?'La especialidad volverá a estar disponible para nuevas asignaciones y reservas.':'La especialidad dejará de ofrecerse para nuevas asignaciones. Se conservarán sus relaciones e historiales existentes.'} confirmLabel={statusTarget?.isActive===false?'Reactivar':'Desactivar'} destructive={statusTarget?.isActive!==false} onCancel={()=>setStatusTarget(null)} onConfirm={async()=>{
      const target=statusTarget;if(!target)return;
      await auth.request(`/admin/specialties/${encodeURIComponent(target.id)}`,{method:'PUT',body:{isActive:target.isActive===false}});
      setStatusTarget(null);specialties.reload();showToast(target.isActive===false?'Especialidad reactivada':'Especialidad desactivada','success');
    }}/>
  </ScreenContainer>;
}
