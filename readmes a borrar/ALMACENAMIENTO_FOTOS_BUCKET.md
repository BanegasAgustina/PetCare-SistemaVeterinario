# Fotos privadas de mascotas en Railway Storage Bucket

Se conserva el formulario, selector de galería, calendario, raza y CRUD existentes. Las imágenes se validan y procesan en memoria con sharp; no se escriben en filesystem. No hay migración de esquema, seeds ni modificaciones directas de datos.

## Configuración exacta del backend

No se encontraron variables S3 en backend/.env ni referencias en el repositorio, y no hay CLI Railway disponible para consultar el servicio remoto. Se usan los nombres documentados por Railway. No se inspeccionaron ni modificaron variables remotas.

1. Railway → proyecto y entorno del backend → New/Create → Bucket. Nombre de recurso sugerido: petcare-photos. Elegir la región; guardar el nombre real del recurso para las referencias. No crear un Volume.
2. Bucket → Credentials: confirmar nombres y estilo de URL. El nombre API es BUCKET, no RAILWAY_BUCKET_NAME ni el nombre visual del recurso.
3. Backend → Variables: agregar estas referencias con el selector de Railway. Sustituir NOMBRE_REAL_DEL_RECURSO por el nombre real de ese bucket:

| Variable del backend | Referencia Railway |
| --- | --- |
| BUCKET | ${{NOMBRE_REAL_DEL_RECURSO.BUCKET}} |
| ACCESS_KEY_ID | ${{NOMBRE_REAL_DEL_RECURSO.ACCESS_KEY_ID}} |
| SECRET_ACCESS_KEY | ${{NOMBRE_REAL_DEL_RECURSO.SECRET_ACCESS_KEY}} |
| REGION | ${{NOMBRE_REAL_DEL_RECURSO.REGION}} |
| ENDPOINT | ${{NOMBRE_REAL_DEL_RECURSO.ENDPOINT}} |

4. PET_PHOTO_S3_URL_STYLE=virtual para los buckets actuales; usar path solo si Credentials lo indica para un bucket antiguo. No incluir el bucket en ENDPOINT: Railway proporciona el endpoint base y el SDK construye el host.
5. Eliminar PET_PHOTO_DIRECTORY del servicio. Conservar BACKEND_URL si lo usa otra configuración: las fotos firmadas ya no necesitan ese valor. Aplicar cambios y desplegar.
6. Exclusivamente para backend local, completar las mismas cinco variables en backend/.env (ignorado por Git), copiando las credenciales del entorno correcto. No poner ninguna en mobile/.env ni en variables EXPO_PUBLIC_*.

Fuentes: [Railway Storage Buckets](https://docs.railway.com/storage-buckets), [servir archivos privados](https://docs.railway.com/storage-buckets/uploading-serving).

## Contrato y seguridad

- Subida: POST /api/client/pets o PUT /api/client/pets/:id con photoBase64. Se mantienen estos endpoints; /media/pets anteriormente solo servía archivos estáticos, no recibía subidas. No se duplica el endpoint de subida.
- Autenticación JWT y rol CLIENT antes de parsear hasta 8 MB de JSON; límite de 30 escrituras por IP cada 15 minutos. En edición se comprueba ownership antes de subir.
- JPEG, PNG y WebP comprobados por decodificación real; máximo 5 MiB y 25 megapíxeles, sin animación. Rotación EXIF y conversión a WebP de hasta 1200 × 1200, calidad 85, sin conservar metadatos. La extensión y ContentType se generan a partir de la conversión, no del nombre ni MIME del cliente.
- Clave generada exclusivamente por backend: pets/{ownerId}/{uuid-v4}.webp. Se valida ownerId; no se aceptan claves arbitrarias, nombres originales ni traversal.
- MySQL: client_pet_details.photo_url almacena exactamente esa clave estable. NULL significa sin foto. No almacena binarios, rutas locales, URL de backend ni URL firmada.
- GET /api/client/pets, /api/client/pets/:id, /api/client/home y respuestas de guardar convierten la referencia a una presigned GET URL con duración de 900 segundos. El contrato photoUrl del frontend sigue siendo una URL de visualización. Se regenera en cada consulta; al abrir la app o volver a una pantalla el hook existente reconsulta. No se cambió AuthContext.
- GET /media/pets/:id: ahora exige JWT, rol CLIENT y ownership en MySQL; devuelve {success:true,data:{url}} con una nueva URL temporal (o url:null si no hay foto). No acepta object key ni publica el bucket. Mascota ajena devuelve 404; sin JWT, 401. Cache-Control: no-store.
- La URL firmada es una capacidad temporal de lectura: quien la reciba puede usarla hasta expirar. No contiene el secreto S3. No se registran URLs firmadas ni credenciales en logs.

## Reemplazo, quitar y baja

Se sube primero la foto nueva. La transacción MySQL bloquea la mascota y su detalle; consulta la referencia anterior bajo lock. Al guardar sin modificar foto conserva la clave vigente, incluso si la URL enviada es vieja o expiró. Nunca copia esa URL a MySQL. En alta se rechaza una URL sin imagen subida.

Después del commit se borra la referencia anterior solo cuando cambió, y solo si tiene formato válido y pertenece al dueño. Si falla MySQL se intenta borrar la nueva y se conserva la anterior. Quitar foto envía photoUrl:null, guarda NULL y después borra el objeto anterior. El placeholder de huella existente se mantiene.

S3 reintenta errores hasta tres intentos. Si la limpieza falla después de confirmar MySQL, se registra un mensaje sin secretos y se conserva el resultado del guardado; puede quedar un objeto huérfano que requiere limpieza operativa. No existe una transacción distribuida MySQL/S3 ni se añadió una cola futura.

La eliminación de mascotas sigue siendo soft delete y conserva el objeto por política de historial. No se eliminan imágenes por redeploy.

Las referencias antiguas al volumen no se convierten automáticamente: no es posible recuperar esos bytes desde un bucket nuevo. Se realizó una consulta real de solo conteos: había cero referencias no vacías en client_pet_details. Una referencia antigua o ajena provoca PHOTO_REFERENCE_UNSUPPORTED, no una imagen inventada ni un fallback público.

## Archivos de esta migración

Backend: src/services/pet-photo.service.ts; src/services/client.service.ts; src/repositories/client.repository.ts; src/controllers/client.controller.ts; src/app.ts; .env.example; package.json; package-lock.json; tests/pet-bucket.test.ts.
Mobile: src/services/api.ts (mensaje de referencia antigua). No se modificaron galería, calendario ni formulario.
Documentación: este archivo y CORRECCION_FORMULARIO_MASCOTA.md.
Dependencias nuevas, previamente ausentes: @aws-sdk/client-s3 y @aws-sdk/s3-request-presigner, ambas ^3.1146.0. Se conserva sharp.

## Prueba real desde Expo Go

1. Configurar las referencias, desplegar backend y verificar EXPO_PUBLIC_API_URL en mobile/.env con la URL real del backend incluyendo /api. Reiniciar Metro después de cambiarla.
2. Desde mobile ejecutar npm install si faltan dependencias y npx expo start --clear. Abrir QR con Expo Go compatible con SDK 57. Iniciar sesión con un CLIENT real verificado.
3. Crear una mascota real sin foto: comprobar la huella y photo_url NULL.
4. Agregar/editar: elegir una foto JPEG/PNG/WebP desde galería, guardar. Confirmar en el bucket el objeto pets/{id-real-del-dueño}/{uuid}.webp y en MySQL la misma clave, sin X-Amz-* ni https://.
5. Cerrar la app y volver a abrirla: comprobar que la foto se muestra. Volver al listado/detalle para obtener una nueva URL. Para probar expiración, esperar más de 15 minutos y reconsultar; la URL nueva debe funcionar.
6. Editar nombre/peso sin tocar foto: verificar que la clave MySQL no cambió y que no se creó otro objeto.
7. Cambiar foto: comprobar nueva clave y objeto; después del guardado el objeto anterior debe desaparecer. Simular fallo de subida (entorno de desarrollo) y verificar que la referencia anterior no cambia.
8. Quitar foto y guardar: verificar NULL, huella y eliminación del objeto anterior. Los otros datos permanecen.
9. Con token de otro CLIENT real, solicitar GET /media/pets/{id-de-la-mascota-ajena}: esperar 404. Sin token, esperar 401. No compartir una URL ya firmada para esta prueba: su firma autoriza lectura durante 15 minutos.
10. Redeploy backend: reabrir la app y verificar el mismo objeto y clave; confirmar foto. Probar soft delete según las restricciones de turnos vigentes: conserva objeto.

Las pruebas contra Railway Bucket, uso físico de Expo Go y redeploy quedan pendientes de configuración real; no se afirman como realizadas. Los tests de S3 usan fixtures exclusivos de tests y no insertan registros ni suben objetos reales.

## Resultados ejecutados

- Backend: TypeScript, ESLint y build correctos; 16 tests correctos (9 administrativos existentes + 7 pruebas de bucket/ownership/transacción).
- Mobile: TypeScript, Expo lint y 4 tests existentes correctos.
- npm audit después de instalar SDK: cero vulnerabilidades reportadas.
- git diff --check sin errores; revisión global de mock/fake/sample/demo/dummy/placeholderData/testData y de objetos/arrays: fixtures de tests, mecanismo de hash de seguridad existente y catálogos de configuración, sin contenido de negocio ficticio nuevo.
- Lectura real de MySQL solo para conteos: cero referencias de fotos no vacías. Ninguna escritura directa ni migración de esquema.
- Pruebas contra el bucket Railway, redeploy y Expo Go físico: pendientes de configurar credenciales/referencias del servicio; no se realizó despliegue.
