# PetCare Mobile — fase 3

> **Configuración vigente:** [CONFIGURACION_COMPLETA.md](../CONFIGURACION_COMPLETA.md). Login ahora conecta Google/Facebook/X; Perfil/Mi cuenta permite vínculo explícito. AuthContext rota refresh tokens y comparte verificación de email. OAuth nativo requiere un build propio con scheme `petcare`; Expo Go no registra ese retorno. Los detalles visuales de fase 3 se conservan como referencia de su evolución.

La experiencia Cliente está en `src/app/client`, con cinco pestañas y services autenticados. Ver [rutas, componentes, datos y pruebas](../IMPLEMENTACION_CLIENTE.md).

React Native con Expo SDK 57, TypeScript y Expo Router. Login, Registro y perfil protegido con logo real, temas claro/oscuro y sesión mediante AuthContext.

Se conserva la arquitectura en src y las imágenes originales. OAuth y gestión de mascotas utilizan servicios del backend y datos reales.

## Ejecutar

Requisitos: Node.js >= 22.13 y Expo Go compatible con SDK 57.

```bash
cd mobile
npm install
npx expo start
```

Antes de iniciar Expo, copiar .env.example a .env y completar EXPO_PUBLIC_API_URL, por ejemplo http://192.168.1.20:3000/api (reemplazar por IP LAN real). Android físico: localhost apunta al teléfono; emulador Android estándar: usar http://10.0.2.2:3000/api. Web local: http://localhost:3000/api. Iniciar backend y preparar MySQL según su README. Reiniciar Expo tras cambiar variables.

Android: escanear QR en Expo Go con ambos equipos en la misma red. Para emulador iniciado en Android Studio, presionar a. Un túnel Expo no publica automáticamente la API.

Alternativas: `npm start`, `npm run android`, `npm run ios` (simulador requiere macOS) y `npm run web` para revisión auxiliar.

## Arquitectura

- src/app/_layout.tsx: proveedores, barra de estado y navegación.
- src/app/index.tsx: entrada directa a Login o cuenta si existe sesión.
- src/contexts/ThemeContext.tsx y src/hooks/useTheme.ts: tema del sistema o selección manual temporal; se reinicia al cerrar la aplicación.
- src/constants/theme.ts: paleta centralizada derivada del recurso original.
- src/components/ui: AppText y AppButton accesibles.
- src/components/layout/ScreenContainer.tsx: SafeAreaView, ScrollView y ancho flexible limitado en pantallas grandes.
- src/assets: logo e isotipo copiados desde los originales.

Expo Router detecta automáticamente src/app. No existe una segunda carpeta app en la raíz, ni se configura un root personalizado. app.json actualiza icono, adaptiveIcon y favicon a src/assets. package.json, tsconfig.json y eslint.config.js permanecen en mobile.

AuthContext y useAuth gestionan sesión, vencimiento y restauración mediante /auth/me. services separa API, autenticación y almacenamiento; types define contratos; utils valida formularios; components/forms reutiliza inputs/formulario. AppInput permite mostrar contraseña, AppButton presenta loading y ScreenContainer usa scroll, KeyboardAvoidingView en formularios y ajuste resize en Android. Las rutas privadas usan Stack.Protected.

## Imágenes

src/assets/petcare-logo.png copia imagenes/logo grande.png; src/assets/petcare-icon.png copia imagenes/logo de app.png. Originales intactos. Login y Registro muestran el logo transparente sin panel, con contorno fino en oscuro.

El Login usa src/assets/login-pets.png, copia intacta de imagenes/iniciodesesion.png. LoginPets mide el espacio restante y escala la composición completa; solo queda fuera la transparencia superior del recurso. LoginLayout ocupa la altura disponible sin scroll con teclado cerrado y habilita desplazamiento con teclado o alturas menores a 540 px. A 700 px o menos se compactan campos y espacios, conservando áreas táctiles. LoginBrand muestra el PNG transparente sin panel y añade un contorno fino en oscuro manteniendo el logo original encima. Los iconos usan la librería instalada @expo/vector-icons.

Google, Facebook y X/Twitter se muestran únicamente como logos en círculos de 48 px, sin nombres debajo ni mensajes de disponibilidad. X usa el icono x-twitter de FontAwesome6 ya incluido; no se agregó ninguna dependencia. En la versión actual, SocialLoginButton recibe callbacks de AuthContext y muestra errores/carga del flujo OAuth; requiere proveedores configurados. Sus nombres permanecen como etiquetas accesibles para lectores de pantalla. «¿Olvidaste tu contraseña?» conserva el aviso y «Registrate» la navegación real. La corrección posterior añade el flujo de verificación documentado abajo.

Otros recursos originales (paleta, isotipo y fotografías) se conservan; no se eliminan archivos funcionales ni se descargan animales externos.

### Archivos del rediseño de Login

Se reemplazó la UI de src/app/login.tsx y la demostración inicial de src/app/index.tsx por entrada directa. AuthForm incorpora opciones optativas compact/secondaryAction; AppInput incorpora iconos optativos y ojo, manteniendo los valores por defecto de Registro. Se añadieron LoginLayout, LoginBrand, LoginPets, SocialLoginButton, RecoveryNotice y la copia login-pets.png; package.json/package-lock.json registran la dependencia de iconos.

La corrección compacta se revisó en navegador aislado a 360×640, 390×844 y 412×915, en claro/oscuro: logo sin panel, composición de animales completa dentro de la pantalla, círculos idénticos y sin overflow horizontal/vertical en reposo. Se verificaron validaciones, recuperación y Registro, sin errores JavaScript. El teclado nativo y el comportamiento físico Android/iOS requieren revisión en dispositivo; una ventana reducida no sustituye esa prueba.

## Verificar

```bash
npm run lint
npm run typecheck
npm test
npx expo install --check
npx expo-doctor
npx expo export --platform android
```

Las pruebas comprueban validaciones, confirmación local, payload sin confirmPassword/role, Bearer en /me y mensajes seguros ante errores de servidor/red. Revisar en celulares pequeños/grandes: claro/oscuro, texto ampliado, teclado, scroll, notch y barra inferior. La exportación comprueba imports/rutas/assets; no sustituye pruebas de teclado y SecureStore en teléfono real.

## Backend y base de datos

DB_* y JWT_ACCESS_SECRET pertenecen exclusivamente al backend. EXPO_PUBLIC_API_URL es pública; jamás contiene secretos. API usa timeout de 12 segundos y mensajes seguros. Confirmar contraseña se compara solo en frontend; no se transmite. El registro no envía rol y abre el modal de verificación antes de continuar a Login. Login guarda únicamente token/vencimiento en SecureStore nativo; web usa memoria temporal y pierde sesión al recargar. No se guarda contraseña. Restauración consulta /me; un fallo de red permite reintentar. Token vencido requiere otro login. Cerrar sesión borra almacenamiento local; no revoca un JWT ya emitido en el servidor.

La auditoría inicial de npm informa 13 avisos moderados en dependencias transitivas de Expo (uuid/xcode y decode-uri-component/query-string, propagados a herramientas Expo). No se ejecutó npm audit fix --force: propone retroceder SDK/Router y romper compatibilidad. Revisar actualizaciones compatibles antes de publicar.

## Feedback y verificación de email

- Errores de campo: AppInput inline; errores generales: FormNotice. Su rol accesible alert anuncia al lector de pantalla; no abre un alert nativo.
- AppModal: fade, overlay oscuro transparente, superficie ThemeContext, Safe Area, ancho 90%/máximo 440 px y scroll interno cuando falta altura. Cierre externo/atrás solo con dismissible=true.
- ConfirmModal: título, explicación y cancelar/confirmar; admite acción destructiva, loading y error integrado; bloquea duplicados y cierre durante la acción. Preparado para futuras confirmaciones sin añadir funciones.
- FeedbackProvider / useFeedback: toast success/error/info no bloqueante, desaparece a los 4,5 segundos, cierre manual, Safe Area y animación con Reduce Motion.
- VerificationCodeModal: único para Registro/Login; bloquea backdrop y atrás. Seis casillas comparten un TextInput numérico accesible: avance visual, retroceso y pegado con limpieza de caracteres no numéricos. Email enmascarado, contador y errores dentro del modal.

Registro presenta Nombre completo, correo, teléfono opcional, contraseña y repetición. Para conservar el contrato anterior, el primer término se envía como firstName y el resto como lastName; se exige nombre y apellido sin números. Registro permite desplazamiento para acceder a sus cinco campos y mascotas en celulares pequeños; Login conserva el ajuste sin scroll en reposo.

Crear cuenta → backend valida/crea pendiente → SMTP envía → modal sobre Registro. Código correcto muestra «Correo verificado» y «CONTINUAR», que vuelve a Login con email precargado y toast. No existe una ruta /verify-email. Código incorrecto/vencido o fallo de red mantiene el modal abierto. Reenviar invalida el anterior y reinicia 45 segundos; el servidor controla los límites. El contador usa hora de recepción y reloj actual, incluso al regresar del background. Si vence la prueba de 24 horas, se ofrece volver a Login y obtener otra tras comprobar la contraseña.

Login pendiente recibe EMAIL_NOT_VERIFIED, muestra aviso y «Verificar ahora». Abre el mismo modal: reutiliza código vigente o inicia envío cuando corresponde. Ninguna prueba opaca autoriza /me. Una recarga no persiste el desafío: se retoma desde Login. No se guarda contraseña, código o prueba en SecureStore ni se imprime en logs. SMTP_* y EMAIL_CODE_SECRET son exclusivos del backend.

Regla global en ../AGENTS.md y eslint.config.js. Informe: [../INFORME_VERIFICACION_EMAIL.md](../INFORME_VERIFICACION_EMAIL.md).

