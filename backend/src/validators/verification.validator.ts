/**
 * ARCHIVO: verification.validator.ts
 * UBICACIÓN: backend/src/validators/verification.validator.ts
 * FUNCIÓN: Valida el código de email y el token opaco del desafío.
 * RESPONSABILIDAD: Limitar cantidad/formato de código y verificar que token pertenezca al formato esperado.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/verification.service.ts
 * FUNCIONAMIENTO: Acepta unknown y devuelve valores validados o AppError; no maneja correo ni persistencia.
 * IMPORTANCIA: Separa validación de entrada del contador de intentos y la entrega SMTP.
 */
/** Verificación exige el token entregado tras registro o credenciales válidas, no un email arbitrario. */
import { AppError } from "../utils/app-error";
/** Valida cuerpo de confirmación, token y código de verificación. */
export function validateVerification(
  value: unknown,
  withCode: boolean,
): { verificationToken: string; code?: string } {
  // Arroja error de verificación con un código público estable.
const invalid = () =>
    new AppError(
      "VALIDATION_ERROR",
      400,
      "Ingresá un código de seis dígitos y una solicitud de verificación válida.",
    );
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw invalid();
  const body = value as Record<string, unknown>;
  const fields = withCode
    ? ["verificationToken", "code"]
    : ["verificationToken"];
  if (
    Object.keys(body).some((field) => !fields.includes(field)) ||
    typeof body.verificationToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(body.verificationToken)
  )
    throw invalid();
  if (withCode && (typeof body.code !== "string" || !/^\d{6}$/.test(body.code)))
    throw invalid();
  return {
    verificationToken: body.verificationToken,
    ...(withCode ? { code: body.code as string } : {}),
  };
}
