/**
 * Compatibilidad para enlaces antiguos del CLIENT: redirige a /client/orders.
 * La pantalla de destino consulta reservas reales; esta ruta no ejecuta un checkout ni pagos.
 */
import { Redirect } from 'expo-router';
/** Compatibilidad de enlaces anteriores; ya no existe un checkout de compra. */
export default function FormerCart(){return <Redirect href="/client/orders"/>;}
