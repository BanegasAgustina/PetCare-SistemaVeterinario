/**
 * Pantalla de inicio del panel para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareIconButton,PetCareSection,PetCareEmptyState,PetCareAction,QueryState,PetCareBadge } from '../../../components/client/PetCareUI';
import { AppointmentCard,PetCard,ProductCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
export default function ClientHome(){const {user}=useAuth();const api=useClient();const query=useClientQuery(api.home);return <PetCareScreen>
  <PetCareHeader title={`¡Hola, ${user?.firstName??''}!`} subtitle="Qué bueno acompañarte por acá" right={<PetCareIconButton icon="notifications-outline" label="Notificaciones" onPress={()=>router.push('/client/notifications')}/>}/>
  <QueryState {...query}/>
  {query.data&&<>{query.data.unreadNotifications>0&&<PetCareBadge label={`${query.data.unreadNotifications} notificaciones sin leer`}/>}
    <PetCareSection title="Próximo turno">{query.data.nextAppointment?<AppointmentCard appointment={query.data.nextAppointment}/>:<PetCareEmptyState title="No tenés próximos turnos" message="Elegí un horario disponible para cuidar su salud." icon="calendar-outline" label="Solicitar turno" action={()=>router.push('/client/appointments/request')}/>}</PetCareSection>
    <PetCareSection title="Mis mascotas">{query.data.pets.length?<>{query.data.pets.slice(0,3).map(pet=><PetCard key={pet.id} pet={pet}/>)}<AppButton variant="secondary" label="Ver todas mis mascotas" onPress={()=>router.push('/client/pets')}/></>:<PetCareEmptyState title="No tenés mascotas todavía" message="Su cuidado empieza con una ficha propia." label="Agregar mascota" action={()=>router.push('/client/pets/new')}/>}</PetCareSection>
  </>}
  <PetCareSection title="Su salud, cerca tuyo"><PetCareAction title="Historial médico" icon="medical-outline" onPress={()=>router.push('/client/medical-history')}/><PetCareAction title="Vacunas" icon="shield-checkmark-outline" onPress={()=>router.push('/client/vaccines')}/><PetCareAction title="Recetas" icon="document-text-outline" onPress={()=>router.push('/client/prescriptions')}/><PetCareAction title="Recomendaciones" icon="heart-outline" onPress={()=>router.push('/client/recommendations')}/></PetCareSection>
  {query.data&&query.data.featuredProducts.length>0&&<PetCareSection title="Destacados para su cuidado">{query.data.featuredProducts.map(product=><ProductCard key={product.id} product={product}/>)}</PetCareSection>}
</PetCareScreen>;}
