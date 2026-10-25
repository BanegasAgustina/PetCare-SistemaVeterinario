import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareCard, PetCareEmptyState, PetCareHeader, PetCareScreen, QueryState } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../forms/AppInput';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { ServiceScheduleModal } from './CatalogScreen';

/** Punto único para publicar y revisar horarios de todos los servicios activos. */
export function AvailabilityScreen() {
  const { professionalId } = useLocalSearchParams<{ professionalId?: string }>();
  const api = useClinic();
  const { hasPermission } = useAuth();
  const catalog = useClientQuery(api.catalog);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ id: string; name: string; duration: number } | null>(null);
  const services = (catalog.data?.services ?? []).filter(service => Boolean(service.isActive)
    && (!professionalId || catalog.data?.assignments.some(link => link.professionalId === professionalId && link.serviceId === service.id)
      && (!service.specialtyId || catalog.data?.professionals.some(person => person.id === professionalId && Boolean(person.isActive) && String(person.specialtyIds ?? '').split(',').includes(String(service.specialtyId)))))
    && String(service.name).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <PetCareScreen wide>
    <PetCareHeader title="Horarios de servicios" subtitle="Publicá los turnos disponibles de cada servicio" back hideForAdmin />
    <AppText muted>Elegí un servicio para indicar quién lo brinda, los días de atención y el período en que ofrecerá turnos.</AppText>
    <PetCareCard>
      <AppText variant="subtitle">Para comprobar los turnos publicados</AppText>
      <AppText muted>Abrí el servicio, elegí al profesional y consultá el calendario de días con turnos. Al tocar una fecha, podés revisar sus horarios y desactivar uno o todos los turnos de ese día. Los horarios libres se ofrecen a clientes en “Solicitar turno”; en Agenda aparecen cuando ya tienen una reserva.</AppText>
    </PetCareCard>
    <SearchFilterBar><AppInput icon="search-outline" label="Buscar servicio" placeholder="Nombre del servicio" value={search} onChangeText={setSearch} /></SearchFilterBar>
    <QueryState {...catalog} />
    {catalog.data && services.length > 0 && <View style={{ gap: 10 }}>
      {services.map(service => {
        const type = catalog.data?.types.find(item => item.id === service.typeId)?.name;
        const assignments = catalog.data?.assignments.filter(link => link.serviceId === service.id) ?? [];
        const professionals = (catalog.data?.professionals ?? []).filter(person => Boolean(person.isActive) && assignments.some(link => link.professionalId === person.id));
        return <PetCareCard key={service.id}>
          <AppText variant="subtitle">{String(service.name)}</AppText>
          <AppText muted>{String(type ?? 'Servicio')} · {String(service.durationMinutes)} minutos · {professionals.length} profesionales asignados</AppText>
          {Boolean(service.description) && <AppText>{String(service.description)}</AppText>}
          <AppButton label="Publicar horarios" onPress={() => setSelected({ id: service.id, name: String(service.name), duration: Number(service.durationMinutes) || 0 })} />
        </PetCareCard>;
      })}
    </View>}
    {catalog.data && services.length === 0 && <PetCareEmptyState title={professionalId ? 'No hay servicios activos compatibles' : search ? 'No hay servicios para esta búsqueda' : 'No hay servicios activos'} message={professionalId ? 'No tiene un servicio activo asignado compatible con sus especialidades. Revisá el servicio y la ficha profesional antes de publicar horarios.' : !search && hasPermission('services.manage') ? 'Creá o activá un servicio para poder publicar sus horarios.' : undefined} icon="calendar-outline" />}
    {selected && <ServiceScheduleModal key={selected.id} serviceId={selected.id} serviceName={selected.name} durationMinutes={selected.duration} initialProfessionalId={professionalId} onClose={() => setSelected(null)} />}
  </PetCareScreen>;
}
