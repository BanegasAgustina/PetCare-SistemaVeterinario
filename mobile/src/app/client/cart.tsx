import { Redirect } from 'expo-router';
/** Compatibilidad de enlaces anteriores; ya no existe un checkout de compra. */
export default function FormerCart(){return <Redirect href="/client/orders"/>;}
