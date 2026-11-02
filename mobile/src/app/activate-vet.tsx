/**
 * ARCHIVO: activate-vet.tsx
 * UBICACIÓN: mobile/src/app/activate-vet.tsx
 * FUNCIÓN: Ruta pública de activación de cuenta veterinaria por invitación.
 * RESPONSABILIDAD: Reutiliza ActivationForm con tipo veterinarian para validar invitación y establecer credenciales.
 * CONEXIONES: Importa: mobile/src/components/forms/ActivationForm.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Enlace de invitación profesional → Expo Router → ActivationForm(kind=veterinarian) → auth API.
 * IMPORTANCIA: Comparte el flujo de activación y conserva el tipo de cuenta que el backend debe validar.
 */
/**
 * Entrada pública del enlace de invitación. Renderiza ActivationForm para validar el token y definir contraseña mediante /auth/invitations; el enlace no concede una sesión PetCare.
 */
import { ActivationForm } from '../components/forms/ActivationForm';
/** Renderiza el formulario común configurado para activar una cuenta veterinaria. */
export default function ActivateVet(){return <ActivationForm kind='veterinarian'/>;}
