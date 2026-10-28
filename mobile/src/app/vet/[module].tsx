// Este archivo se encarga de lo siguiente: Pantalla o navegación del área profesional; reúne las tareas clínicas disponibles para el personal veterinario.

/**
 * Compatibilidad de enlaces del panel veterinario anterior: redirige a /vet.
 * Los módulos vigentes se presentan desde el inicio según /auth/me; esta ruta no consulta pacientes.
 */
import { Redirect } from 'expo-router';
// Función LegacyModule: concentra la lógica dentro de este módulo.
export default function LegacyModule(){return <Redirect href="/vet"/>;}
