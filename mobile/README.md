# PetCare Mobile — fase 3
AAAAAA
> Login tradicional y OAuth Google/Facebook/X pasan por el backend PetCare. Perfil/Mi cuenta permite vinculación explícita; las cuentas no se fusionan por correo. El retorno OAuth usa `petcare://oauth`, disponible en un build propio y no en Expo Go.

La experiencia Cliente está en `src/app/client`, con cinco pestañas y services autenticados. Ver [rutas, componentes, datos y pruebas](../IMPLEMENTACION_CLIENTE.md).

React Native con Expo SDK 58, React 19.3, React Native 0.88.0-rc.3, TypeScript y Expo Router. Login, Registro y perfil protegido con logo real, temas claro/oscuro y sesión mediante AuthContext.

Se conserva la arquitectura en src y las imágenes originales. OAuth y gestión de mascotas utilizan servicios del backend y datos reales.

## Ejecutar

Requisitos: Node.js >= 22.13 y Expo Go compatible con SDK 58.

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

DB_* y JWT_ACCESS_SECRET pertenecen exclusivamente al backend. EXPO_PUBLIC_API_URL es pública; jamás contiene secretos. API usa timeout de 12 segundos y mensajes seguros. Confirmar contraseña se compara solo en frontend; no se transmite. El registro no envía rol y abre el modal de verificación antes de continuar a Login. Login guarda la sesión en SecureStore nativo y en sessionStorage para web (persiste al recargar la pestaña, pero no en una nueva sesión del navegador). No se guarda contraseña. Restauración consulta /me; un fallo de red permite reintentar. Token vencido requiere otro login. Cerrar sesión borra almacenamiento local; no revoca un JWT ya emitido en el servidor.

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


## Login social y builds Android con EAS

Google, Facebook y X usan OAuth Authorization Code en el backend. Google y X usan PKCE; Facebook usa un cliente confidencial del backend y `state`. Los secretos OAuth solo se configuran en el backend. PetCare verifica la identidad con cada proveedor, crea la sesión existente y devuelve un ticket de un solo uso que la app canjea por POST. Las cuentas nuevas completan el registro y verifican el email. Si el email ya pertenece a una cuenta, inicia sesión en esa cuenta y vincula el proveedor desde Perfil/Mi cuenta; no se fusionan usuarios automáticamente por email.

### Expo Go

Expo Go sirve para abrir la app durante desarrollo y probar las pantallas o el login tradicional si `EXPO_PUBLIC_API_URL` apunta a una API alcanzable por el teléfono. El OAuth social actual no puede completar el retorno `petcare://oauth` dentro de Expo Go porque Expo Go no registra el esquema nativo de PetCare. Usa una Development Build para probar OAuth. No guardes client secrets en Expo ni en el frontend de Vercel.

### Preparar EAS

1. Instala Node.js 22.13 o superior y, desde `mobile/`, inicia sesión en Expo: `npx eas-cli@latest login`.
2. Si el proyecto aún no está vinculado a EAS, ejecuta `npx eas-cli@latest init` y conserva el `projectId` que EAS agregue a la configuración. No cambies `android.package` sin actualizar los registros externos que dependan de él.
3. En la configuración de entorno de EAS para preview/production, define `EXPO_PUBLIC_API_URL` con la URL HTTPS pública real de la API, incluyendo `/api`. No uses localhost ni una IP privada en un APK distribuido.

### Development Build

Desde `mobile/`, genera un APK de desarrollo:

```bash
npx eas-cli@latest build --platform android --profile development
```

Instala el APK del enlace de EAS. Para cargar el bundle de JavaScript desde tu computadora, ejecuta `npx expo start --dev-client`. El esquema `petcare` ya está en `app.json`; cualquier cambio exige reconstruir la app.

### APK independiente de prueba

El perfil `preview` genera un APK independiente instalable:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Descarga el APK desde EAS y ábrelo en Android para instalarlo. No requiere Expo Go ni un servidor de desarrollo. Que compile no confirma que un proveedor OAuth acepte las credenciales o callbacks.

### APK de producción

El perfil `production-apk` genera un APK de release instalable, separado del perfil `production` (AAB para Google Play). Antes del build, crea `EXPO_PUBLIC_API_URL` en el entorno EAS `production` con el valor `https://pet-care-sistema-veterinario.vercel.app/api`. La variable es pública y queda incorporada al APK.

```bash
npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://pet-care-sistema-veterinario.vercel.app/api --environment production --visibility plaintext
npx eas-cli@latest build --platform android --profile production-apk
```

Para preview usa el mismo nombre de variable en el entorno `preview` con una API de preview HTTPS. Los builds de release rechazan HTTP; HTTP queda limitado al desarrollo local de Expo.

### Configurar y verificar OAuth

Configura las variables en proyectos Vercel separados; el dominio y los callbacks indicados son los oficiales de este despliegue. En el proyecto `mobile` (Root Directory `mobile`), define `EXPO_PUBLIC_API_URL=https://pet-care-sistema-veterinario.vercel.app/api` para Production y Preview según corresponda. En el proyecto `backend` (Root Directory `backend`), define `NODE_ENV=production`, `BACKEND_URL=https://pet-care-sistema-veterinario.vercel.app` (origen sin `/api`), `CORS_ALLOWED_ORIGINS=https://petcare-sistemaveterinario-mobile.vercel.app` y `OAUTH_RETURN_URLS=https://petcare-sistemaveterinario-mobile.vercel.app/oauth,petcare://oauth`. El esquema nativo es un destino OAuth, nunca un origen CORS.

En el proyecto `backend` configura además las variables privadas `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `DB_SSL_MODE=required` con los datos de Layerbase; no las cargues en `mobile`, Expo ni en variables `EXPO_PUBLIC_*`. La aplicación ahora exige host, usuario y contraseña remotos en producción, y rechaza loopback e IPs LAN. Carga también `JWT_ACCESS_SECRET` y `EMAIL_CODE_SECRET` como secretos aleatorios independientes de al menos 32 bytes; `JWT_ACCESS_TTL_SECONDS`, `JWT_ISSUER` y `JWT_AUDIENCE` pueden conservar sus valores predeterminados documentados. Para email define `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD` y `MAIL_FROM`. Para recuperación y activación define `PASSWORD_RESET_URL=https://petcare-sistemaveterinario-mobile.vercel.app/reset-password`, `VETERINARIAN_INVITATION_URL=https://petcare-sistemaveterinario-mobile.vercel.app/activate-vet` y, si se envían invitaciones de cuentas generales, `ACCOUNT_INVITATION_URL=https://petcare-sistemaveterinario-mobile.vercel.app/activate-account`. Las imágenes requieren el almacenamiento privado que ya utiliza el backend (Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; o S3 compatible: `BUCKET`, `REGION`, `ENDPOINT`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` y opcionalmente `PET_PHOTO_S3_URL_STYLE`).

Para OAuth define en `backend` los secretos privados `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET` y `X_CLIENT_ID`/`X_CLIENT_SECRET` (X también admite los nombres anteriores `TWITTER_CLIENT_ID`/`TWITTER_CLIENT_SECRET`); Facebook requiere `FACEBOOK_GRAPH_VERSION`. No cargues credenciales OAuth en el proyecto `mobile`. El endpoint `/api/health/database` comprueba la conexión DB, pero no confirma correo, credenciales OAuth ni autorizaciones en las consolas externas.

Obtén los callbacks exactos de cada proveedor ejecutando desde `backend/`: `npm run oauth:callbacks`. Registra en cada consola el callback HTTPS de ese proveedor, formado con el origen real del backend y `/api/auth/oauth/{proveedor}/callback`. No registres `/oauth` ni `petcare://oauth` como callback del proveedor: son destinos finales a los que redirige PetCare después del callback del proveedor.

- **Google Cloud Console:** cliente OAuth web con el callback HTTPS de Google. Comprueba pantalla de consentimiento, dominios autorizados y publicación. El flujo actual con navegador/backend no requiere cliente Android nativo ni SHA de firma.
- **Meta for Developers:** añade Facebook Login, habilita OAuth web y registra el callback HTTPS de Facebook. Completa la información de publicación y revisión de permisos que solicite Meta. El flujo actual no usa el SDK Android de Meta, así que no necesita package name ni key hashes de Facebook. Si se cambia a SDK nativo, serán necesarios el package `com.anonymous.petcare` y los hashes de las firmas debug/release del APK.
- **X Developer Portal:** habilita OAuth 2.0 Authorization Code with PKCE para una aplicación confidencial de tipo **Web App** (o Automated App/bot) y copia su OAuth 2.0 Client ID y Client Secret al backend como `X_CLIENT_ID` y `X_CLIENT_SECRET`. Los nombres antiguos `TWITTER_CLIENT_ID` y `TWITTER_CLIENT_SECRET` siguen admitidos. No uses las API Key/Secret de OAuth 1.0. Registra como callback el valor exacto que imprime `npm run oauth:callbacks` para X. Este flujo solicita `users.read` para consultar `/2/users/me`; no necesita `tweet.read`. El Client Secret permanece solo en el backend.

Si X muestra “algo salió mal”, revisa primero los registros del backend en el instante del intento. `oauth.provider_http_error` incluye proveedor, etapa (`token_exchange` o `profile`), estado HTTP y código de error devuelto por X, sin guardar tokens ni respuestas completas; `oauth.provider_request_failed` indica que falló la solicitud o el análisis de respuesta. `oauth.callback_failed` indica la etapa general y código PetCare. `oauth.provider_denied` significa que se canceló o rechazó el consentimiento. Si no aparece ninguno, confirma que X está redirigiendo al backend desplegado configurado en `EXPO_PUBLIC_API_URL`.

En el portal de X, verifica que OAuth 2.0 esté activado, que la app sea confidencial y que el callback coincida carácter por carácter con `BACKEND_URL` + `/api/auth/oauth/x/callback` (incluidos esquema HTTPS y ruta). Los valores `petcare://oauth` y `/oauth` son destinos finales de la app y van en `OAUTH_RETURN_URLS`, no en el portal de X. El estado del portal, la validez del Client Secret y una suspensión de la aplicación solo se pueden confirmar desde la cuenta de X Developer que administra la app.

Prueba cada proveedor en la web y en el APK instalado: cancelar consentimiento, acceder con una identidad ya vinculada, registrar una identidad nueva y verificar el correo, renovar la sesión y vincularlo explícitamente desde una cuenta existente. X no entrega email en este flujo, por lo que el alta pide un correo al usuario.

Las versiones de `package.json` corresponden a Expo SDK 58, React 19.3 y React Native 0.88.0-rc.3. No se actualizaron dependencias para preparar EAS. Expo Go puede usarse para desarrollo general compatible con SDK 58, pero no para el retorno `petcare://oauth` de este flujo.

## Error de React Native: texto fuera de `<Text>`

**Síntoma:** la app muestra `Text strings must be rendered within a <Text> component` y la traza puede señalar `ScrollView` aunque el origen esté en una pantalla que usa `PetCareScreen`.

**Causa:** una condición JSX como `{valorOpcional && <AppText>...</AppText>}` devuelve `""` cuando `valorOpcional` es una cadena vacía. React Native recibe esa cadena como hijo directo de un contenedor (`View` o `ScrollView`) y falla al renderizar.

**Solución aplicada:** comprobar valores opcionales con un booleano antes de renderizar, por ejemplo `{Boolean(valorOpcional) && <AppText>...</AppText>}`. Para valores numéricos opcionales, comprobar `valor !== null && valor !== undefined` para admitir también el valor cero. Se aplicó el criterio en Reservas, Turnos, Pacientes, Profesionales, Servicios, Clientes, formularios y componentes compartidos de estados y encabezados. No se modificaron pantallas de rutas `src/app/client` ni su presentación.

**Comprobación:** `npm run typecheck` y `npm run lint` completan correctamente. `npm test` completa, pero el proyecto no contiene pruebas automatizadas (`0 tests`).
