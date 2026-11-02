/**
 * ARCHIVO: availability.tsx
 * UBICACIÓN: mobile/src/app/admin/availability.tsx
 * FUNCIÓN: Pantalla o ruta de la aplicación.
 * RESPONSABILIDAD: Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de availability.
 * CONEXIONES: Importa: mobile/src/components/clinic/AvailabilityScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
//este archivo exporta el componente de disponibilidad para la sección 
// de administración del panel de administración.
import { AvailabilityScreen } from '../../components/clinic/AvailabilityScreen';

// Función AdminAvailabilityPage: concentra la lógica dentro de este módulo.
export default function AdminAvailabilityPage() { return <AvailabilityScreen />; }
