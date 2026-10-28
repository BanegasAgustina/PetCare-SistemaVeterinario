// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/** Ruta compatible con enlaces anteriores: entrega y pago ahora se resuelven en checkout. */
import { Redirect } from 'expo-router';
// Función DeliveryRedirect: concentra la lógica dentro de este módulo.
export default function DeliveryRedirect(){return <Redirect href="/client/store/checkout"/>;}
