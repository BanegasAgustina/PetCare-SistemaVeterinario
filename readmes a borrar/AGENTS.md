# Convención global de UX de PetCare

- PetCare no utiliza alerts nativos ni sus equivalentes del navegador. No importar `Alert` ni llamar `alert`, `confirm` o `prompt`.
- Errores de inputs: mensajes inline. Confirmaciones y acciones destructivas: `ConfirmModal`, derivado de `AppModal`. Feedback breve: `useFeedback().showToast`.
- La verificación de email se presenta con `VerificationCodeModal`, compartido por Registro y Login; la seguridad y sus límites pertenecen al backend.
- Reutilizar ThemeContext, respetar Safe Area, accesibilidad y modos claro/oscuro. Mantener comentarios importantes en español y no introducir credenciales en Git.
- No implementar funcionalidades futuras sin autorización. También respetar las instrucciones específicas de `mobile/AGENTS.md`.

# Regla crítica: cero datos de demostración

- Todo dato funcional proviene de MySQL mediante backend/API y services del frontend. No agregar registros ficticios, arrays de negocio hardcodeados ni fallbacks con contenido de muestra en producción.
- Antes de implementar una pantalla, revisar esquema y endpoints existentes. Si falta acceso, completar repository/service/controller/route con validación y autorización; si no es posible, documentar la función pendiente sin simular resultados.
- Diferenciar carga, error, resultado vacío y funcionalidad pendiente. Un error o endpoint pendiente no demuestra que haya cero registros. Solo una consulta exitosa sin resultados permite mostrar el estado vacío.
- Saludos, registros, catálogos, estados, precios y contadores se obtienen de datos reales. No duplicar catálogos administrados en MySQL en arrays TypeScript.
- La identidad se obtiene del JWT en backend. Aplicar ownership a mascotas, turnos, información clínica, pedidos y notificaciones; no confiar en userId libre enviado por frontend.
- Logos, huellas, iconos, fondos e ilustraciones son assets permitidos. Un placeholder gráfico genérico no debe representar una mascota o producto ficticio.
- No ejecutar INSERT, seeds ni migraciones para rellenar pantallas. Solo se permiten catálogos estructurales del diseño existente; justificar cualquier seed nuevo.
- Antes de finalizar, buscar globalmente mock, fake, sample, demo, dummy, placeholderData y testData, y revisar manualmente arrays/objetos y valores de ejemplo. Conservar fixtures exclusivos de tests y mecanismos de seguridad sin contenido de negocio.
