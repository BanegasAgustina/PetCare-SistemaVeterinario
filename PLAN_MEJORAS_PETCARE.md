# Plan de mejoras PetCare

Fecha: 25-10-2026  
Base: auditorías estáticas iniciales en `AUDITORIA_UX_UI_PETCARE.md`, `AUDITORIA_CONEXIONES_PETCARE.md` y `AUDITORIA_HARDCODEO_PETCARE.md`.

## Diagnóstico general

La base de navegación, servicios y autorización está modularizada: 89 pantallas activas, seis roles y servicios frontend que en general corresponden con rutas backend. El código declara validación en ambas capas, ownership derivado de sesión, cálculo de checkout en servidor y estados de demo explícitos. Esto es evidencia de arquitectura, no prueba de funcionamiento extremo a extremo. Tras dos lotes hay 18 pruebas unitarias de checkout, autorización, transiciones de pedido y selección del primer error; todavía no prueban flujos end to end.

Los riesgos principales identificados son cobertura automatizada todavía pequeña, ausencia de SQL canónico de bootstrap/migraciones en este checkout y falta de QA visual/API/DB. Por ello no se certifican persistencia, permisos efectivos ni experiencia de todos los recorridos.

## Registro priorizado

| ID | Prioridad | Rol | Pantalla | Descripción / evidencia | Causa raíz | Solución | Riesgo | Prueba | Estado |
|---|---|---|---|---|---|---|---|---|---|
| PL-01 | P0 | Personal/Admin | Agenda, pacientes, pedido/pago | Cinco pruebas unitarias cubren helpers de permisos/delegación y protección de SUPER_ADMIN; no se verificaron endpoints, grants DB ni ownership (`backend/src/routes/clinic.routes.ts`, repositories). | Falta entorno sintético de integración y matriz por rol. | Probar permisos y ownership en API/DB con dos cuentas QA por rol. | Acceso o cambio operativo indebido si existiera desalineación. | T-05, T-09, T-12. | En curso |
| PL-02 | P1 | Cliente/Admin | Turno, carrito, checkout, pedido | Concurrencia, persistencia y refresco no se probaron. Checkout sí calcula en backend (`store-checkout.repository.ts`), pero no se confirmó contra DB. | DB y flujos remotos fuera de alcance. | QA aislado para reserva duplicada, stock/precio simultáneo, transferencia y estados. | Doble reserva, stock inconsistente o feedback falso. | T-03, T-06 a T-09. | Pendiente |
| PL-03 | P1 | Todos | Todas | Ahora hay 11 tests unitarios: 5 de reglas de autorización/delegación y 6 de validación checkout; ambos lints y typechecks pasan. | Cobertura aún no alcanza flujos, API ni persistencia. | Ampliar a servicios, API y DB efímera; conservar verificación de descubrimiento. | Cambios futuros sin detectar regresiones. | Matriz T-01 a T-16. | En curso |
| PL-04 | P1 | Operación | Instalación/DB | Faltan `backend/bootstrap/` y `backend/migrations/`. `.env` está configurado contra host no local, sin evidencia de que sea QA; DB no verificada. | SQL canónico y clasificación segura del entorno ausentes. | Recuperar SQL canónico y confirmar entorno QA antes de `db:audit:readonly`; no conectar a destino incierto. | Imposibilidad de reproducir instalación y compatibilidad. | T-02 a T-09 con DB efímera. | Bloqueado por entorno/artefactos |
| PL-05 | P2 | Todos | Formularios | Foco de primer error existente en perfil; `PetEditor` ahora enfoca el primer input de texto inválido y presenta errores de radios debajo de las opciones. Falta extender/verificar formularios restantes. | Implementación por pantalla y runtime de UI no disponible para verificación visual. | Extender foco/scroll en los formularios prioritarios restantes; probar teclado/lector. | Barrera de teclado/lector y corrección más lenta. | T-13, T-14. | En curso |
| PL-06 | P2 | Todos | Documentación/API | README referencia `docs/` ausente en el checkout. | Docs no versionados/restaurados. | Restaurar o crear documentación de instalación/API y enlazar nuevos informes. | Onboarding y uso de contrato quedan ambiguos. | Revisar enlaces/contratos contra routers. | Pendiente |
| PL-07 | P2 | Todos | Web/mobile | Se implementó un encabezado visual compartido y se ajustó la distribución del inicio cliente; falta QA visual autenticado en breakpoints y Android. | Sin sesión de QA y evidencia renderizada por breakpoint. | Recorrido con screenshots 320/768/1024/1440 y Android; corregir solo hallazgos reproducibles. | Recortes, scroll/tab bar solapados o UX de escritorio pobre. | T-14/T-15. | En curso |
| PL-08 | P2 | Administrador | Pedidos | La UI duplicaba la regla de siguiente estado por estado/pago/medio de entrega. Ahora consume `allowedOrderStatuses` que calcula el backend con la función usada al guardar. El enum y etiquetas del filtro siguen como constantes de contrato/presentación. | Lógica de transición estaba duplicada. | Se centralizó transición en `backend/src/utils/store-order-transitions.ts` y se amplió el detalle existente del pedido. Falta verificar respuesta desplegada en QA. | Riesgo de desalineación visual/API mitigado en código; persistencia sin probar. | Tests `store-order-transitions.test.ts`; luego T-09 en QA. | Corregido en código; integración pendiente |
| PL-09 | P3 | Cliente | Checkout | `demo-card.ts` tenía un PAN de prueba en helper no importado y sin consumidores activos. | Código huérfano. | Eliminado helper sin modificar el flujo demo actual. | Ninguno sobre flujo activo; confirmar builds externos si existieran. | Búsqueda de referencias antes de eliminar; lint y typecheck pasan. | Corregido |
| PL-10 | P2 | Cliente | Mascotas y turnos | El listado podía mostrar el vacío mientras faltaba respuesta; las tarjetas de turnos no abrían su detalle desde el listado. | El vacío no distinguía consulta sin datos de consulta aún no resuelta; faltaba enlazar tarjeta a detalle. | Vacío condicionado a respuesta y acción contextual; tarjeta accesible abre detalle existente. | UX confusa durante carga/error o recorrido difícil al detalle. | T-02, T-03; typecheck/lint/unitarias pasan. | Corregido en código; QA de UI pendiente |
| PL-11 | P2 | Cliente/Admin | Tienda, checkout, pedidos | El detalle independiente carecía de selector incremental/prevalidación de cantidad; resumen de envío podía mostrar un total parcial como final; checkout no presentaba la cuenta configurada antes de transferir; filtros de pedidos usaban fecha tipeada. | Presentación incompleta de límites/cotización e instrucciones; selección de fecha manual. | Se usa stock remanente, se marca envío no cotizado como pendiente, se presentan instrucciones configuradas y fechas se eligen con calendario. | Compra/confusión posible sobre cantidad, total o destino de transferencia. | T-06/T-07 y typecheck/lint/unitarias; QA API pendiente. | Corregido en código; QA de integración pendiente |

## Orden de implementación

### Etapa 1 — Base verificable

- Recuperar definición canónica de DB y preparar staging desechable; no migrar ni modificar grants en base real.
- Corregir script de lint para reflejar estructura presente y crear tests unitarios iniciales para validadores, autorización y checkout.
- Guardar evidencia reproducible de typecheck, lint y número de tests detectados.

### Etapa 2 — Operaciones P0/P1

- Probar permisos/ownership y denegación de acceso por API.
- Probar creación de mascota/turno y configuración administrativa de disponibilidad.
- Probar catálogo, carrito, stock, cotización y checkout demo/transferencia; observar DB antes/después.
- Probar gestión/revisión de pedido sin simular pagos reales.

### Etapa 3 — Formularios y perfil

- Completar matriz de formularios; asegurar validación local/servidor, carga, bloqueo de doble submit y confirmación posterior a respuesta.
- Normalizar foco al primer error y edición de perfil con rol personalizado bajo `personal.profile.manage`.

### Etapa 4 — Navegación, web/mobile y accesibilidad

- Recorrer cada una de las 89 pantallas por rol; registrar accesos, retorno, encabezado, estado vacío/error/carga y acción principal.
- Verificar breakpoints y Android; atender problemas observados; validar teclado, lector de pantalla, foco y contraste.
- Confirmar visualmente que las áreas web marcadas mantienen scroll y que el resto conserva indicadores.

### Etapa 5 — Cierre

- Ejecutar regresión automatizada de toda la matriz y guardar resultados.
- Actualizar referencias de API/instalación e informes con links y evidencias verificables.
- Marcar límites pendientes de proveedor/DB y reportar por separado; no desplegar ni ejecutar cambios productivos sin autorización específica.

## Cambios seguros ya realizados en esta etapa

Se actualizaron los cinco informes; se mejoró el foco de errores en perfil, se eliminó el helper demo sin consumidores y la pantalla administrativa de pedidos consume transiciones calculadas por backend. Se agregaron tests de primer error y transiciones. No se alteraron permisos, configuración ni esquema. Las pruebas ejecutadas y su alcance se detallan en `AUDITORIA_CONEXIONES_PETCARE.md` y `MATRIZ_PRUEBAS_PETCARE.md`.


## Tercer lote — primera entrega visual

Implementado en código: sistema compartido `PetCareHero`, retiro de decoraciones repetidas a nivel de pantalla y aplicación a Cliente, Veterinario, Peluquero, Personal/Secretaría y Administrador/Admin Principal. El diseño usa tema claro/oscuro, contenido de autenticación, ornamento de huella discreto y distribución responsive. Se conservaron servicios, permisos, rutas y navegación; no se incorporaron datos ficticios. El inicio de cliente usa grilla en escritorio ancho y carrusel en móvil/tablet. Pendiente: comprobar por navegador/Android con sesión de QA y completar revisión visual de las otras tarjetas y módulos; por eso PL-07 sigue en curso.


## Cuarto lote — primer grupo de pantallas internas

En el listado de mascotas, el estado vacío requiere una respuesta válida y lleva al alta. El listado de turnos ahora abre el detalle existente desde sus tarjetas y presenta una acción contextual cuando no hay próximos turnos. En el editor de mascota se marcan requisitos, se colocan errores de selección bajo sus opciones y se enfoca el primer input de texto inválido. Se conserva el selector de año/mes compartido. Typecheck, lint y 4 tests mobile pasan; sin QA autenticado, los recorridos por web/Android quedan pendientes. El próximo grupo recomendado es tienda/carrito/checkout y revisión de modales responsive.


## Quinto lote — primera entrega de tienda, carrito y administración

Se mejoraron estados vacíos/filtros del catálogo, detalle por ruta, límites de cantidad ligados al stock remanente, prevención de doble adición, claridad del total cuando falta una cotización de envío y presentación de datos bancarios configurados en la opción de transferencia. Los filtros administrativos de pedidos reemplazan fechas tipeadas por un calendario con selección de año/mes y rango válido. Todo usa datos reales y contratos existentes. Typecheck/lint y 4 pruebas unitarias pasan; falta comprobar tienda/checkout con API y cuentas QA. Administración avanzada (tablas y operaciones de productos/servicios/profesionales) sigue siendo un grupo separado.

## Sexto lote — primer grupo: productos y categorías

Se actualizó el inventario con accesos contextuales por permiso, vacíos con limpieza de filtros, etiqueta correcta de precio de venta, validaciones locales por campo y mapeo de errores de validación API a los campos del producto. Se mejoró el formulario compartido del catálogo con validaciones de nombre/tipo/precio/stock/imagen/regla receta-accesorio y los errores específicos del servidor. La categoría se sigue leyendo del catálogo real y su mantenimiento conserva el permiso `categories.manage`. Typecheck, lint y pruebas mobile pasan en esta ejecución (4 pruebas existentes); no cubren renderizado, responsive ni una API/DB conectada. Próximo grupo recomendado según el orden solicitado: servicios.

La pantalla de promociones se incluyó en este mismo primer grupo: selección de producto desde el catálogo real cuando `products.view` está otorgado, entrada por ID con explicación cuando no está disponible ese permiso, selector compartido de fecha/hora y validaciones de rango e imagen/textos de banner.

## Séptimo lote — servicios (grupo verificado por checks disponibles)

Implementado: listado responsive con datos reales, detalle con precio/duración/tipo/estado/asignaciones, edición estructurada, validaciones por campo, carga/URL/quita de imagen con el flujo existente y acceso directo a horarios. La selección del cliente ahora muestra la imagen persistida y conserva precio, duración y descripción de los mismos servicios activos. El backend confirma la vigencia del filtro de slots frente a servicio/profesional/especialidad activos, asignaciones, bloqueos y reservas que se solapan; no se alteró esa lógica ni se modificaron reservas.

Pasaron typecheck/lint mobile, 4 unitarias mobile, typecheck/lint backend y 14 unitarias backend. No se verificó visualmente con sesión autenticada ni se hicieron llamadas a API/DB; no se ejecutaron migraciones. Con las verificaciones automatizadas disponibles, el próximo grupo recomendado es profesionales.

Se retiraron defaults de horario y duración (`09:00`, `17:00`, `30` minutos) para evitar una publicación basada en una agenda no configurada; la duración procede del servicio persistido y la agenda requiere selección explícita. Tras este ajuste volvieron a pasar mobile typecheck, lint y 4 unitarias.

## Octavo lote — profesionales, especialidades y asignaciones

Se mejoró el resumen de servicios y estado de cada profesional, se añadió el acceso contextual al catálogo de disponibilidad filtrado por asignaciones y se preselecciona el profesional cuando se abre un servicio. La asignación requiere confirmación y distingue servicios inactivos existentes; no se alteran turnos. Los formularios veterinarios conservan los campos y endpoints admitidos, con requisito de especialidad explicado y acceso a su administración según permiso. Typecheck, lint y 4 pruebas mobile pasan. La integración real y QA responsive autenticado siguen pendientes; no se accedió a una base remota.

**Próximo grupo recomendado:** QA integrado de disponibilidad desde el profesional y el servicio, incluyendo compatibilidad de especialidad, servicios inactivos y conflictos de agenda con una cuenta y una base de pruebas confirmadas.
