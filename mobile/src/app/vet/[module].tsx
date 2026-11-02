/**
 * ARCHIVO: [module].tsx
 * UBICACIÓN: mobile/src/app/vet/[module].tsx
 * FUNCIÓN: Pantalla o ruta de la aplicación.
 * RESPONSABILIDAD: Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [module].
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Compatibilidad de enlaces del panel veterinario anterior: redirige a /vet.
 * Los módulos vigentes se presentan desde el inicio según /auth/me; esta ruta no consulta pacientes.
 */
import { Redirect } from 'expo-router';
// Función LegacyModule: concentra la lógica dentro de este módulo.
export default function LegacyModule(){return <Redirect href="/vet"/>;}
