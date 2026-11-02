/**
 * ARCHIVO: store.tsx
 * UBICACIÓN: mobile/src/app/admin/store.tsx
 * FUNCIÓN: Entrada al hub de administración de la tienda.
 * RESPONSABILIDAD: Renderiza AdminSectionHub con accesos de catálogo, banners, pedidos y configuración.
 * CONEXIONES: Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AdminSectionHub → rutas de tienda y API administrativa.
 * IMPORTANCIA: Centraliza navegación comercial en el panel.
 */
import { AdminSectionHub } from '../../components/admin/AdminSectionHub';
/** Renderiza el hub de tienda en el panel administrativo. */
export default function AdminStoreSection() { return <AdminSectionHub section="store"/>; }
