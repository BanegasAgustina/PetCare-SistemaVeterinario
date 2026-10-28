// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

// Tipo CheckoutAddressValues: define la forma o las opciones válidas de los datos usados por este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Tipo CheckoutAddressValues: define la forma o las opciones válidas de datos usados por este módulo.
export type CheckoutAddressValues = {
  recipientName: string;
  phone: string;
  street: string;
  streetNumber: string;
  unit: string;
  city: string;
  province: string;
  postalCode: string;
  reference: string;
};

// Tipo CheckoutBuyerValues: define la forma o las opciones válidas de los datos usados por este módulo.
export type CheckoutBuyerValues = { name: string; email: string; dni: string };
// Tipo CheckoutFieldErrors: define la forma o las opciones válidas de los datos usados por este módulo.
export type CheckoutFieldErrors = Record<string, string>;

// Dato requiredAddressFields: conserva un valor calculado o de configuración usado por este módulo.
const requiredAddressFields = [
  ['recipientName', 'el nombre del destinatario', 160],
  ['phone', 'el teléfono', 40],
  ['street', 'la calle', 160],
  ['streetNumber', 'el número de calle', 30],
  ['city', 'la ciudad', 100],
  ['province', 'la provincia', 100],
  ['postalCode', 'el código postal', 16],
] as const;

// Función validateCheckoutAddress: comprueba una regla o condición dentro de este módulo.
export function validateCheckoutAddress(address: CheckoutAddressValues): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  for (const [field, label, maxLength] of requiredAddressFields) {
    const value = address[field].trim();
    if (!value) errors[field] = `Ingresá ${label}.`;
    else if (value.length > maxLength) errors[field] = `${label[0]!.toLocaleUpperCase('es')}${label.slice(1)} admite hasta ${maxLength} caracteres.`;
  }
  if (address.unit.trim().length > 80) errors.unit = 'El piso o departamento admite hasta 80 caracteres.';
  if (address.reference.trim().length > 500) errors.reference = 'Las referencias admiten hasta 500 caracteres.';
  return errors;
}

// Función validateCheckoutBuyer: comprueba una regla o condición dentro de este módulo.
export function validateCheckoutBuyer({ name, email, dni }: CheckoutBuyerValues): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  const normalizedName = name.trim();
  const normalizedEmail = email.trim();
  const normalizedDni = dni.replace(/[.\s-]/g, '');
  if (!normalizedName) errors.buyerName = 'Ingresá el nombre y apellido del comprador.';
  else if (normalizedName.length > 160) errors.buyerName = 'El nombre admite hasta 160 caracteres.';
  else if (normalizedName.split(/\s+/).length < 2) errors.buyerName = 'Ingresá nombre y apellido.';
  if (!normalizedEmail) errors.buyerEmail = 'Ingresá el correo electrónico.';
  else if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) errors.buyerEmail = 'Ingresá un correo electrónico válido.';
  if (!/^\d{7,9}$/.test(normalizedDni)) errors.buyerDni = 'El DNI debe contener entre 7 y 9 números.';
  return errors;
}

// Función mapCheckoutFieldErrors: transforma o prepara datos dentro de este módulo.
export function mapCheckoutFieldErrors(errors: readonly { field: string; message: string }[]): CheckoutFieldErrors {
  return Object.fromEntries(errors.map(({ field, message }) => [field.replace(/^address\./, ''), message]));
}
