/**
 * ARCHIVO: activate-account.tsx
 * UBICACIÓN: mobile/src/app/activate-account.tsx
 * FUNCIÓN: Ruta pública de activación de cuenta cliente por invitación.
 * RESPONSABILIDAD: Presenta ActivationForm configurado como cuenta; el formulario valida el token y envía nueva contraseña al backend.
 * CONEXIONES: Importa: mobile/src/components/forms/ActivationForm.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Enlace de invitación → Expo Router → ActivationForm(kind=account) → auth API.
 * IMPORTANCIA: Completa el alta invitada sin conceder sesión basada únicamente en abrir el enlace.
 */
/**
 * Entrada pública del enlace de invitación. Renderiza ActivationForm para validar el token y definir contraseña mediante /auth/invitations; el enlace no concede una sesión PetCare.
 */
import { ActivationForm } from '../components/forms/ActivationForm';
/** Renderiza el formulario común configurado para activar una cuenta cliente. */
export default function ActivateAccount(){return <ActivationForm kind='account'/>;}
