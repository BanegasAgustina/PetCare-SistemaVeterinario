/**
 * Tarjetas que reciben mascotas, turnos y productos obtenidos de la API. Presentan sus campos y disparan navegación; no mantienen otra copia persistida de esos registros.
 */
// Linking abre tiendas externas sin registrar una compra en PetCare.
import { Pressable, View,StyleSheet, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PetCareCard,PetCareBadge,PetImage,PetCarePetCardDecoration,PetCarePetIllustration,money,dateTime,statusLabel } from './PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { useTheme } from '../../hooks/useTheme';
import { clinicDate } from '../../utils/clinic-date';
import type { Pet,Appointment,ClinicalRecord,Product,Order } from '../../types/client';
export function PetCard({pet,portraitSize,showViewButton=true,showMicrochip=false,compact=false,footer}:{pet:Pet;portraitSize?:number;showViewButton?:boolean;showMicrochip?:boolean;compact?:boolean;footer?:ReactNode}){
  const {colors}=useTheme();
  const {width}=useWindowDimensions();
  const photoSize=portraitSize??(compact?76:Math.min(190,Math.max(124,Math.round(Math.min(width,600)*0.36))));
  const openPet=()=>router.push({pathname:'/client/pets/[id]',params:{id:pet.id}});
  const editPet=()=>router.push({pathname:'/client/pets/[id]/edit',params:{id:pet.id}});
  return <PetCareCard style={styles.petCard}><PetCarePetCardDecoration species={pet.species}/>
    <View style={[styles.petHeader,compact&&{alignItems:'center'}]}>
      <View style={[styles.petPhotoFrame,{width:photoSize+6,height:photoSize+6,borderColor:colors.border}]}>
        <PetImage uri={pet.photoUrl} size={photoSize} species={pet.species}/>
        <View style={[styles.photoMark,compact&&styles.compactPhotoMark,{backgroundColor:colors.primary}]}><Ionicons name="paw" size={compact?11:14} color={colors.onPrimary}/></View>
      </View>
      <View style={[styles.petInfo,compact&&{gap:6}]}>
        <View style={styles.petTitleRow}>
          <AppText numberOfLines={2} variant="subtitle" style={[styles.petName,compact&&{fontSize:20,lineHeight:24}]}>{pet.name}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${pet.name}`} onPress={editPet} style={[styles.editButton,{backgroundColor:colors.accent}]}><Ionicons name="pencil" size={22} color={colors.text}/></Pressable>
        </View>
        <View style={styles.speciesRow}><PetCarePetIllustration species={pet.species} size={compact?20:24} color={colors.primary}/><AppText style={styles.speciesText}>{pet.species}{pet.breed?`  ·  ${pet.breed}`:''}</AppText></View>
        {pet.isActive===false&&<PetCareBadge label="Inactiva"/>}
        {!compact&&<View style={[styles.infoDivider,{backgroundColor:colors.border}]}/>}
        {!compact&&pet.birthDate!==null&&pet.birthDate!==''&&<View style={styles.detailRow}><Ionicons name="calendar-outline" size={21} color={colors.primary}/><AppText style={styles.detailText}>Nació el {clinicDate(pet.birthDate)}</AppText></View>}
        {pet.weightKg != null&&<View style={styles.detailRow}><Ionicons name="barbell-outline" size={21} color={colors.primary}/><AppText style={styles.detailText}>{pet.weightKg} kg</AppText></View>}
        {Boolean(showMicrochip&&pet.microchipNumber)&&<View style={styles.detailRow}><Ionicons name="barcode-outline" size={21} color={colors.primary}/><AppText style={styles.detailText}>Microchip: {pet.microchipNumber}</AppText></View>}
      </View>
    </View>
    {showViewButton&&<Pressable accessibilityRole="button" onPress={openPet} style={({pressed})=>[styles.petPrimaryAction,{backgroundColor:colors.primary,opacity:pressed?0.82:1}]}>
      <Ionicons name="calendar-outline" size={22} color={colors.onPrimary}/><AppText style={[styles.petPrimaryLabel,{color:colors.onPrimary}]}>Ver ficha</AppText><Ionicons name="chevron-forward" size={23} color={colors.onPrimary} style={styles.actionEnd}/>
    </Pressable>}
    {footer}
  </PetCareCard>;
}
export function ViewAllPetsButton({onPress}:{onPress:()=>void}){
  const {colors}=useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[styles.petSecondaryAction,{borderColor:colors.border,opacity:pressed?0.78:1}]}>
    <Ionicons name="paw-outline" size={22} color={colors.text}/><AppText style={[styles.petSecondaryLabel,{color:colors.text}]}>Ver todas mis mascotas</AppText><Ionicons name="chevron-forward" size={23} color={colors.text} style={styles.actionEnd}/>
  </Pressable>;
}
export function AppointmentCard({appointment:a,onPress}:{appointment:Appointment;onPress?:()=>void}){const content=<PetCareCard><PetCareBadge label={statusLabel(a.status)}/><View style={styles.row}><PetImage uri={a.petPhotoUrl??null} size={52}/><View style={styles.flex}><AppText variant="subtitle">{a.petName}</AppText><AppText muted>{a.veterinarian}</AppText></View></View><AppText variant="subtitle">{a.service}</AppText><AppText>{dateTime(a.startsAt)}</AppText></PetCareCard>;return onPress?<Pressable accessibilityRole="button" accessibilityLabel={`Ver turno de ${a.petName}, ${a.service}`} onPress={onPress} style={({pressed})=>({opacity:pressed?0.88:1,transform:[{scale:pressed?0.99:1}]})}>{content}</Pressable>:content;}
export function MedicalRecordCard({record:r}:{record:ClinicalRecord}){return <PetCareCard><AppText variant="subtitle">{r.title}</AppText><AppText variant="caption" muted>{r.petName} · {dateTime(r.occurredAt)}</AppText><AppText>{r.content}</AppText>{Boolean(r.dose)&&<AppText>Dosis: {r.dose}</AppText>}{Boolean(r.frequency)&&<AppText>Frecuencia: {r.frequency}</AppText>}{Boolean(r.duration)&&<AppText>Duración: {r.duration}</AppText>}{r.weightKg != null&&<AppText>Peso: {r.weightKg} kg</AppText>}{Boolean(r.validUntil)&&<AppText>Vigencia: {dateTime(r.validUntil!)}</AppText>}{Boolean(r.nextDueAt)&&<AppText>Próxima fecha: {dateTime(r.nextDueAt!)}</AppText>}<AppText muted>{r.veterinarian}</AppText></PetCareCard>;}
export const VaccineCard=MedicalRecordCard;
export const PrescriptionCard=MedicalRecordCard;
export function RecommendationCard({record:r}:{record:ClinicalRecord}){return <PetCareCard><AppText variant="subtitle">{r.title}</AppText><AppText variant="caption" muted>{r.petName} · {dateTime(r.occurredAt)}</AppText>{Boolean(r.productName)&&<AppText>Producto recomendado: {r.productName}</AppText>}<AppText>{r.content}</AppText>{Boolean(r.nextDueAt)&&<AppText>Próxima fecha: {dateTime(r.nextDueAt!)}</AppText>}<AppText muted>{r.veterinarian}</AppText></PetCareCard>;}
// La tarjeta usa el catálogo interno consultado por API y presenta enlace externo cuando fue cargado por un administrador.
export function ProductCard({product:p}:{product:Product}){return <PetCareCard><View style={styles.row}><PetImage uri={p.imageUrl}/><View style={styles.flex}><AppText variant="subtitle">{p.name}</AppText>{p.productType==='MEDICINE'&&<PetCareBadge label="Medicamento"/>}{p.productType==='ACCESSORY'&&<PetCareBadge label="Accesorio"/>}{p.productType==='GENERAL'&&<PetCareBadge label="Producto sin clasificar"/>}{Boolean(p.description)&&<AppText>{p.description}</AppText>}{Boolean(p.category)&&<AppText muted>{p.category}</AppText>}<AppText>{money(p.priceCents)}</AppText>{p.priceCents<p.regularPriceCents&&<PetCareBadge label="Promoción vigente"/>}<AppText variant="caption" muted>{p.stock>0?`${p.stock} disponibles`:'Sin stock disponible'}</AppText></View></View><AppButton label="Ver producto" onPress={()=>router.push({pathname:'/client/store/[id]',params:{id:p.id}})}/></PetCareCard>;}
export function OrderCard({order:o}:{order:Order}){return <PetCareCard><PetCareBadge label={statusLabel(o.status)}/><AppText variant="subtitle">Pedido #{o.id}</AppText><AppText muted>{dateTime(o.createdAt)}</AppText><AppText>{money(o.totalCents)}</AppText><AppButton label="Ver pedido" variant="secondary" onPress={()=>router.push({pathname:'/client/orders/[id]',params:{id:o.id}})}/></PetCareCard>;}
const styles=StyleSheet.create({row:{flexDirection:'row',gap:14,alignItems:'center'},flex:{flex:1,minWidth:0},petCard:{overflow:'hidden'},petHeader:{flexDirection:'row',alignItems:'center',gap:16},petPhotoFrame:{padding:3,borderWidth:2,borderRadius:23,position:'relative'},photoMark:{position:'absolute',left:8,top:8,width:30,height:30,borderRadius:10,alignItems:'center',justifyContent:'center'},compactPhotoMark:{left:7,top:7,width:24,height:24,borderRadius:8},petInfo:{flex:1,minWidth:0,gap:13},petTitleRow:{flexDirection:'row',alignItems:'center',gap:8},petName:{flex:1,minWidth:0,fontSize:27,lineHeight:32,fontWeight:'700'},editButton:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center'},speciesRow:{flexDirection:'row',alignItems:'center',gap:10,minHeight:28},speciesText:{flex:1,minWidth:0,fontSize:16,fontWeight:'600'},infoDivider:{height:1,opacity:.65},detailRow:{flexDirection:'row',alignItems:'center',gap:10,minHeight:28},detailText:{flex:1,minWidth:0,fontSize:15},petPrimaryAction:{minHeight:58,borderRadius:30,paddingHorizontal:22,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,position:'relative'},petPrimaryLabel:{fontSize:17,fontWeight:'700'},petSecondaryAction:{minHeight:58,borderRadius:30,borderWidth:1.5,paddingHorizontal:22,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,position:'relative'},petSecondaryLabel:{fontSize:16,fontWeight:'600'},actionEnd:{position:'absolute',right:18}});
