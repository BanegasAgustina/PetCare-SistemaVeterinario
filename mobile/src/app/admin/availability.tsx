/**
 * ARCHIVO: availability.tsx
 * UBICACIÓN: mobile/src/app/admin/availability.tsx
 * FUNCIÓN: Ruta de administración de agenda y disponibilidad clínica.
 * RESPONSABILIDAD: Renderiza AvailabilityScreen compartida; consulta y edita slots/bloqueos según permisos del actor.
 * CONEXIONES: Importa: mobile/src/components/clinic/AvailabilityScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AvailabilityScreen → clinic hooks/API → backend valida profesional, servicios y solapamientos.
 * IMPORTANCIA: Mantiene la ruta administrativa acotada a una pantalla compartida.
 */
//este archivo exporta el componente de disponibilidad para la sección 
// de administración del panel de administración.
import { AvailabilityScreen } from '../../components/clinic/AvailabilityScreen';

/** Monta la pantalla compartida de disponibilidad dentro del grupo administrativo. */
export default function AdminAvailabilityPage() { return <AvailabilityScreen />; }
