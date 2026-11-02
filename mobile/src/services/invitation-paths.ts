/**
 * ARCHIVO: invitation-paths.ts
 * UBICACIÓN: mobile/src/services/invitation-paths.ts
 * FUNCIÓN: Declara las rutas de aceptación para las dos clases de invitación soportadas.
 * RESPONSABILIDAD: Evitar que los formularios de activación dupliquen o escriban rutas de autenticación.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/forms/ActivationForm.tsx
 * FUNCIONAMIENTO: Exporta rutas constantes tipadas; el formulario selecciona la ruta de cuenta o de veterinario.
 * IMPORTANCIA: Centraliza destinos de aceptación usados al completar una invitación.
 */
/** Destinos del backend para activar cuentas comunes o cuentas veterinarias invitadas. */
export const invitationAcceptancePath = {
  account: '/auth/invitations/accept',
  veterinarian: '/auth/veterinarian-invitations/accept',
} as const;
