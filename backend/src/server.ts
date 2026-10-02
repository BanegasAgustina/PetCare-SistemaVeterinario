/** Inicia HTTP y libera recursos al detener el proceso. */
import { app } from './app';
import { env } from './config/env';
import { databasePool } from './config/database';

const server = app.listen(env.port, '0.0.0.0', () => {
  console.info(`PetCare API disponible en http://localhost:${env.port}/api/health`);
});
server.on('error', () => {
  console.error('No se pudo iniciar la API. Revisá el puerto configurado.');
  process.exitCode = 1;
});

function shutdown(): void {
  // El límite evita dejar el proceso esperando indefinidamente conexiones abiertas.
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(() => {
    void databasePool.end().then(() => { clearTimeout(timeout); }).catch(() => { process.exitCode = 1; });
  });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
