/**
 * Compatibilidad de enlaces del panel veterinario anterior: redirige a /vet.
 * Los módulos vigentes se presentan desde el inicio según /auth/me; esta ruta no consulta pacientes.
 */
import { Redirect } from 'expo-router';
export default function LegacyModule(){return <Redirect href="/vet"/>;}
