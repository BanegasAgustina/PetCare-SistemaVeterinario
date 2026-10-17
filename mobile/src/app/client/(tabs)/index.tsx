/**
 * Pantalla de inicio del panel para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useRef,useState,type ComponentRef } from 'react';
import { Platform,ScrollView,View,useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareSection,PetCareEmptyState,PetCareAction,QueryState,PetCareBadge,PetCareIconButton,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { AppointmentCard,PetCard,ProductCard,ViewAllPetsButton } from '../../../components/client/RecordCards';
export default function ClientHome(){const {user}=useAuth();const api=useClient();const query=useClientQuery(api.home);
const {width}=useWindowDimensions();
const desktop=Platform.OS==='web'&&width>=768;
const petCardWidth=Math.max(280,Math.min(360,width-40));
const petCarousel=useRef<ComponentRef<typeof ScrollView>>(null);
const [petIndex,setPetIndex]=useState(0);
const petCount=query.data?.pets.length??0;
const activePetIndex=Math.min(petIndex,Math.max(0,petCount-1));
const movePetCarousel=(direction:number)=>{
  const next=Math.max(0,Math.min(petCount-1,activePetIndex+direction));
  setPetIndex(next);
  petCarousel.current?.scrollTo({x:next*(petCardWidth+14),animated:true});
};return <PetCareScreen>
  <PetCareHeader title={`¡Hola, ${user?.firstName??''}!`} subtitle="Qué bueno acompañarte por acá"/>
  <QueryState {...query}/>
  {query.data&&<>{query.data.unreadNotifications>0&&<PetCareBadge label={`${query.data.unreadNotifications} notificaciones sin leer`}/>}
    <PetCareSection title="Mis mascotas">{query.data.pets.length?<><ScrollView ref={petCarousel} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:14,paddingRight:16}} snapToInterval={petCardWidth+14} decelerationRate="fast" onMomentumScrollEnd={event=>setPetIndex(Math.round(event.nativeEvent.contentOffset.x/(petCardWidth+14)))}>{query.data.pets.map(pet=><View key={pet.id} style={{width:petCardWidth}}><PetCard pet={pet}/></View>)}</ScrollView>{desktop&&petCount>1&&<View style={{flexDirection:'row',justifyContent:'flex-end',gap:8}}>{activePetIndex>0&&    <PetCareIconButton icon="chevron-back" label="Mascota anterior" onPress={()=>movePetCarousel(-1)}/>}{activePetIndex<petCount-1&&<PetCareIconButton icon="chevron-forward" label="Mascota siguiente" onPress={()=>movePetCarousel(1)}/>}</View>}<ViewAllPetsButton onPress={()=>router.push('/client/pets')}/></>:<PetCareEmptyState title="No tenés mascotas todavía" message="Su cuidado empieza con una ficha propia." label="Agregar mascota" action={()=>router.push('/client/pets/new')}/>}</PetCareSection>
    <PetCareSection title="Próximo turno">{query.data.nextAppointment?<AppointmentCard appointment={query.data.nextAppointment}/>:<PetCareEmptyState title="No tenés próximos turnos" message="Elegí un horario disponible para cuidar su salud." icon="calendar-outline" label="Solicitar turno" action={()=>router.push('/client/appointments/request')}/>}</PetCareSection>
  </>}
  <PetCareSection title="Su salud, cerca tuyo"><PetCareAction title="Historial médico" icon="medical-outline" onPress={()=>router.push('/client/medical-history')}/><PetCareAction title="Vacunas" icon="shield-checkmark-outline" onPress={()=>router.push('/client/vaccines')}/><PetCareAction title="Recetas" icon="document-text-outline" onPress={()=>router.push('/client/prescriptions')}/><PetCareAction title="Recomendaciones" icon="heart-outline" onPress={()=>router.push('/client/recommendations')}/></PetCareSection>
  {query.data&&query.data.featuredProducts.length>0&&<PetCareSection title="Destacados para su cuidado"><ResponsiveGrid>{query.data.featuredProducts.map(product=><ProductCard key={product.id} product={product}/>)}</ResponsiveGrid></PetCareSection>}
</PetCareScreen>;}
