// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Pantalla de inicio del panel para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useRef,useState,type ComponentRef } from 'react';
import { Platform,ScrollView,StyleSheet,View,useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHero,PetCareSection,PetCareEmptyState,QueryState,PetCareBadge,PetCareIconButton,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { RoleQuickAccess } from '../../../components/layout/RoleQuickAccess';
import { AppointmentCard,PetCard,ProductCard,ViewAllPetsButton } from '../../../components/client/RecordCards';
import type { Appointment } from '../../../types/client';
import { GeneralInformationCard } from '../../../components/client/GeneralInformationCard';
import { isWebAtLeast, responsiveLayout } from '../../../constants/responsive';
// Función ClientHome: concentra la lógica dentro de este módulo.
export default function ClientHome(){
  const {user}=useAuth();const api=useClient();const query=useClientQuery(api.home);
  const {width}=useWindowDimensions();
  const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);
  const desktopWeb=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const petCardWidth=Math.max(280,Math.min(360,width-40));
  const petCarousel=useRef<ComponentRef<typeof ScrollView>>(null);
  const [petIndex,setPetIndex]=useState(0);
  const petCount=query.data?.pets.length??0;
  const activePetIndex=Math.min(petIndex,Math.max(0,petCount-1));
  // Función movePetCarousel: agrupa una operación que este módulo puede ejecutar o reutilizar.
const movePetCarousel=(direction:number)=>{
    const next=Math.max(0,Math.min(petCount-1,activePetIndex+direction));
    setPetIndex(next);
    petCarousel.current?.scrollTo({x:next*(petCardWidth+14),animated:true});
  };
  const petsSection=
<PetCareSection title="Mis mascotas">{query.data?.pets.length?desktopWeb?<>
    <ResponsiveGrid minItemWidth={240} maxColumns={3}>{query.data.pets.map(pet=><PetCard key={pet.id} pet={pet} compact portraitSize={82}/>)}</ResponsiveGrid>
    <ViewAllPetsButton onPress={()=>router.push('/client/pets')}/>
  </>:<>
    <ScrollView nativeID={Platform.OS==='web'?'petcare-web-scroll-home-pets':undefined} ref={petCarousel} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:14,paddingRight:16}} snapToInterval={petCardWidth+14} decelerationRate="fast" onMomentumScrollEnd={event=>setPetIndex(Math.round(event.nativeEvent.contentOffset.x/(petCardWidth+14)))}>{query.data.pets.map(pet=><View key={pet.id} style={{width:petCardWidth}}><PetCard pet={pet}/></View>)}</ScrollView>
    {desktop&&petCount>1&&<View style={{flexDirection:'row',justifyContent:'flex-end',gap:8}}>{activePetIndex>0&&<PetCareIconButton icon="chevron-back" label="Mascota anterior" onPress={()=>movePetCarousel(-1)}/>}{activePetIndex<petCount-1&&<PetCareIconButton icon="chevron-forward" label="Mascota siguiente" onPress={()=>movePetCarousel(1)}/>}</View>}
    <ViewAllPetsButton onPress={()=>router.push('/client/pets')}/>
  </>:<PetCareEmptyState title="No tenés mascotas todavía" message="Su cuidado empieza con una ficha propia." label="Agregar mascota" action={()=>router.push('/client/pets/new')}/>}</PetCareSection>;
  const appointmentsSection=
<PetCareSection title={query.data?.nextAppointments&&query.data.nextAppointments.length>1?'Próximos turnos':'Próximo turno'}>{(()=>{const upcoming=query.data?.nextAppointments??(query.data?.nextAppointment?[query.data.nextAppointment]:[]);return upcoming.length>1?<UpcomingAppointments appointments={upcoming}/>:upcoming[0]?<AppointmentCard appointment={upcoming[0]} onPress={()=>router.push({pathname:'/client/appointments/[id]',params:{id:upcoming[0].id}})}/>:<PetCareEmptyState title="No tenés próximos turnos" message="Elegí un horario disponible para cuidar su salud." icon="calendar-outline" label="Solicitar turno" action={()=>router.push('/client/appointments/request')}/>})()}</PetCareSection>;
  return <PetCareScreen decoration="pets">
    
<PetCareHero eyebrow="TU ESPACIO PERSONAL" title={user?.firstName?`¡Hola, ${user.firstName}!`:'Tu espacio PetCare'} subtitle="Qué bueno acompañarte por acá" icon="heart-outline"/>
    
<QueryState {...query}/>
    {query.data&&<>{query.data.unreadNotifications>0&&<PetCareBadge label={`${query.data.unreadNotifications} notificaciones sin leer`}/>}
      {desktopWeb?<View style={styles.desktopHomeSections}><View style={styles.desktopPetsColumn}>{petsSection}</View><View style={styles.desktopAppointmentsColumn}>{appointmentsSection}</View></View>:<ResponsiveGrid maxColumns={2}>{petsSection}{appointmentsSection}</ResponsiveGrid>}
    </>}
    <RoleQuickAccess/>
    
<PetCareSection title="Conocé PetCare"><GeneralInformationCard/></PetCareSection>
    {query.data&&query.data.featuredProducts.length>0&&
<PetCareSection title="Destacados para su cuidado"><ResponsiveGrid>{query.data.featuredProducts.map(product=><ProductCard key={product.id} product={product}/>)}</ResponsiveGrid></PetCareSection>}
  </PetCareScreen>;
}

// Función UpcomingAppointments: concentra la lógica dentro de este módulo.
function UpcomingAppointments({appointments}:{appointments:Appointment[]}){const carousel=useRef<ComponentRef<typeof ScrollView>>(null);const [index,setIndex]=useState(0);const {width}=useWindowDimensions();const cardWidth=Math.max(270,Math.min(340,width-40));return <View style={{gap:10}}><ScrollView nativeID={Platform.OS==='web'?'petcare-web-scroll-home-appointments':undefined} ref={carousel} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:16}} snapToInterval={cardWidth+12} decelerationRate="fast" onMomentumScrollEnd={event=>setIndex(Math.max(0,Math.min(appointments.length-1,Math.round(event.nativeEvent.contentOffset.x/(cardWidth+12)))))}>{appointments.map(item=><View key={item.id} style={{width:cardWidth}}><AppointmentCard appointment={item} onPress={()=>router.push({pathname:'/client/appointments/[id]',params:{id:item.id}})}/></View>)}</ScrollView><View accessibilityRole="text" accessibilityLabel={`Turno ${index+1} de ${appointments.length}`} style={{flexDirection:'row',justifyContent:'center',gap:6}}>{appointments.map((item,i)=><View key={item.id} style={{width:i===index?18:6,height:6,borderRadius:4,backgroundColor:i===index?'#28795D':'#C8D8D1'}}/>)}</View></View>;}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({desktopHomeSections:{width:'100%',flexDirection:'row',alignItems:'flex-start',gap:16},desktopPetsColumn:{flexGrow:2,flexBasis:0,minWidth:0},desktopAppointmentsColumn:{flexGrow:1,flexBasis:0,minWidth:280}});
