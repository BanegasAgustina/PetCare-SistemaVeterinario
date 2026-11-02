/**
 * ARCHIVO: SlotSelectionCard.tsx
 * UBICACIÓN: mobile/src/components/client/SlotSelectionCard.tsx
 * FUNCIÓN: Selector de horario disponible para una solicitud o cambio de turno.
 * RESPONSABILIDAD: Presentar slots y profesional asociado antes de confirmar la selección.
 * CONEXIONES: Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/app/client/appointments/request.tsx, mobile/src/components/clinic/AppointmentScreen.tsx
 * FUNCIONAMIENTO: Recibe catálogo de slots y selección actual; comunica slotId al formulario que controla la solicitud.
 * IMPORTANCIA: Ayuda a elegir una disponibilidad retornada por la API sin crear el turno desde el componente.
 */
import { Children, type PropsWithChildren } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { PetCareCard } from './PetCareUI';
import { AppText } from '../ui/AppText';

/** Lista de horarios con desplazamiento propio y altura acotada para conservar visible su encabezado. */
/** Presenta slots y devuelve al formulario la selección activa. */
export function SlotSelectionCard({ title = 'Horarios disponibles', subtitle, emptyMessage, children }: PropsWithChildren<{ title?: string; subtitle?: string; emptyMessage?: string }>) {
  const hasItems = Children.count(children) > 0;
  return <PetCareCard>
    <AppText variant="subtitle">{title}</AppText>
    {Boolean(subtitle) && <AppText muted>{subtitle}</AppText>}
    {hasItems ? <ScrollView nativeID={Platform.OS==='web'?'petcare-web-scroll-slot-list':undefined} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator style={{ maxHeight: 280, flexGrow: 0 }} contentContainerStyle={{ gap: 4, paddingRight: 4 }}>
      <View>{children}</View>
    </ScrollView> : <AppText muted>{emptyMessage ?? 'No hay horarios para mostrar.'}</AppText>}
  </PetCareCard>;
}
