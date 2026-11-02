/**
 * ARCHIVO: useClinic.ts
 * UBICACIÓN: mobile/src/hooks/useClinic.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useClinic.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/clinic.service.ts Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/professional/services.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx y 10 más
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Enlaza clinicService con AuthContext para enviar el Bearer vigente. Comparte clínica entre paneles; no concede permisos por el nombre de la pantalla.
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { clinicService } from '../services/clinic.service';
/** Crea una instancia memoizada de clinicService enlazada a la solicitud autenticada. */
export function useClinic(){const {request}=useAuth();return useMemo(()=>clinicService(request),[request]);}
