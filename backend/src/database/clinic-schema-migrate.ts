/**
 * ARCHIVO: clinic-schema-migrate.ts
 * UBICACIÓN: backend/src/database/clinic-schema-migrate.ts
 * FUNCIÓN: Punto de entrada de migración específica del esquema clínico.
 * RESPONSABILIDAD: Ejecuta el proceso definido para actualizar estructura y reporta errores operativos.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/database/appointment-details-migrate.ts, backend/src/database/reservation-reason-migrate.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Invocación desde script administrativo → databasePool y helpers de migración.
 * IMPORTANCIA: Permite ejecutar la evolución clínica como tarea separada del servidor HTTP.
 */
/** Aplica los dos ajustes aditivos que habilitan detalles de turnos e historial de motivos. */
import { databasePool } from '../config/database';
import { migrateAppointmentDetails } from './appointment-details-migrate';
import { migrateReservationReason } from './reservation-reason-migrate';

/** Ejecuta la migración de esquema clínico como operación de CLI y devuelve un estado de salida. */
async function main(): Promise<void> {
  try {
    await migrateAppointmentDetails();
    await migrateReservationReason();
    console.info('Esquema clínico actualizado: detalles de turnos e historial de motivos disponibles.');
  } catch {
    console.error('No se pudo actualizar el esquema clínico. Revisá que backend/.env apunte a la base del backend activo y que el usuario tenga permisos ALTER.');
    process.exitCode = 1;
  } finally {
    await databasePool.end();
  }
}

void main();
