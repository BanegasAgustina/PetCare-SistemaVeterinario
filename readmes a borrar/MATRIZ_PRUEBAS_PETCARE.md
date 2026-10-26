# Matriz de pruebas PetCare

Fecha: 25-10-2026  
Estado: matriz planificada; hay 18 pruebas unitarias (5 autorización, 5 transiciones de pedido y 8 validación/UX). No hay aún pruebas de integración ni un entorno DB de QA confirmado.

## Estado de pruebas ejecutadas

| Componente | Comando | Resultado observado |
|---|---|---|
| Mobile | `npm run typecheck` | OK |
| Mobile | `npm run lint` | OK |
| Mobile | `npm test` | 4 tests unitarios pasan: 2 validaciones de checkout y 2 del orden/foco de errores; no son pruebas de flujo completo. |
| Backend | `npm run typecheck` | OK |
| Backend | `npm run lint` | OK después de crear `backend/tests/`, carpeta que el script ya incluye. |
| Backend | `npm test` | 14 tests pasan: 4 validaciones de checkout/transferencia, 5 reglas de autorización/delegación y 5 transiciones de pedido; no cubren DB ni API. |
| DB / API / UI | No ejecutado | No se inició entorno de prueba ni se tocó DB/producción. README informa SQL canónico de bootstrap y migraciones ausente. |

## Matriz por rol y módulo

| ID | Rol | Módulo/flujo | Escenario mínimo | Resultado esperado | Prioridad | Estado |
|---|---|---|---|---|---|---|
| T-01 | Cliente | Registro y sesión | Registrar, verificar correo, login, renovar sesión y logout | Solo confirmar pasos aceptados por backend; errores y límites comunicados sin perder datos | P1 | Pendiente |
| T-02 | Cliente | Mascotas | Crear/editar, fecha con selección de año, foto, desactivar/reactivar; intentar otra cuenta | Validación específica; conservar datos; no permitir ownership ajeno; historia preservada | P1 | Pendiente |
| T-03 | Cliente | Turnos | Configurar servicio/slots; solicitar slot; repetir simultáneamente y cancelar donde esté permitido | Confirmación real; segundo request no duplica; disponibilidad cambia con el estado | P1 | Pendiente |
| T-04 | Admin/Super Admin | Servicio y disponibilidad | Crear/editar/desactivar servicio, asignar profesional y generar horario | Catálogo del cliente solo ofrece asignaciones activas y horarios vigentes | P1 | Pendiente |
| T-05 | Vet/Peluquero/Secretaría | Agenda | Ver turnos propios y ajenos según grants; abrir detalle y actualizar estado permitido | Respuesta respeta alcance y permisos en API aunque se llame sin UI | P0 | En curso: helpers puros cubiertos; endpoint/ownership pendientes |
| T-06 | Cliente | Tienda/carrito | Buscar/filtrar, detalle, cantidades 0/límite, stock agotado y cambio de precio concurrente | Precio/stock recalculados por backend; error recuperable conserva carrito | P1 | Pendiente |
| T-07 | Cliente | Checkout transferencia | Retiro y envío, dirección inválida, cotización, crear intento, renovar, enviar comprobante | Pedido confirmado solo ante respuesta de servidor; transferencia pendiente hasta revisión; stock consistente | P1 | Pendiente |
| T-08 | Cliente | Checkout demo | Ejecutar con `STORE_DEMO_MODE` habilitado y deshabilitado | Nunca afirmar cobro real; deshabilitado no crea pedido demo | P1 | Pendiente |
| T-09 | Admin/Super Admin | Gestión de pedido/pago | Cambiar estados permitidos; revisar comprobante con actor no autorizado y autorizado | API rechaza transición/grant inválido; no marcar PAID sin acción autorizada y comprobante | P0 | En curso: transiciones unitarias y UI consume lista backend; falta endpoint/DB real |
| T-10 | Cliente/Personal/Admin | Perfil | Editar datos/cambiar contraseña/foto según rol; error servidor | Perfil recargado tras guardar; datos conservados en error; no elevar privilegios | P1 | Pendiente |
| T-11 | Todos los roles | Navegación | Abrir ruta directa no autorizada, deep link, atrás con/sin historial, detalle | Guard correcto; fallback al inicio propio; sin loops ni rutas sin salida | P1 | Pendiente |
| T-12 | Admin | Usuarios/roles/permisos | Intentar elevar permisos propios, editar SUPER_ADMIN como ADMIN y rol retirado | Backend rechaza violaciones/delegación; UI presenta error entendible | P0 | En curso: reglas unitarias cubiertas; endpoint y grants reales pendientes |
| T-13 | Cliente/Personal/Admin | Formularios | Campo vacío, inválido, límite, error API de campo y desconexión | Campo marcado y explicado; valores preservados; foco al primero cuando corresponda; evitar doble submit | P2 | En curso: foco del perfil y validadores checkout unitariamente cubiertos; falta recorrido UI/API |
| T-14 | Todos los roles | Accesibilidad | Teclado web, lector de pantalla, foco modal, contraste y zoom | Orden de foco lógico, labels/estados anunciados y foco restaurado al cerrar modal | P2 | Pendiente |
| T-15 | Todos los roles | Responsive | Navegar web 320/768/1024/1440 px y Android; teclado abierto | Contenido legible, sin recorte; scroll funcional; tab bar no cubre acciones | P2 | Pendiente |
| T-16 | Operación | Errores/feedback | Simular 401, 403, 404, timeout, conflicto y esquema incompatible en QA | Mensaje claro, reintento disponible cuando proceda, detalles técnicos solo en logs seguros | P1 | Pendiente |

## Precondiciones y seguridad

1. Crear entorno aislado con esquema canónico confirmado y cuentas/datos sintéticos por rol; no usar producción.
2. Asegurar SMTP/provider de prueba o inyectar proveedor de test para no enviar mensajes a usuarios reales.
3. Para checkout, usar modo demo o mecanismo de pago sandbox; transferencias no deben probarse contra dinero real.
4. Capturar request, status, respuesta, estado persistido antes/después y rol/permisos de actor; redactar tokens y datos personales.
5. Automatizar primero validadores, servicios y autorización; después UI/API de flujos críticos.

## Pendiente de infraestructura

No se ejecutaron scripts `db:migrate`, `db:seed`, `db:bootstrap`, creación de SUPER_ADMIN ni pruebas DB. Los README advierten que faltan `backend/bootstrap/` y `backend/migrations/`; antes de integración hay que recuperar SQL canónico y usar base desechable. Los resultados reales actuales se limitan a typecheck/lint indicados arriba.

`backend/.env` está presente y contiene configuración de un host no local. No se mostró ni se registró ningún valor; sin confirmación del entorno, no se conectó para evitar ejecutar verificaciones contra una base que pudiera ser productiva.


## Reejecución — tercer lote visual (25-10-2026)

| Tipo | Resultado | Alcance / límite |
|---|---|---|
| Mobile typecheck | Pasa (`npm run typecheck`) | Incluye los componentes y pantallas tocados. |
| Mobile lint | Pasa (`npm run lint`) | Sin errores reportados por Expo ESLint. |
| Mobile unitarias | 4/4 pasan (`npm test`) | Suite existente; no se agregaron pruebas de datos ni de renderizado. |
| QA visual web/Android | No ejecutada | Falta una sesión autenticada de QA y backend confirmado; no se usaron datos simulados ni se capturaron pantallas. |


## Reejecución — cuarto lote (25-10-2026)

| Tipo | Resultado | Alcance / límite |
|---|---|---|
| Mobile typecheck | Pasa (`npm run typecheck`) | Incluye los cambios en mascotas, turnos y `PetEditor`. |
| Mobile lint | Pasa (`npm run lint`) | Sin errores reportados por Expo ESLint. |
| Mobile unitarias | 4/4 pasan (`npm test`) | Pruebas existentes; no validan navegación/renderizado ni API. |
| Navegación de turnos | Revisada estáticamente | Las tarjetas enlazan al detalle `/client/appointments/[id]`; falta probar la sesión en runtime. |
| QA responsive/web/Android | No ejecutada | Sin sesión autenticada de QA ni capturas reales. |


## Reejecución — quinto lote (25-10-2026)

| Tipo | Resultado | Alcance / límite |
|---|---|---|
| Mobile typecheck | Pasa (`npm run typecheck`) | Incluye tienda, detalle, carrito, checkout e informe de pedidos. |
| Mobile lint | Pasa (`npm run lint`) | Sin errores reportados por Expo ESLint. |
| Mobile unitarias | 4/4 pasan (`npm test`) | Suite existente; no prueba peticiones concurrentes ni renderizado. |
| Stock/cotización/configuración | Revisado estáticamente | La UI usa stock, subtotal cotizado y datos bancarios provenientes de API; no se hizo llamada real ni DB. |
| QA visual/integración | Pendiente | Sin sesión autenticada de QA ni capturas en web/Android. |

## Reejecución — sexto lote (productos y categorías, 25-10-2026)

| Tipo | Resultado | Alcance / límite |
|---|---|---|
| Mobile typecheck | Pasa (`npm run typecheck`) | Incluye `admin/products.tsx` y `CatalogScreen.tsx`. |
| Mobile lint | Pasa (`npm run lint`) | Sin errores reportados por Expo ESLint. |
| Mobile unitarias | 4/4 pasan (`npm test`) | Suite existente; no renderiza formularios ni simula API. |
| `git diff --check` | Pasa | Git informó avisos de conversión LF/CRLF en checkout Windows; sin errores de whitespace. |
| API/DB y QA visual responsive | Pendiente | Sin sesión autenticada ni base de QA confirmada; no se efectuaron llamadas reales. |

## Reejecución — séptimo lote (servicios, 25-10-2026)

| Verificación | Resultado | Límite |
|---|---|---|
| Mobile typecheck | Pasa (`npm run typecheck`) | Incluye formularios, grilla y selector cliente. |
| Mobile lint | Pasa (`npm run lint`) | Expo ESLint sin errores tras nombrar `CatalogGrid`. |
| Mobile unitarias | 4/4 pasan (`npm test`) | Suite existente; no cubre render de servicio ni API. |
| Backend typecheck | Pasa (`npm run typecheck`) | Incluye presentación de imágenes de servicio y catálogo. |
| Backend lint | Pasa (`npm run lint`) | ESLint sobre `src` y `tests`. |
| Backend unitarias | 14/14 pasan (`npm test`) | No son pruebas de integración de servicios/DB. |
| `git diff --check` | Pasa | Solo avisos de conversión de fin de línea LF/CRLF en checkout Windows. |
| QA visual/API/DB | Pendiente | Sin sesión autenticada ni entorno QA confirmado; no se llamó a base remota. |

## Reejecución — octavo lote (profesionales)

| Verificación | Resultado | Alcance / límite |
|---|---|---|
| Mobile typecheck | Pasa (`tsc --noEmit` local) | Binario del proyecto; sin instalación de paquetes. |
| Mobile lint | Pasa (`expo lint` local) | Sin errores reportados. |
| Mobile unitarias | 4/4 pasan (`tsx --test tests/*.test.ts`) | Suite existente; no cubre render visual ni API. |
| Backend | Sin cambios en este lote | No se repitieron checks backend. |
| QA visual autenticado/API/DB | Pendiente | No había sesión QA ni entorno seguro confirmado; sin llamadas remotas. |
| Lanzador global `npm` | No disponible | Windows denegó iniciar `C:\WINDOWS\system32\npm`; checks equivalentes se ejecutaron con binarios instalados en `mobile/node_modules/.bin`. |
