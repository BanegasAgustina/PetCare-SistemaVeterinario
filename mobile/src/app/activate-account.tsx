/**
 * Entrada pública del enlace de invitación. Renderiza ActivationForm para validar el token y definir contraseña mediante /auth/invitations; el enlace no concede una sesión PetCare.
 */
import { ActivationForm } from '../components/forms/ActivationForm';
export default function ActivateAccount(){return <ActivationForm kind='account'/>;}
