// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

/**
 * Navegador del módulo admin, para ADMIN/SUPER_ADMIN con los permisos exigidos.
 * Organiza las rutas y sus guards con permisos de AuthContext; el backend comprueba
 * nuevamente autorización y ownership.
 */
import { Stack } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
// Función AdminLayout: concentra la lógica dentro de este módulo.
export default function AdminLayout() {
  const { hasPermission } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="clinic" />
      <Stack.Screen name="store" />
      <Stack.Screen name="administration" />
      <Stack.Protected
        guard={hasPermission("pets.view_information", "pets.view_all")}
      >
        <Stack.Screen name="patients" />
        <Stack.Screen name="patient" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("professionals.manage")}>
        <Stack.Screen name="professionals" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("appointments.view_all")}>
        <Stack.Screen name="agenda" />
        <Stack.Screen name="appointment" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("schedule.manage")}>
        <Stack.Screen name="availability" />
      </Stack.Protected>
      <Stack.Protected
        guard={[
          "services.manage",
          "products.update",
          "categories.manage",
          "promotions.manage",
        ].some((code) => hasPermission(code))}
      >
        <Stack.Screen name="catalog/[kind]" />
      </Stack.Protected>
      <Stack.Protected
        guard={hasPermission("store.settings.view", "store.settings.manage")}
      >
        <Stack.Screen name="store-settings" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("orders.view_all")}>
        <Stack.Screen name="store-orders" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("store.banners.manage")}>
        <Stack.Screen name="store-banners" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("veterinarians.manage")}>
        <Stack.Screen name="veterinarians" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("users.manage")}>
        <Stack.Screen name="users" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("users.view_basic")}>
        <Stack.Screen name="clients" />
        <Stack.Screen name="client" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("roles.manage")}>
        <Stack.Screen name="roles" />
      </Stack.Protected>
      <Stack.Protected guard={hasPermission("permissions.manage")}>
        <Stack.Screen name="permissions" />
      </Stack.Protected>
      <Stack.Protected
        guard={
          hasPermission("specialties.manage") ||
          hasPermission("professional_types.manage")
        }
      >
        <Stack.Screen name="specialties" />
      </Stack.Protected>
      <Stack.Protected
        guard={
          hasPermission("products.update") ||
          hasPermission("products.update_stock") ||
          hasPermission("products.update_price")
        }
      >
        <Stack.Screen name="products" />
      </Stack.Protected>
    </Stack>
  );
}
