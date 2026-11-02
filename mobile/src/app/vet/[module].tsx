/**
 * ARCHIVO: [module].tsx
 * UBICACIÓN: mobile/src/app/vet/[module].tsx
 * FUNCIÓN: Redirección de rutas veterinarias antiguas.
 * RESPONSABILIDAD: Conserva compatibilidad con enlaces heredados y los devuelve al inicio veterinario vigente.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router monta Redirect para navegar a /vet sin ejecutar lógica de datos.
 * IMPORTANCIA: Evita dejar enlaces guardados en rutas antiguas sin destino.
 */
/**
 * Compatibilidad de enlaces del panel veterinario anterior: redirige a /vet.
 * Los módulos vigentes se presentan desde el inicio según /auth/me; esta ruta no consulta pacientes.
 */
import { Redirect } from 'expo-router';
// Envía cualquier subruta veterinaria heredada al panel principal vigente.
export default function LegacyModule(){return <Redirect href="/vet"/>;}
