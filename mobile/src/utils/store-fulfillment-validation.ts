// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

// Tipo StoreFulfillmentFieldErrors: define la forma o las opciones válidas de los datos usados por este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Tipo StoreFulfillmentFieldErrors: define la forma o las opciones válidas de datos usados por este módulo.
export type StoreFulfillmentFieldErrors=Record<string,string>;

// Función validatePostalCodePrefix: comprueba una regla o condición dentro de este módulo.
export function validatePostalCodePrefix(value:string|null|undefined):string|undefined {
  const prefix=value?.trim()??'';
  if(!prefix)return undefined;
  if(prefix.length>16)return 'El prefijo postal admite hasta 16 caracteres.';
  if(!/^[\p{L}\d -]+$/u.test(prefix))return 'El prefijo postal admite letras, números, espacios y guiones.';
  return undefined;
}

// Función parseArsToCents: transforma o prepara datos dentro de este módulo.
export function parseArsToCents(value:string, label:string, optional=false):{cents:number|null;error?:string} {
  const input=value.trim();
  if(!input)return optional?{cents:null}:{cents:0};
  if(input.startsWith('-'))return {cents:null,error:`${label} no puede ser negativo.`};
  if(!/^\d+(?:[.,]\d{1,2})?$/.test(input))return {cents:null,error:`Ingresá ${label.toLocaleLowerCase('es')} como un importe, con hasta dos decimales.`};
  const amount=Number(input.replace(',','.'));
  if(!Number.isFinite(amount)||amount>1_000_000)return {cents:null,error:`${label} no puede superar $1.000.000.`};
  return {cents:Math.round(amount*100)};
}

// Función validateStoreFulfillment: comprueba una regla o condición dentro de este módulo.
export function validateStoreFulfillment(values:{pickupEnabled:boolean;pickupAddress:string|null;deliveryEnabled:boolean;zones:{name:string;province:string;city:string;postalCodePrefix?:string|null}[];bankName:string|null;bankAccountHolder:string|null;bankCbuCvu:string|null;bankAlias:string|null},baseFee:string,freeThreshold:string,zoneFees:Record<string,string>):StoreFulfillmentFieldErrors {
  const errors:StoreFulfillmentFieldErrors={};
  if(values.pickupEnabled&&!values.pickupAddress?.trim())errors.pickupAddress='Ingresá la dirección del local para habilitar el retiro.';
  const base=parseArsToCents(baseFee,'El costo de envío');if(base.error)errors.deliveryBaseFeeCents=base.error;
  const free=parseArsToCents(freeThreshold,'El monto mínimo para envío gratis',true);if(free.error)errors.freeDeliveryThresholdCents=free.error;
  values.zones.forEach((zone,index)=>{
    if(!zone.name.trim())errors[`zones.${index}.name`]='Ingresá el nombre de la zona.';
    if(!zone.province.trim())errors[`zones.${index}.province`]='Ingresá la provincia.';
    if(!zone.city.trim())errors[`zones.${index}.city`]='Ingresá la ciudad.';
    const postalCodeError=validatePostalCodePrefix(zone.postalCodePrefix);if(postalCodeError)errors[`zones.${index}.postalCodePrefix`]=postalCodeError;
    const key=`zone-${index}`;const raw=zoneFees[key];if(raw!==undefined){const parsed=parseArsToCents(raw,'El costo de esta zona',true);if(parsed.error)errors[`zones.${index}.feeCents`]=parsed.error;}
  });
  const bank=[['bankName',values.bankName,'Ingresá el banco o billetera.'],['bankAccountHolder',values.bankAccountHolder,'Ingresá el titular.'],['bankCbuCvu',values.bankCbuCvu,'Ingresá el CBU o CVU.'],['bankAlias',values.bankAlias,'Ingresá el alias.']] as const;
  if(bank.some(([,value])=>Boolean(value))){for(const [field,value,message] of bank)if(!value)errors[field]=message;}
  return errors;
}
