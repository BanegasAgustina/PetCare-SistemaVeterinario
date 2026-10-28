// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Inicia HTTP y libera recursos al detener el proceso. */
import { app } from './app';
import { env } from './config/env';
import { databasePool } from './config/database';
import { expireDueReservations } from './repositories/reservation.repository';

// Dato server: conserva un valor calculado o de configuración usado por este módulo.
const server = app.listen(env.port, '0.0.0.0', () => {
  console.info(`PetCare API disponible en http://localhost:${env.port}/api/health`);
  // El worker de backend vence reservas sin depender de que haya clientes conectados.
  void expireDueReservations().catch(() => console.error('No se pudieron revisar reservas vencidas. Verificá la migración de reservas.'));
});
// Dato reservationExpiryTimer: conserva un valor calculado o de configuración usado por este módulo.
const reservationExpiryTimer=setInterval(()=>void expireDueReservations().catch(()=>console.error('No se pudieron revisar reservas vencidas.')),30_000);
reservationExpiryTimer.unref();
server.on('error', () => {
  console.error('No se pudo iniciar la API. Revisá el puerto configurado.');
  process.exitCode = 1;
});

// Función shutdown: concentra la lógica dentro de este módulo.
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
