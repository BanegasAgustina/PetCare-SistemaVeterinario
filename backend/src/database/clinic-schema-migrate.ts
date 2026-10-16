/** Aplica los dos ajustes aditivos que habilitan detalles de turnos e historial de motivos. */
import { databasePool } from '../config/database';
import { migrateAppointmentDetails } from './appointment-details-migrate';
import { migrateReservationReason } from './reservation-reason-migrate';

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
