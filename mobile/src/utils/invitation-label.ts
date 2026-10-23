export function invitationLabel(status:string):string {
  const labels:Record<string,string>={sent:'Enviada',pending:'Pendiente',failed:'No enviada',expired:'Vencida',accepted:'Aceptada'};
  return labels[status]??status;
}
