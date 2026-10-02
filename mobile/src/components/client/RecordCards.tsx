import { View,StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { PetCareCard,PetCareBadge,PetImage,money,dateTime,statusLabel } from './PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import type { Pet,Appointment,ClinicalRecord,Product,Order } from '../../types/client';
export function PetCard({pet}:{pet:Pet}){return <PetCareCard><View style={styles.row}><PetImage uri={pet.photoUrl}/><View style={styles.flex}><AppText variant="subtitle">{pet.name}</AppText><AppText muted>{pet.species}{pet.breed?` · ${pet.breed}`:''}</AppText>{pet.birthDate&&<AppText variant="caption" muted>Nació el {new Date(pet.birthDate+'T12:00:00').toLocaleDateString('es-AR')}</AppText>}{pet.weightKg&&<AppText variant="caption">{pet.weightKg} kg</AppText>}</View></View><AppButton label="Ver ficha" variant="secondary" onPress={()=>router.push({pathname:'/client/pets/[id]',params:{id:pet.id}})}/></PetCareCard>;}
export function AppointmentCard({appointment:a}:{appointment:Appointment}){return <PetCareCard><PetCareBadge label={statusLabel(a.status)}/><AppText variant="subtitle">{a.service}</AppText><AppText>{dateTime(a.startsAt)}</AppText><AppText muted>{a.petName} · {a.veterinarian}</AppText></PetCareCard>;}
export function MedicalRecordCard({record:r}:{record:ClinicalRecord}){return <PetCareCard><AppText variant="subtitle">{r.title}</AppText><AppText variant="caption" muted>{r.petName} · {dateTime(r.occurredAt)}</AppText><AppText>{r.content}</AppText>{r.nextDueAt&&<AppText>Próxima fecha: {dateTime(r.nextDueAt)}</AppText>}<AppText muted>{r.veterinarian}</AppText></PetCareCard>;}
export const VaccineCard=MedicalRecordCard;
export const PrescriptionCard=MedicalRecordCard;
export const RecommendationCard=MedicalRecordCard;
export function ProductCard({product:p}:{product:Product}){return <PetCareCard><View style={styles.row}><PetImage uri={p.imageUrl}/><View style={styles.flex}><AppText variant="subtitle">{p.name}</AppText>{p.category&&<AppText muted>{p.category}</AppText>}<AppText>{money(p.priceCents)}</AppText>{p.priceCents<p.regularPriceCents&&<PetCareBadge label="Promoción vigente"/>}<AppText variant="caption" muted>{p.stock>0?`${p.stock} disponibles`:'Sin stock'}</AppText></View></View><AppButton label="Ver producto" variant="secondary" onPress={()=>router.push({pathname:'/client/store/[id]',params:{id:p.id}})}/></PetCareCard>;}
export function OrderCard({order:o}:{order:Order}){return <PetCareCard><PetCareBadge label={statusLabel(o.status)}/><AppText variant="subtitle">Pedido #{o.id}</AppText><AppText muted>{dateTime(o.createdAt)}</AppText><AppText>{money(o.totalCents)}</AppText><AppButton label="Ver pedido" variant="secondary" onPress={()=>router.push({pathname:'/client/orders/[id]',params:{id:o.id}})}/></PetCareCard>;}
const styles=StyleSheet.create({row:{flexDirection:'row',gap:14,alignItems:'center'},flex:{flex:1,minWidth:0}});
