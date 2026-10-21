/** Ruta compatible con enlaces anteriores: entrega y pago ahora se resuelven en checkout. */
import { Redirect } from 'expo-router';
export default function DeliveryRedirect(){return <Redirect href="/client/store/checkout"/>;}
