# Auditoría frontend, Expo, navegación y UX

## Tecnologías y estructura

`mobile/package.json` fija Expo SDK 58, Expo Router ~58, React 19.3, React Native 0.88 y React Native Web. La navegación está bajo `mobile/src/app`; las rutas separan cliente, veterinario, profesional/peluquería, secretaría y administración. El estado global usa Context API: autenticación, tema, checkout y feedback. No se requiere adoptar Redux por evidencia actual.

## Observaciones

- Autenticación restaura la sesión y selecciona rutas por rol; layouts usan permisos efectivos para módulos. Los endpoints protegidos no dependen de la navegación.
- `api.ts` centraliza URL base, bearer token, serialización, timeout de 12 segundos, errores legibles y logs de diagnóstico sin token/body. No hay reintento automático genérico; en mutaciones es prudente evitar reintentos ciegos. Cancelación por `AbortController` ocurre al timeout, no se observa API pública para cancelar cada consulta al desmontar.
- Context API separa dominios razonablemente; no se midieron renders ni profiling de dispositivos.
- `ScreenContainer` incluye decoración de huellas con `pointerEvents="none"`; los tests mobile cubren que el fondo sea decorativo/no interactivo. Se encuentran logos y assets originales en `mobile/src/assets`.
- Formularios usan componentes compartidos, validadores y mensajes de error; existen variantes `.web` y nativas para fecha/hora. Unit tests validan parte del flujo de checkout y rutas. No prueba foco/teclado físico.
- Layout incluye scroll, safe area y puntos de quiebre web/tablet/escritorio en componentes compartidos; `app.json` orienta portrait y permite tablet iOS. El análisis estático no prueba que no haya cortes, overlays o texto truncado en tamaños reales.
- Accesibilidad: se observan roles/labels en controles interactivos y estados de radio, pero no se realizó auditoría integral de lector de pantalla, contraste WCAG o tamaño de toque.

## Responsive y entradas

| Entorno | Evidencia | Resultado |
|---|---|---|
| Android / Expo Go | SDK y plugins presentes; OAuth custom scheme y push requieren development build/APK propio. | Implementación declarada, no prueba visual/dispositivo. |
| APK | `eas.json` tiene perfiles development, preview, production y production-apk; `app.json` define `petcare://` y un `android.package` genérico `com.anonymous.petcare`. | Preparación parcial; no se generó APK y package ID requiere decisión/configuración de publicación. |
| Web móvil/escritorio | `react-native-web`, Vercel config y componentes adaptativos; configuración de URL API. | NO VERIFICABLE en navegador real en esta auditoría. |
| Tablet/orientación | Tablet iOS habilitada; `orientation: portrait`. | Horizontal no soportado por configuración actual; tablet Android sin verificación. |
| Foco/teclado/modal | Inputs comunes, `keyboardShouldPersistTaps="handled"`; tests locales limitados. | NO VERIFICABLE manualmente. |

## Hallazgos

1. El README raíz señala SDK 57 y no corresponde con el manifiesto SDK 58. Revisar también texto de React Native “0.88.0-rc.3” en mobile README versus `0.88.0` en `package.json`.
2. El paquete Android sigue usando `com.anonymous.petcare`; un packageId de publicación estable debe configurarse antes de distribuir.
3. El proyecto contiene EAS projectId y perfiles, pero no se inspeccionaron credenciales ni entornos remotos; el build Android no se intentó.
4. Debe hacerse revisión visual/táctil en teléfono pequeño/grande y tablet antes de afirmar responsive, foco de inputs o accesibilidad.

## Comprobaciones ejecutadas

En `mobile`: typecheck, `expo lint` y `npm test` completaron correctamente; 12 pruebas pasaron. No se corrió `expo export`, Expo Doctor ni build APK.

## Evidencia

`mobile/app.json`, `mobile/eas.json`, `mobile/src/app/_layout.tsx`, `components/layout/ScreenContainer.tsx`, `components/layout/GlobalNavigation.tsx`, `components/forms/AppInput.tsx`, `contexts/*`, `services/api.ts`, `services/session-store.ts`, `mobile/README.md`, README raíz.
