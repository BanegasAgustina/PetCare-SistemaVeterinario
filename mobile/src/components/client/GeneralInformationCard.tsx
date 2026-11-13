/**
 * ARCHIVO: GeneralInformationCard.tsx
 * UBICACIÓN: mobile/src/components/client/GeneralInformationCard.tsx
 * FUNCIÓN: Tarjeta pública con datos de contacto y horarios de atención de la clínica.
 * RESPONSABILIDAD: Mostrar información institucional a clientes desde el inicio.
 * CONEXIONES: Importa: mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/types/admin.ts Se utiliza desde: mobile/src/app/client/(tabs)/index.tsx
 * FUNCIONAMIENTO: Consulta la configuración mediante useClientQuery, filtra campos vacíos y formatea días, horarios y enlaces de redes.
 * IMPORTANCIA: Hace visibles canales de contacto y disponibilidad de la clínica.
 */
import { Image,Linking,Pressable,View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../ui/AppText';
import { PetCareCard } from './PetCareUI';
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useTheme } from '../../hooks/useTheme';
import type { GeneralInformation,Weekday } from '../../types/admin';

// Configuración days: reúne valores o reglas que consume el resto del módulo.
const days:Weekday[]=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
// Configuración dayNames: reúne valores o reglas que consume el resto del módulo.
const dayNames:Record<Weekday,string>={monday:'Lunes',tuesday:'Martes',wednesday:'Miércoles',thursday:'Jueves',friday:'Viernes',saturday:'Sábado',sunday:'Domingo'};
// Construye líneas de contacto y descarta valores vacíos.
function informationLines(info:GeneralInformation){const values=[info.address,[info.city,info.province].filter(Boolean).join(', ')].filter(Boolean) as string[];return values;}
/** Convierte el teléfono internacional a los dígitos requeridos por wa.me. */
function whatsappUrl(value:string):string|null{const digits=value.replace(/\D/g,'');return digits.length>=8&&digits.length<=15?`https://wa.me/${digits}`:null;}
/** Consulta y presenta contacto, horario y redes configuradas de la clínica. */
export function GeneralInformationCard(){
 const api=useClient();
 const query=useClientQuery(api.generalInformation);
 const {colors}=useTheme();
 const info=query.data;
 if(!info)return null;
 const lines=informationLines(info);
 const chatUrl=info.whatsapp?whatsappUrl(info.whatsapp):null;
 const hasSchedule=days.some(day=>info.openingHours[day]?.open);
 const schedules=hasSchedule
  ?days.map(day=>`${dayNames[day]}: ${info.openingHours[day]?.open?info.openingHours[day].periods.map(period=>`${period.opensAt}–${period.closesAt}`).join(' y '):'Cerrado'}`)
  :['Horarios a confirmar'];
 const links=[info.instagramUrl,info.facebookUrl,info.xUrl,info.websiteUrl].filter(Boolean) as string[];
 const contactRow={flexDirection:'row' as const,alignItems:'center' as const,gap:8,minHeight:32};
 return <PetCareCard>
  {info.logoUrl&&<Image source={{uri:info.logoUrl}} accessibilityLabel={`Logo de ${info.clinicName}`} resizeMode="contain" style={{width:180,height:80,alignSelf:'center'}}/>}
  <AppText variant="subtitle">{info.clinicName}</AppText>
  {info.welcomeMessage&&<AppText>{info.welcomeMessage}</AppText>}
  {info.description&&<AppText muted>{info.description}</AppText>}
  {lines.map((line,index)=><AppText key={`contact-${index}`} variant="caption">{line}</AppText>)}
  {info.phone&&<View style={contactRow}><Ionicons name="call-outline" size={17} color={colors.primary} accessible={false}/><AppText variant="caption">{info.phone}</AppText></View>}
  {info.publicEmail&&<View style={contactRow}><Ionicons name="mail-outline" size={17} color={colors.primary} accessible={false}/><AppText variant="caption">{info.publicEmail}</AppText></View>}
  {info.whatsapp&&chatUrl&&<Pressable accessibilityRole="link" accessibilityLabel={`Abrir WhatsApp de PetCare al ${info.whatsapp}`} onPress={()=>void Linking.openURL(chatUrl)} style={{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:9,minHeight:44}}><FontAwesome6 name="whatsapp" brand size={22} color="#25D366"/><AppText style={{color:colors.primary,fontWeight:'600'}}>{info.whatsapp}</AppText></Pressable>}
  {info.mapUrl&&<AppText variant="caption" muted>Ubicación: {info.mapUrl}</AppText>}
  <View style={{gap:3}}><AppText variant="caption">Horarios</AppText>{schedules.map(schedule=><AppText key={schedule} variant="caption" muted>{schedule}</AppText>)}</View>
  {Boolean(links.length)&&<View style={{gap:3}}><AppText variant="caption">Redes y sitio web</AppText>{links.map(link=><AppText key={link} variant="caption" muted>{link}</AppText>)}</View>}
 </PetCareCard>;
}
