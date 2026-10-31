// Este archivo se encarga de lo siguiente: Componente reutilizable del área de clientes; presenta información y acciones para sus mascotas, turnos o compras.

/**
 * Tarjetas que reciben mascotas, turnos y productos obtenidos de la API. Presentan sus campos y disparan navegación; no mantienen otra copia persistida de esos registros.
 */
// Linking abre tiendas externas sin registrar una compra en PetCare.
import { Pressable, View,StyleSheet, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PetCareCard,PetCareBadge,PetImage,PetCarePetCardDecoration,PetCarePetIllustration,money,dateTime,statusLabel } from './PetCareUI';
import { orderStatusLabel, reservationStatusLabel } from '../../utils/display-labels';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { useTheme } from '../../hooks/useTheme';
import { clinicDate } from '../../utils/clinic-date';
import { normalizePetActiveFlag } from '../../utils/pet-status';
import type { Pet,Appointment,ClinicalRecord,Product,Order } from '../../types/client';
// Función PetCard: concentra la lógica dentro de este módulo.
export function PetCard({pet,portraitSize,showViewButton=true,showMicrochip=false,compact=false,desktopDashboard=false,footer}:{pet:Pet;portraitSize?:number;showViewButton?:boolean;showMicrochip?:boolean;compact?:boolean;desktopDashboard?:boolean;footer?:ReactNode}){
  const {colors}=useTheme();
  const {width}=useWindowDimensions();
  const photoSize=portraitSize??(compact?76:Math.min(190,Math.max(124,Math.round(Math.min(width,600)*0.36))));
  // Función openPet: agrupa una operación que este módulo puede ejecutar o reutilizar.
const openPet=()=>router.push({pathname:'/client/pets/[id]',params:{id:pet.id}});
  // Función editPet: agrupa una operación que este módulo puede ejecutar o reutilizar.
const editPet=()=>router.push({pathname:'/client/pets/[id]/edit',params:{id:pet.id}});
  const petIsActive=normalizePetActiveFlag(pet.isActive);
  return <PetCareCard style={[styles.petCard,desktopDashboard&&styles.dashboardPetCard]}><PetCarePetCardDecoration species={pet.species}/>
    <View style={[styles.petHeader,compact&&{alignItems:'center'},desktopDashboard&&styles.dashboardPetHeader]}>
      <View style={[styles.petPhotoFrame,{width:photoSize+6,height:photoSize+6,borderColor:colors.border},desktopDashboard&&styles.dashboardPetPhotoFrame]}>
        <PetImage uri={pet.photoUrl} size={photoSize} species={pet.species}/>
        <View style={[styles.photoMark,compact&&styles.compactPhotoMark,{backgroundColor:colors.primary}]}><Ionicons name="paw" size={compact?11:14} color={colors.onPrimary}/></View>
      </View>
      <View style={[styles.petInfo,compact&&{gap:6},desktopDashboard&&styles.dashboardPetInfo]}>
        <View style={styles.petTitleRow}>
          <AppText numberOfLines={desktopDashboard?undefined:2} variant="subtitle" style={[styles.petName,compact&&{fontSize:20,lineHeight:24},desktopDashboard&&styles.dashboardPetName]}>{pet.name}</AppText>
          {petIsActive===true&&<Pressable accessibilityRole="button" accessibilityLabel={`Editar ${pet.name}`} onPress={editPet} style={[styles.editButton,{backgroundColor:colors.accent},desktopDashboard&&styles.dashboardEditButton]}><Ionicons name="pencil" size={18} color={colors.text}/></Pressable>}
        </View>
        <View style={styles.speciesRow}><PetCarePetIllustration species={pet.species} size={compact?20:24} color={colors.primary}/><AppText style={[styles.speciesText,desktopDashboard&&styles.dashboardSpeciesText]}>{pet.species}{pet.breed?`  ·  ${pet.breed}`:''}</AppText></View>
        <View style={desktopDashboard&&styles.dashboardPetMeta}><PetCareBadge label={petIsActive===true?'Activa':petIsActive===false?'Inactiva':'Estado no disponible'}/>
        {petIsActive===false&&<>{Boolean(pet.deactivationReason)?<AppText variant="caption" muted numberOfLines={3}>Motivo: {pet.deactivationReason}</AppText>:<AppText variant="caption" muted>Motivo no registrado en desactivaciones anteriores.</AppText>}</>}
        {!compact&&<View style={[styles.infoDivider,{backgroundColor:colors.border}]}/>}
        {!compact&&pet.birthDate!==null&&pet.birthDate!==''&&<View style={styles.detailRow}><Ionicons name="calendar-outline" size={21} color={colors.primary}/><AppText style={styles.detailText}>Nació el {clinicDate(pet.birthDate)}</AppText></View>}
        {pet.weightKg != null&&<View style={styles.detailRow}><Ionicons name="barbell-outline" size={21} color={colors.primary}/><AppText style={styles.detailText}>{pet.weightKg} kg</AppText></View>}
        {Boolean(showMicrochip&&pet.microchipNumber)&&<View style={styles.detailRow}><Ionicons name="barcode-outline" size={21} color={colors.primary}/><AppText style={styles.detailText}>Microchip: {pet.microchipNumber}</AppText></View>}
        </View>
      </View>
    </View>
    {showViewButton&&<Pressable accessibilityRole="button" onPress={openPet} style={({pressed})=>[styles.petPrimaryAction,desktopDashboard&&styles.dashboardPetPrimaryAction,{backgroundColor:colors.primary,opacity:pressed?0.82:1}]}>
      <Ionicons name="calendar-outline" size={22} color={colors.onPrimary}/><AppText style={[styles.petPrimaryLabel,{color:colors.onPrimary}]}>Ver ficha</AppText><Ionicons name="chevron-forward" size={23} color={colors.onPrimary} style={styles.actionEnd}/>
    </Pressable>}
    {footer}
  </PetCareCard>;
}
// Función ViewAllPetsButton: concentra la lógica dentro de este módulo.
export function ViewAllPetsButton({onPress}:{onPress:()=>void}){
  const {colors}=useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[styles.petSecondaryAction,{borderColor:colors.border,opacity:pressed?0.78:1}]}>
    <Ionicons name="paw-outline" size={22} color={colors.text}/><AppText style={[styles.petSecondaryLabel,{color:colors.text}]}>Ver todas mis mascotas</AppText><Ionicons name="chevron-forward" size={23} color={colors.text} style={styles.actionEnd}/>
  </Pressable>;
}
// Función AppointmentCard: concentra la lógica dentro de este módulo.
export function AppointmentCard({appointment:a,onPress,desktopDashboard=false}:{appointment:Appointment;onPress?:()=>void;desktopDashboard?:boolean}){const {colors}=useTheme();const formattedDate=dateTime(a.startsAt);const [date,time]=formattedDate.split(' ');const content=<PetCareCard style={desktopDashboard&&styles.dashboardAppointmentCard}>{desktopDashboard?<><View style={styles.dashboardAppointmentTop}><PetCareBadge label={statusLabel(a.status)}/><View style={[styles.dashboardDatePanel,{backgroundColor:colors.accent}]}><Ionicons name="calendar-outline" size={17} color={colors.primary}/><AppText style={[styles.dashboardDateText,{color:colors.text}]}>{date??formattedDate}</AppText><AppText style={[styles.dashboardTimeText,{color:colors.primary}]}>{time??''}</AppText></View></View><View style={styles.dashboardAppointmentPet}><PetImage uri={a.petPhotoUrl??null} size={64}/><View style={styles.flex}><AppText variant="subtitle" style={styles.dashboardAppointmentPetName}>{a.petName}</AppText><AppText muted>{a.veterinarian}</AppText></View></View><View style={[styles.dashboardServiceRow,{borderTopColor:colors.border}]}><Ionicons name="medical-outline" size={18} color={colors.primary}/><AppText style={styles.dashboardServiceText}>{a.service}</AppText></View></>:<><PetCareBadge label={statusLabel(a.status)}/><View style={styles.row}><PetImage uri={a.petPhotoUrl??null} size={52}/><View style={styles.flex}><AppText variant="subtitle">{a.petName}</AppText><AppText muted>{a.veterinarian}</AppText></View></View><AppText variant="subtitle">{a.service}</AppText><AppText>{formattedDate}</AppText></>}</PetCareCard>;return onPress?<Pressable accessibilityRole="button" accessibilityLabel={`Ver turno de ${a.petName}, ${a.service}`} onPress={onPress} style={({pressed})=>({opacity:pressed?0.88:1,transform:[{scale:pressed?0.99:1}]})}>{content}</Pressable>:content;}
// Función MedicalRecordCard: concentra la lógica dentro de este módulo.
export function MedicalRecordCard({record:r}:{record:ClinicalRecord}){return <PetCareCard><AppText variant="subtitle">{r.title}</AppText><AppText variant="caption" muted>{r.petName} · {dateTime(r.occurredAt)}</AppText><AppText>{r.content}</AppText>{Boolean(r.dose)&&<AppText>Dosis: {r.dose}</AppText>}{Boolean(r.frequency)&&<AppText>Frecuencia: {r.frequency}</AppText>}{Boolean(r.duration)&&<AppText>Duración: {r.duration}</AppText>}{r.weightKg != null&&<AppText>Peso: {r.weightKg} kg</AppText>}{Boolean(r.validUntil)&&<AppText>Vigencia: {dateTime(r.validUntil!)}</AppText>}{Boolean(r.nextDueAt)&&<AppText>Próxima fecha: {dateTime(r.nextDueAt!)}</AppText>}<AppText muted>{r.veterinarian}</AppText></PetCareCard>;}
// Dato VaccineCard: conserva un valor calculado o de configuración usado por este módulo.
export const VaccineCard=MedicalRecordCard;
// Dato PrescriptionCard: conserva un valor calculado o de configuración usado por este módulo.
export const PrescriptionCard=MedicalRecordCard;
// Función RecommendationCard: concentra la lógica dentro de este módulo.
export function RecommendationCard({record:r}:{record:ClinicalRecord}){return <PetCareCard><AppText variant="subtitle">{r.title}</AppText><AppText variant="caption" muted>{r.petName} · {dateTime(r.occurredAt)}</AppText>{Boolean(r.productName)&&<AppText>Producto recomendado: {r.productName}</AppText>}<AppText>{r.content}</AppText>{Boolean(r.nextDueAt)&&<AppText>Próxima fecha: {dateTime(r.nextDueAt!)}</AppText>}<AppText muted>{r.veterinarian}</AppText></PetCareCard>;}
// La tarjeta usa el catálogo interno consultado por API y presenta enlace externo cuando fue cargado por un administrador.
// Función ProductCard: concentra la lógica dentro de este módulo.
export function ProductCard({product:p}:{product:Product}){return <PetCareCard><View style={styles.row}><PetImage uri={p.imageUrl}/><View style={styles.flex}><AppText variant="subtitle">{p.name}</AppText>{p.productType==='MEDICINE'&&<PetCareBadge label="Medicamento"/>}{p.productType==='ACCESSORY'&&<PetCareBadge label="Accesorio"/>}{p.productType==='GENERAL'&&<PetCareBadge label="Producto sin clasificar"/>}{Boolean(p.description)&&<AppText>{p.description}</AppText>}{Boolean(p.category)&&<AppText muted>{p.category}</AppText>}<AppText>{money(p.priceCents)}</AppText>{p.priceCents<p.regularPriceCents&&<PetCareBadge label="Promoción vigente"/>}<AppText variant="caption" muted>{p.stock>0?`${p.stock} disponibles`:'Sin stock disponible'}</AppText></View></View><AppButton label="Ver producto" onPress={()=>router.push({pathname:'/client/store/[id]',params:{id:p.id}})}/></PetCareCard>;}
// Función OrderCard: concentra la lógica dentro de este módulo.
export function OrderCard({order:o}:{order:Order}){return <PetCareCard><PetCareBadge label={o.orderType==='RESERVATION'?reservationStatusLabel(o.status):orderStatusLabel(o.status)}/><AppText variant="subtitle">Pedido #{o.id}</AppText><AppText muted>{dateTime(o.createdAt)}</AppText><AppText>{money(o.totalCents)}</AppText><AppButton label="Ver pedido" variant="secondary" onPress={()=>router.push({pathname:'/client/orders/[id]',params:{id:o.id}})}/></PetCareCard>;}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({row:{flexDirection:'row',gap:14,alignItems:'center'},flex:{flex:1,minWidth:0},petCard:{overflow:'hidden'},dashboardPetCard:{padding:16,gap:14,borderRadius:20},petHeader:{flexDirection:'row',alignItems:'center',gap:16},dashboardPetHeader:{alignItems:'flex-start',gap:18},petPhotoFrame:{padding:3,borderWidth:2,borderRadius:23,position:'relative'},dashboardPetPhotoFrame:{borderRadius:26},photoMark:{position:'absolute',left:8,top:8,width:30,height:30,borderRadius:10,alignItems:'center',justifyContent:'center'},compactPhotoMark:{left:7,top:7,width:24,height:24,borderRadius:8},petInfo:{flex:1,minWidth:0,gap:13},dashboardPetInfo:{gap:8},petTitleRow:{flexDirection:'row',alignItems:'center',gap:8},petName:{flex:1,minWidth:0,fontSize:27,lineHeight:32,fontWeight:'700'},dashboardPetName:{fontSize:21,lineHeight:26},editButton:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center'},dashboardEditButton:{width:36,height:36,borderRadius:12},speciesRow:{flexDirection:'row',alignItems:'center',gap:10,minHeight:28},speciesText:{flex:1,minWidth:0,fontSize:16,fontWeight:'600'},dashboardSpeciesText:{fontSize:15,lineHeight:21},dashboardPetMeta:{gap:8},infoDivider:{height:1,opacity:.65},detailRow:{flexDirection:'row',alignItems:'center',gap:10,minHeight:28},detailText:{flex:1,minWidth:0,fontSize:15},petPrimaryAction:{minHeight:58,borderRadius:30,paddingHorizontal:22,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,position:'relative'},dashboardPetPrimaryAction:{minHeight:46,borderRadius:16},petPrimaryLabel:{fontSize:17,fontWeight:'700'},petSecondaryAction:{minHeight:58,borderRadius:30,borderWidth:1.5,paddingHorizontal:22,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,position:'relative'},petSecondaryLabel:{fontSize:16,fontWeight:'600'},actionEnd:{position:'absolute',right:18},dashboardAppointmentCard:{minHeight:230,padding:16,gap:14,borderRadius:20,justifyContent:'space-between'},dashboardAppointmentTop:{flexDirection:'row',flexWrap:'wrap',alignItems:'flex-start',justifyContent:'space-between',gap:8},dashboardDatePanel:{minWidth:116,paddingHorizontal:11,paddingVertical:9,borderRadius:14,alignItems:'center',gap:2},dashboardDateText:{fontSize:14,fontWeight:'700',lineHeight:18},dashboardTimeText:{fontSize:18,fontWeight:'800',lineHeight:22},dashboardAppointmentPet:{flexDirection:'row',alignItems:'center',gap:12},dashboardAppointmentPetName:{fontSize:18,lineHeight:23},dashboardServiceRow:{flexDirection:'row',alignItems:'flex-start',gap:9,borderTopWidth:1,paddingTop:12},dashboardServiceText:{flex:1,minWidth:0,fontSize:15,lineHeight:21}});
