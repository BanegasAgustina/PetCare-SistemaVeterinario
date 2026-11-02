/**
 * ARCHIVO: delivery.tsx
 * UBICACIÓN: mobile/src/app/client/(tabs)/store/delivery.tsx
 * FUNCIÓN: Redirección de compatibilidad para enlaces antiguos de entrega.
 * RESPONSABILIDAD: Envía la ruta anterior a la pantalla unificada de checkout.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → Redirect → /client/store/checkout.
 * IMPORTANCIA: Mantiene enlaces históricos sin duplicar el formulario de envío.
 */
/** Ruta compatible con enlaces anteriores: entrega y pago ahora se resuelven en checkout. */
import { Redirect } from 'expo-router';
/** Redirige la URL histórica de entrega a la etapa de checkout vigente. */
export default function DeliveryRedirect(){return <Redirect href="/client/store/checkout"/>;}
