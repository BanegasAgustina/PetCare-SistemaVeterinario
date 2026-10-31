# 10. Despliegue web y Android

## De código a usuario

Git guarda historial de cambios local/remoto. Commit es un conjunto identificado de cambios; rama permite trabajar en una línea de desarrollo. Git está presente como `.git`, pero el hosting remoto GitHub no se confirmó desde este repositorio.

Build/compilación transforma TS/JS y assets en salida ejecutable. Deploy publica esa salida a hosting. Web compila `mobile` con `npx expo export -p web`, salida `dist`, declarada en `mobile/vercel.json`. Backend usa `tsc` hacia `dist`, y `node dist/server.js`; `backend/vercel.json` vacío, por lo que la detección/configuración Vercel se decide en el proyecto remoto y su root directory. Deben ser dos proyectos o configuración equivalente con raíz `mobile` y `backend`.

Una variable de entorno es configuración disponible al proceso sin codificarla en archivos fuente. Backend requiere DB, JWT, CORS; correo, OAuth, almacenamiento y cron son optativos según función. Los valores `.env.example` son nombres/ejemplos, no secretos. Variables `EXPO_PUBLIC_*` quedan embebidas en el bundle y no deben contener claves privadas.

## Vercel

Web reescribe rutas hacia `/`, headers configuran políticas y la URL pública API queda en build. Backend debe tener secretos configurados en Vercel, conectar Layerbase con TLS y callbacks OAuth usar `BACKEND_URL`. `PUBLIC_FRONTEND_URL` sirve para links de invitación/recuperación. Que haya JSON de Vercel en un checkout no prueba que un proyecto esté conectado o desplegado.

## Expo y APK

Expo es la capa de herramientas React Native. EAS Build es el servicio que compila binarios. APK es el paquete instalable Android; no es código fuente. `mobile/app.json` fija nombre, scheme `petcare`, package, plugins y projectId; `mobile/eas.json` define `development`, `preview`, `production`, `production-apk`. Los perfiles internos pueden emitir APK; producción estándar puede usar formato de tienda según valores EAS.

1. EAS instala dependencias y configura build nativo conforme `app.json`/profile.
2. Compila app y recursos, incorpora URL pública `EXPO_PUBLIC_API_URL` del perfil.
3. Firma el paquete; usuario descarga e instala APK.
4. Al abrir, app consulta la API configurada; APK no contiene la base ni el servidor.
5. Si cambia JavaScript web o lógica bundled, nueva compilación/actualización reemplaza el bundle (salvo canal OTA configurado, que no se deduce aquí). Cambios nativos como scheme/plugins requieren rebuild.

OAuth móvil necesita build de desarrollo con scheme de retorno `petcare`; Expo Go no incorpora scheme propio. El proyecto documenta callbacks server-side y retorno por navegador.

## Diferencias operativas

| Local | Producción |
|---|---|
| API puerto 3000 y posiblemente DB local | API Vercel, DB Layerbase con TLS |
| URL puede derivarse de Metro | URL HTTPS fija y validación cerrada |
| variables `.env` local | variables privadas de plataforma |
| logs de desarrollo acotados | errores sanitizados y dominio real |
| Metro/HMR | bundle web / build EAS instalado |

### Preguntas de defensa

- **Básica — ¿Qué es APK?** Paquete instalable Android. **Corta:** “Es la aplicación compilada para instalar.” **Repregunta:** ¿Incluye base de datos?
- **Intermedia — ¿Cómo se conecta APK al servidor?** La URL `EXPO_PUBLIC_API_URL` incluida en build. **Corta:** “El cliente contiene una dirección de API.” **Repregunta:** ¿Se cambia sin rebuild?
- **Avanzada — ¿Por qué proteger variables?** Secreto en cliente puede extraerse del bundle; claves privadas deben quedarse en backend. **Corta:** “El cliente publica su configuración, no sus credenciales.” **Repregunta:** ¿Qué variable sí puede ser pública?
