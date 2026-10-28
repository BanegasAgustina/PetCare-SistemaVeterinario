// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne las operaciones relacionadas con este módulo.

/** Verificación exige el token entregado tras registro o credenciales válidas, no un email arbitrario. */
import { AppError } from "../utils/app-error";
// Función validateVerification: comprueba una regla o condición dentro de este módulo.
export function validateVerification(
  value: unknown,
  withCode: boolean,
): { verificationToken: string; code?: string } {
  // Función invalid: agrupa una operación que este módulo puede ejecutar o reutilizar.
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
