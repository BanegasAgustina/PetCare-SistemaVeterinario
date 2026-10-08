/**
 * Inicio compartido del personal autenticado. Consulta /clinic/home para agenda y contadores reales y presenta módulos según permisos de /me; no inventa cifras ante errores.
 */
import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareAction,QueryState } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { clinicDateTime } from '../../utils/clinic-date';
import { AppButton } from '../ui/AppButton';
export function StaffHome(){const {user,hasPermission}=useAuth();const api=useClinic();const query=useClientQuery(api.home);const base=user?.role==='VETERINARIAN'?'/vet':user?.role==='GROOMER'?'/professional':'/secretary';
 return <PetCareScreen><PetCareHeader title={`Hola, ${user?.firstName??''}`} subtitle={user?.professional?.name??user?.roleName}/><QueryState {...query}/>{query.data&&<PetCareCard>{query.data.todayCount!==null&&<AppText variant="subtitle">Turnos de hoy: {query.data.todayCount}</AppText>}{query.data.pendingCount!==null&&<AppText>Solicitudes pendientes: {query.data.pendingCount}</AppText>}{query.data.pendingReservations!==null&&<AppText>Reservas solicitadas: {query.data.pendingReservations}</AppText>}</PetCareCard>}{query.data?.nextAppointment&&<PetCareCard><AppText variant="subtitle">Próximo paciente</AppText><AppText>{String(query.data.nextAppointment.petName)} · {String(query.data.nextAppointment.service)}</AppText><AppText>{clinicDateTime(String(query.data.nextAppointment.startsAt))}</AppText></PetCareCard>}
 {(hasPermission('appointments.view_own')||hasPermission('appointments.view_all'))&&<PetCareAction title="Agenda y turnos" icon="calendar-outline" onPress={()=>router.push(`${base}/agenda` as never)}/>}
 {user?.role==='VETERINARIAN'&&hasPermission('pets.view_information')&&<PetCareAction title="Mis pacientes" icon="paw-outline" onPress={()=>router.push('/vet/patients' as never)}/>}
 {hasPermission('reservations.view_all')&&<PetCareAction title="Reservas para retiro" icon="bag-handle-outline" onPress={()=>router.push(`${base}/reservations` as never)}/>}
 {user?.role==='SECRETARY'&&hasPermission('users.view_basic')&&<PetCareAction title="Clientes" icon="people-outline" onPress={()=>router.push('/secretary/clients' as never)}/>}
 <AppButton label="Mi perfil" variant="secondary" onPress={()=>router.push('/account')}/></PetCareScreen>;
}
export function StaffLayoutHome(){return <StaffHome/>;}
// Los formularios y listas se comparten sin duplicar registros según el rol.
export function useSubmittedSearch(){const [search,setSearch]=useState('');const [submitted,setSubmitted]=useState('');return {search,setSearch,submitted,submit:useCallback(()=>setSubmitted(search.trim()),[search])};}
