# Guía de defensa oral PetCare

PetCare separa interfaz Expo, API Express, reglas de dominio y persistencia MySQL. La UI facilita navegación; el backend decide permisos y propiedad por operación.

**Service vs repository:** service coordina el caso de uso; repository ejecuta SQL y mapea resultados.

**Precio y stock:** checkout rerelee catálogo e inventario desde MySQL y guarda pedido/reserva en transacción.

**Sesión:** JWT firmado más consulta de estado/versión; refresh token se rota y puede revocarse.

**OAuth:** state/PKCE protege el retorno; la identidad externa se vincula por subject con política explícita, nunca por email coincidente solo.

**Migraciones:** tareas versionadas ejecutadas explícitamente fuera del request normal. Auditoría readonly observa, no modifica.

En esta continuación no se ejecutaron tests automatizados; no se deben afirmar aprobados.


**¿La disponibilidad queda garantizada desde que se muestra un slot?**

No. La app presenta slots consultados, pero al solicitar el turno el backend vuelve a comprobar disponibilidad y bloquea la operación para evitar confirmar un horario que ya cambió.

**¿Cómo se administra el catálogo y la agenda?**

La pantalla comparte un esquema de campos por catálogo y solo muestra acciones con permisos; el backend valida de nuevo. Para publicar turnos se generan fechas desde el rango y los días elegidos, se parte la jornada en bloques según duración del servicio y se registra cada disponibilidad. Los bloqueos guardan su motivo y horario.

**¿Cómo se protege la historia de un paciente?**

El módulo distingue datos de la mascota y propietario, información visible para el cliente y notas internas. Los permisos limitan diagnóstico y tratamiento; el servidor comprueba el alcance clínico. Las altas usan una clave idempotente para evitar duplicar una solicitud reintentada. Las recetas o recomendaciones asociadas a productos no crean por sí mismas una compra ni una reserva.

**¿Qué comprueba una asignación profesional?**

El catálogo relaciona profesionales activos con servicios y, cuando corresponde, con la especialidad requerida. La aplicación filtra opciones para facilitar la elección; el servidor sigue siendo la autoridad de permisos y asignaciones.
