import { Children, type PropsWithChildren } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { PetCareCard } from './PetCareUI';
import { AppText } from '../ui/AppText';

/** Lista de horarios con desplazamiento propio y altura acotada para conservar visible su encabezado. */
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
