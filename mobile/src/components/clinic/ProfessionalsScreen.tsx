// Este archivo se encarga de lo siguiente: Componente reutilizable del área clínica; permite al personal gestionar agenda, pacientes y atención.

/** Gestión de profesionales y asignaciones reales de la clínica. */
import { useCallback, useMemo, useState } from 'react';
import { Platform,Pressable,StyleSheet,View,useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useAdmin } from '../../hooks/useAdmin';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { PetCareScreen, PetCareHeader, PetCareCard, PetCareEmptyState, PetImage, QueryState, ResponsiveGrid } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { AppSelectField } from '../forms/AppSelectField';
import { SelectionRow } from '../ui/SelectionRow';
import { AdminListToolbar } from '../admin/AdminListToolbar';
import { AdminDataTable } from '../admin/AdminDataTable';
import { ConfirmModal } from '../ui/ConfirmModal';
import { CompactPagination } from '../ui/CompactPagination';
import { useFeedback } from '../../contexts/FeedbackContext';
import { AppModal } from '../ui/AppModal';
import { AdminFormActions, AdminFormField, AdminFormGrid, AdminFormSection } from '../admin/AdminFormLayout';
import { FormNotice } from '../ui/FormNotice';
import { isWebAtLeast,responsiveLayout } from '../../constants/responsive';

// Función ProfessionalsScreen: concentra la lógica dentro de este módulo.
export function ProfessionalsScreen() {
  const {width}=useWindowDimensions();
  const desktopWeb=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const { hasPermission, hasRole } = useAuth();
  const api = useClinic();
  const admin = useAdmin();
  const statusAction = useAsyncAction();
  const query = useClientQuery(api.professionals);
  const catalog = useClientQuery(api.catalog);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [active, setActive] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [newType, setNewType] = useState('');
  const [typeConfirm, setTypeConfirm] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const { showToast } = useFeedback();
  const load = useCallback((id: string) => { setSelected(id); setServices(catalog.data?.assignments.filter(item => item.professionalId === id).map(item => String(item.serviceId)) ?? []); }, [catalog.data]);
  const professionals = useMemo(() => [...(query.data ?? [])]
    .filter(person => String(person.name).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (!type || person.typeId === type) && (active === '' || Boolean(person.isActive) === (active === '1')))
    .sort((a, b) => sort === 'az' ? String(a.name).localeCompare(String(b.name), 'es') : sort === 'za' ? String(b.name).localeCompare(String(a.name), 'es') : sort === 'oldest' ? String(a.createdAt).localeCompare(String(b.createdAt)) : String(b.createdAt).localeCompare(String(a.createdAt))), [query.data, search, type, active, sort]);
  const activeCount = (type ? 1 : 0) + (active ? 1 : 0);
  const pageSize = 20;
  const visibleProfessionals = professionals.slice((page - 1) * pageSize, page * pageSize);
  const selectedProfessional = query.data?.find(person => person.id === selected);
  const selectedIsVeterinarian = Boolean(selectedProfessional && 'veterinarianId' in selectedProfessional && selectedProfessional.veterinarianId);

  // Función changeActiveStatus: actualiza o guarda información dentro de este módulo.
async function changeActiveStatus() {
    if (!selectedProfessional) return;
    const saved = await statusAction.run(async () => {
      const user = await admin.user(selectedProfessional.id);
      await admin.updateUser(selectedProfessional.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roleId: user.roleId,
        isActive: !selectedProfessional.isActive,
      });
    });
    setStatusConfirm(false);
    if (!saved) return;
    setSelected('');
    showToast(selectedProfessional.isActive ? 'Profesional desactivado' : 'Profesional reactivado', 'success');
    query.reload();
    catalog.reload();
  }

  return <PetCareScreen wide><PetCareHeader title="Profesionales" back hideForAdmin/>
    {(hasPermission('users.manage')||hasPermission('veterinarians.manage'))&&<View style={[styles.actions,desktopWeb&&styles.desktopActions]}>
      {hasPermission('users.manage') && <AppButton compact={desktopWeb} label="Crear usuario de clínica" onPress={() => router.push({pathname:'/admin/users',params:{create:'1'}})}/>}
      {hasPermission('veterinarians.manage') && <AppButton compact={desktopWeb} label="Veterinarios" variant="secondary" onPress={() => router.push('/admin/veterinarians')}/>}
    </View>}
    <AdminListToolbar search={<AppInput icon="search-outline" label="Buscar profesionales" placeholder="Nombre" value={search} onChangeText={value => { setSearch(value); setPage(1); }}/>}
      sort={<AppSelectField label="Ordenar profesionales" value={sort} options={[{id:'recent',name:'Más recientes'},{id:'oldest',name:'Más antiguos'},{id:'az',name:'Nombre A–Z'},{id:'za',name:'Nombre Z–A'}]} onChange={value=>{setSort(value);setPage(1);}}/>}
      filters={<>
        <AppText variant="subtitle">Tipo</AppText><SelectionRow label="Todos los tipos" checked={!type} onPress={() => setType('')}/>{catalog.data?.types.map(item => <SelectionRow key={item.id} label={String(item.name)} checked={type === item.id} onPress={() => setType(item.id)}/>)}
        <AppText variant="subtitle">Estado</AppText>{[['', 'Todos los estados'], ['1', 'Activos'], ['0', 'Inactivos']].map(([value, label]) => <SelectionRow key={value || 'all'} label={label} checked={active === value} onPress={() => setActive(value)}/>)}
      </>}
      filterCount={activeCount} onApply={() => { setPage(1); void query.reload(); }} onClear={() => { setType(''); setActive(''); setSort('recent'); setPage(1); }}/>
    
<QueryState {...catalog}/>
<QueryState {...query}/>
    {query.data && (professionals.length ? desktopWeb ? <AdminDataTable rows={visibleProfessionals} rowKey={person=>person.id} columns={[
      {key:'professional',label:'Profesional',flex:1.2,minWidth:160,render:person=><View style={{flexDirection:'row',alignItems:'center',gap:8}}><PetImage uri={typeof person.profilePhotoUrl==='string'?person.profilePhotoUrl:null} size={36}/><View style={{flex:1,minWidth:0}}><AppText variant="subtitle" numberOfLines={2}>{String(person.name)}</AppText><AppText variant="caption" muted numberOfLines={1}>{String(person.typeName)}</AppText></View></View>},
      {key:'specialty',label:'Especialidad',flex:1,minWidth:120,render:person=><AppText muted numberOfLines={2}>{String(person.specialties||'—')}</AppText>},
      {key:'services',label:'Servicios asignados',flex:1.2,minWidth:150,render:person=>{const names=(catalog.data?.assignments??[]).filter(item=>item.professionalId===person.id).map(link=>catalog.data?.services.find(service=>service.id===link.serviceId)).filter((service):service is NonNullable<typeof service>=>Boolean(service)).map(service=>String(service.name));return <AppText variant="caption" muted numberOfLines={2}>{names.length?names.join(' · '):'Sin servicios asignados'}</AppText>; }},
      {key:'status',label:'Estado',flex:.65,minWidth:72,render:person=><AppText variant="caption" muted>{person.isActive?'Activo':'Inactivo'}</AppText>},
      {key:'actions',label:'Acciones',flex:.55,minWidth:88,align:'right',render:person=><AppButton compact variant="secondary" label="Ver ficha" onPress={()=>load(person.id)}/>},
    ]}/> : <ResponsiveGrid minItemWidth={responsiveLayout.grid.minItemWidth} maxColumns={3}>{visibleProfessionals.map(person => {
      const assigned = (catalog.data?.assignments ?? []).filter(item => item.professionalId === person.id)
        .map(link => catalog.data?.services.find(service => service.id === link.serviceId))
        .filter((service): service is NonNullable<typeof service> => Boolean(service));
      const assignedNames = assigned.slice(0, 2).map(service => String(service.name));
      return <PetCareCard key={person.id}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><PetImage uri={typeof person.profilePhotoUrl==='string'?person.profilePhotoUrl:null} size={desktopWeb?56:48}/><View style={{flex:1,minWidth:0}}><AppText variant="subtitle" numberOfLines={desktopWeb?2:1}>{String(person.name)}</AppText><AppText muted numberOfLines={1}>{String(person.typeName)} · {person.isActive?'Activo':'Inactivo'}</AppText>{Boolean(person.specialties)&&<AppText muted numberOfLines={desktopWeb?2:1}>{String(person.specialties)}</AppText>}</View><Pressable accessibilityRole="button" accessibilityLabel={`Ver ${String(person.name)}`} onPress={()=>load(person.id)} style={{padding:10}}><Ionicons name="eye-outline" size={22}/></Pressable></View>
        {catalog.data && <View style={{paddingTop:8,gap:2}}><AppText variant="caption" muted numberOfLines={2}>{assigned.length ? `Servicios · ${assignedNames.join(' · ')}${assigned.length>2?` · +${assigned.length-2}`:''}` : 'Sin servicios asignados'}</AppText>{assigned.some(service=>!service.isActive)&&<AppText variant="caption" muted>Incluye servicios inactivos; no publican nuevos horarios.</AppText>}</View>}
      </PetCareCard>;
    })}</ResponsiveGrid> : <PetCareEmptyState title="No hay profesionales para estos filtros" message="Probá limpiar la búsqueda o los filtros para revisar el listado completo."/>)}
    <CompactPagination page={page} canPrevious={page > 1} canNext={page * pageSize < professionals.length} onPrevious={() => setPage(value => value - 1)} onNext={() => setPage(value => value + 1)} summary={`${professionals.length} profesionales`}/>
    <AppModal size="wide" visible={Boolean(selected)} dismissible onClose={() => { setSelected(''); setNewType(''); }}>
      {Boolean(selected) && catalog.data && selectedProfessional && <>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><AppText variant="title">Detalle del profesional</AppText>{(selectedIsVeterinarian?hasPermission('veterinarians.manage'):hasPermission('users.manage'))&&<Pressable accessibilityRole="button" accessibilityLabel="Editar profesional" onPress={()=>{const id=selected;setSelected('');router.push(selectedIsVeterinarian?{pathname:'/admin/veterinarians/[id]',params:{id}}:{pathname:'/admin/users/[id]',params:{id}});}} style={{padding:10}}><Ionicons name="create-outline" size={22}/></Pressable>}</View>
        <PetImage uri={typeof selectedProfessional.profilePhotoUrl === 'string' ? selectedProfessional.profilePhotoUrl : null} size={76}/>
        <AppText variant="subtitle">{String(selectedProfessional.name)}</AppText>
        <AppText>Tipo: {String(selectedProfessional.typeName)}</AppText>
        <AppText>Estado: {selectedProfessional.isActive ? 'Activo' : 'Inactivo'}</AppText>
        {Boolean(selectedProfessional.specialties) && <AppText>Especialidad: {String(selectedProfessional.specialties)}</AppText>}
        {selectedProfessional.emailVerified !== undefined && <AppText>Correo: {selectedProfessional.emailVerified ? 'Verificado' : 'Sin verificar'}</AppText>}
        {catalog.data && 
<AdminFormSection title={`Servicios asignados (${services.length})`} description="La asignación se conserva hasta que confirmes un cambio. Los servicios inactivos no permiten publicar nuevos horarios.">
          {services.map(id => catalog.data?.services.find(service => service.id === id)).filter((service): service is NonNullable<typeof service> => Boolean(service)).map(service => <AppText key={service.id} muted>{String(service.name)} · {String(catalog.data?.types.find(item => item.id === service.typeId)?.name ?? 'Tipo no disponible')} · {service.isActive ? 'Activo' : 'Inactivo'}</AppText>)}
          {!services.length && <AppText muted>No tiene servicios asignados.</AppText>}
          {hasPermission('schedule.manage') && <AppButton compact variant="secondary" label="Consultar disponibilidad" onPress={() => { setSelected(''); router.push({ pathname: '/admin/availability', params: { professionalId: selectedProfessional.id } }); }} />}
        </AdminFormSection>}
        {!selectedIsVeterinarian && hasPermission('users.manage') && hasRole('SUPER_ADMIN') && <AppButton label={selectedProfessional.isActive ? 'Desactivar profesional' : 'Reactivar profesional'} destructive={Boolean(selectedProfessional.isActive)} variant={selectedProfessional.isActive ? 'secondary' : 'primary'} onPress={() => setStatusConfirm(true)} />}
        <FormNotice error message={statusAction.error} />
        <AdminFormGrid columns={2}>
        <AdminFormField>
<AdminFormSection title="Tipo profesional" description="Cambiarlo puede quitar servicios incompatibles. Primero reprogramá los turnos vigentes.">
          {catalog.data.types.filter(item => Boolean(item.isClinical) === Boolean(query.data?.find(person => person.id === selected)?.isClinical)).map(item => <SelectionRow key={item.id} radio label={String(item.name)} checked={newType === item.id} onPress={() => setNewType(item.id)}/>)}
          
<AdminFormActions><AppButton label="Revisar cambio de tipo" variant="secondary" disabled={!newType} onPress={() => setTypeConfirm(true)}/></AdminFormActions>
        </AdminFormSection></AdminFormField>
        <AdminFormField>
<AdminFormSection title="Servicios asignados" description="Seleccioná qué servicios puede atender este profesional.">
          {catalog.data.services.filter(service => service.typeId === selectedProfessional.typeId && (Boolean(service.isActive) || services.includes(service.id))).map(service => <SelectionRow key={service.id} label={`${String(service.name)} · ${service.isActive ? 'Activo' : 'Inactivo, sin nuevos horarios'}`} checked={services.includes(service.id)} onPress={() => setServices(current => current.includes(service.id) ? current.filter(id => id !== service.id) : service.isActive ? [...current, service.id] : current)}/>)}
          {catalog.data.services.filter(service => service.typeId === selectedProfessional.typeId && Boolean(service.isActive)).length === 0 && <AppText muted>No hay servicios activos compatibles con este tipo profesional. Podés revisar el catálogo de servicios si tenés ese permiso.</AppText>}
          
<AdminFormActions><AppButton label="Revisar asignación" onPress={() => setConfirm(true)}/><AppButton label="Cerrar" variant="secondary" onPress={() => setSelected('')}/></AdminFormActions>
        </AdminFormSection></AdminFormField>
        </AdminFormGrid>
      </>}
    </AppModal>
    <ConfirmModal visible={confirm} title="Asignar servicios" message="Se verificará que los servicios sean compatibles con el tipo profesional y sus especialidades." confirmLabel="Guardar" onCancel={() => setConfirm(false)} onConfirm={async () => { await api.assignServices(selected, services); setConfirm(false); setSelected(''); showToast('Servicios asignados', 'success'); catalog.reload(); }}/>
    <ConfirmModal visible={typeConfirm} title="Cambiar tipo profesional" message="Se quitarán asignaciones incompatibles. Primero deben reprogramarse los turnos vigentes." confirmLabel="Cambiar" onCancel={() => setTypeConfirm(false)} onConfirm={async () => { await api.assignType(selected, newType); setTypeConfirm(false); setSelected(''); setNewType(''); query.reload(); catalog.reload(); showToast('Tipo profesional actualizado', 'success'); }}/>
    <ConfirmModal visible={statusConfirm} title={selectedProfessional?.isActive ? 'Desactivar profesional' : 'Reactivar profesional'} message={selectedProfessional?.isActive ? 'La cuenta dejará de acceder a PetCare. Se conservarán sus datos, turnos e historial.' : 'El profesional volverá a tener acceso a PetCare con sus datos e historial actuales.'} destructive={Boolean(selectedProfessional?.isActive)} confirmLabel={selectedProfessional?.isActive ? 'Desactivar' : 'Reactivar'} onCancel={() => setStatusConfirm(false)} onConfirm={async() => { await changeActiveStatus(); }} />
  </PetCareScreen>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({actions:{gap:16},desktopActions:{gap:10,flexDirection:'row',flexWrap:'wrap',alignItems:'center'}});
