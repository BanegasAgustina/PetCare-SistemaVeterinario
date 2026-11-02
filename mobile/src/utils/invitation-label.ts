/**
 * ARCHIVO: invitation-label.ts
 * UBICACIÓN: mobile/src/utils/invitation-label.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de invitation-label.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Traduce estados de invitación conocidos; si recibe otro código, lo conserva como etiqueta de respaldo. */
export function invitationLabel(status:string):string {
  const labels:Record<string,string>={sent:'Enviada',pending:'Pendiente',failed:'No enviada',expired:'Vencida',accepted:'Aceptada'};
  return labels[status]??status;
}
