/**
 * ARCHIVO: services.tsx
 * UBICACIÓN: mobile/src/app/professional/services.tsx
 * FUNCIÓN: Pantalla o ruta de la aplicación.
 * RESPONSABILIDAD: Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de services.
 * CONEXIONES: Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import { useCallback } from 'react';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { PetCareCard,PetCareEmptyState,PetCareHeader,QueryState,ResponsiveGrid,money } from '../../components/client/PetCareUI';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';

// Función ProfessionalServices: concentra la lógica dentro de este módulo.
export default function ProfessionalServices(){
  const {user}=useAuth();const clinic=useClinic();
  const query=useClientQuery(useCallback(()=>clinic.catalog(),[clinic]));
  const services=query.data?.services.filter(service=>query.data?.assignments.some(assignment=>String(assignment.professionalId)===user?.id&&String(assignment.serviceId)===String(service.id)))??[];
  return <ScreenContainer wide>
    <PetCareHeader title="Mis servicios" subtitle="Servicios habilitados para tu perfil profesional." back/>
    
<QueryState {...query}/>
    {query.data&&(services.length?<ResponsiveGrid minItemWidth={280} maxColumns={4}>{services.map(service=><PetCareCard key={service.id}>
      <AppText variant="subtitle">{String(service.name)}</AppText>
      {Boolean(service.description)&&<AppText>{String(service.description)}</AppText>}
      <AppText variant="caption" muted>{Number(service.durationMinutes)} min · {service.priceCents===null||service.priceCents===undefined?'Precio a consultar':money(Number(service.priceCents))}</AppText>
      {Boolean(service.requirements)&&<AppText variant="caption" muted>Requisitos: {String(service.requirements)}</AppText>}
    </PetCareCard>)}</ResponsiveGrid>:<PetCareEmptyState title="No tenés servicios asignados" message="Los servicios habilitados aparecerán cuando se asignen a tu perfil."/>)}
  </ScreenContainer>;
}
