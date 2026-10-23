import { Image,View } from 'react-native';
import { AppText } from '../ui/AppText';
import { PetCareCard } from './PetCareUI';
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import type { GeneralInformation,Weekday } from '../../types/admin';

const days:Weekday[]=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const dayNames:Record<Weekday,string>={monday:'Lunes',tuesday:'Martes',wednesday:'Miércoles',thursday:'Jueves',friday:'Viernes',saturday:'Sábado',sunday:'Domingo'};
function informationLines(info:GeneralInformation){const values=[info.address,[info.city,info.province].filter(Boolean).join(', '),info.phone&&`Tel. ${info.phone}`,info.whatsapp&&`WhatsApp ${info.whatsapp}`,info.publicEmail].filter(Boolean) as string[];return values;}
export function GeneralInformationCard(){const api=useClient();const query=useClientQuery(api.generalInformation);const info=query.data;if(!info)return null;const lines=informationLines(info);const hasSchedule=days.some(day=>info.openingHours[day]?.open);const schedules=hasSchedule?days.map(day=>`${dayNames[day]}: ${info.openingHours[day]?.open?info.openingHours[day].periods.map(period=>`${period.opensAt}–${period.closesAt}`).join(' y '):'Cerrado'}`):['Horarios a confirmar'];const links=[info.instagramUrl,info.facebookUrl,info.xUrl,info.websiteUrl].filter(Boolean) as string[];
 return <PetCareCard>{info.logoUrl&&<Image source={{uri:info.logoUrl}} accessibilityLabel={`Logo de ${info.clinicName}`} resizeMode="contain" style={{width:180,height:80,alignSelf:'center'}}/>}<AppText variant="subtitle">{info.clinicName}</AppText>{info.welcomeMessage&&<AppText>{info.welcomeMessage}</AppText>}{info.description&&<AppText muted>{info.description}</AppText>}{lines.map((line,index)=><AppText key={`contact-${index}`} variant="caption">{line}</AppText>)}{info.mapUrl&&<AppText variant="caption" muted>Ubicación: {info.mapUrl}</AppText>}<View style={{gap:3}}><AppText variant="caption">Horarios</AppText>{schedules.map(schedule=><AppText key={schedule} variant="caption" muted>{schedule}</AppText>)}</View>{Boolean(links.length)&&<View style={{gap:3}}><AppText variant="caption">Redes y sitio web</AppText>{links.map(link=><AppText key={link} variant="caption" muted>{link}</AppText>)}</View>}</PetCareCard>;
}
