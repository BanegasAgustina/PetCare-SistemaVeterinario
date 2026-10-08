/**
 * Pantalla de notificaciones propias para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareBadge,PetCareEmptyState,QueryState,dateTime } from '../../components/client/PetCareUI';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { FormNotice } from '../../components/ui/FormNotice';
export default function NotificationsScreen(){const api=useClient();const query=useClientQuery(api.notifications);const action=useAsyncAction();return <PetCareScreen><PetCareHeader title="Notificaciones" back/><QueryState {...query}/><FormNotice error message={action.error}/>{query.data&&(query.data.length?query.data.map(n=><PetCareCard key={n.id}><PetCareBadge label={n.readAt?'Leída':'Nueva'}/><AppText variant="subtitle">{n.title}</AppText><AppText>{n.body}</AppText><AppText variant="caption" muted>{dateTime(n.createdAt)}</AppText>{!n.readAt&&<AppButton label="Marcar como leída" variant="secondary" loading={action.loading} onPress={()=>void action.run(async()=>{await api.readNotification(n.id);query.reload();})}/>}</PetCareCard>):<PetCareEmptyState title="Estás al día" message="No tenés notificaciones nuevas." icon="notifications-outline"/>)}</PetCareScreen>;}
