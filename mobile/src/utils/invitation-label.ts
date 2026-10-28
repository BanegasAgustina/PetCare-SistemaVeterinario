// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

// Función invitationLabel: concentra la lógica dentro de este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Función invitationLabel: concentra la lógica dentro de este módulo.
export function invitationLabel(status:string):string {
  const labels:Record<string,string>={sent:'Enviada',pending:'Pendiente',failed:'No enviada',expired:'Vencida',accepted:'Aceptada'};
  return labels[status]??status;
}
