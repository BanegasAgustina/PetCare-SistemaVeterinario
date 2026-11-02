/**
 * ARCHIVO: server.ts
 * UBICACIÓN: backend/src/server.ts
 * PROPÓSITO: Iniciar el servidor HTTP de PetCare en ejecución local y cerrar sus recursos ordenadamente.
 * RESPONSABILIDAD: Escuchar solicitudes, ejecutar la revisión periódica de reservas vencidas y liberar el pool SQL al recibir SIGINT/SIGTERM.
 * RELACIONES: Usa la aplicación Express de app.ts, la configuración de config/env.ts, el pool de config/database.ts y expireDueReservations de repositories/reservation.repository.ts. Vercel puede importar app.ts directamente y no necesita este listener.
 * FLUJO: Lee el puerto configurado, inicia Express, revisa reservas al arrancar y cada 30 segundos; ante una señal detiene el temporizador, cierra HTTP y después el pool.
 * IMPORTANCIA: Es el punto de arranque del proceso backend fuera de una plataforma que gestione directamente la aplicación Express.
 */

/** Inicia HTTP y libera recursos al detener el proceso. */
import { app } from './app';
import { env } from './config/env';
import { databasePool } from './config/database';
import { expireDueReservations } from './repositories/reservation.repository';

const server = app.listen(env.port, '0.0.0.0', () => {
  console.info(`PetCare API disponible en http://localhost:${env.port}/api/health`);
  // El worker de backend vence reservas sin depender de que haya clientes conectados.
  void expireDueReservations().catch(() => console.error('No se pudieron revisar reservas vencidas. Verificá la migración de reservas.'));
});
const reservationExpiryTimer=setInterval(()=>void expireDueReservations().catch(()=>console.error('No se pudieron revisar reservas vencidas.')),30_000);
reservationExpiryTimer.unref();
server.on('error', () => {
  console.error('No se pudo iniciar la API. Revisá el puerto configurado.');
  process.exitCode = 1;
});

/** Cierra el listener y el pool SQL con un límite para no dejar el proceso bloqueado. */
function shutdown(): void {
  clearInterval(reservationExpiryTimer);
  // El límite evita dejar el proceso esperando indefinidamente conexiones abiertas.
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(() => {
    void databasePool.end().then(() => { clearTimeout(timeout); }).catch(() => { process.exitCode = 1; });
  });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
