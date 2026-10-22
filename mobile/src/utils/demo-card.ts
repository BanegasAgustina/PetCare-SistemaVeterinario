export type DemoCardValues={holder:string;number:string;expiry:string;cvv:string};
export type DemoCardErrors=Partial<Record<keyof DemoCardValues,string>>;
export const DEMO_CARD_NUMBER='4242424242424242';

/** Validación local de una única tarjeta ficticia. Nunca usar estos valores para autorizar pagos. */
export function validateDemoCard(values:DemoCardValues,now=new Date()):DemoCardErrors{
  const errors:DemoCardErrors={};
  if(values.holder.trim().length<2||values.holder.trim().length>80)errors.holder='Ingresá un nombre de prueba de 2 a 80 caracteres.';
  if(values.number.replace(/\D/g,'')!==DEMO_CARD_NUMBER)errors.number='Usá el número de tarjeta de prueba 4242 4242 4242 4242.';
  const match=/^(0[1-9]|1[0-2])\/(\d{2})$/.exec(values.expiry);
  if(!match)errors.expiry='Ingresá el vencimiento como MM/AA.';
  else {const month=Number(match[1]),year=2000+Number(match[2]);if(year<now.getFullYear()||(year===now.getFullYear()&&month<now.getMonth()+1))errors.expiry='La fecha de vencimiento debe estar vigente.';}
  if(!/^\d{3,4}$/.test(values.cvv))errors.cvv='Ingresá un código de seguridad de prueba de 3 o 4 dígitos.';
  return errors;
}
