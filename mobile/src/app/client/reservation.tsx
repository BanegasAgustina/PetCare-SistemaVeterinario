/** Enlace heredado: conduce al historial de pedidos sin crear nuevas reservas. */
import { Redirect } from 'expo-router';
export default function FormerReservation() { return <Redirect href="/client/orders" />; }
