/**
 * ARCHIVO: create-super-admin.ts
 * UBICACIÓN: backend/src/database/create-super-admin.ts
 * FUNCIÓN: Asistente local e interactivo para crear la primera cuenta SUPER_ADMIN.
 * RESPONSABILIDAD: Pide y confirma datos en terminal y delega validación, hashing y transacción en bootstrap-super-admin.service.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/services/bootstrap-super-admin.service.ts, backend/src/utils/app-error.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: CLI de operador → create-super-admin → createFirstSuperAdmin. No es endpoint HTTP.
 * IMPORTANCIA: Permite bootstrap privilegiado con control local y sin habilitar autoelevación pública.
 */
/** Credenciales por terminal con contraseña oculta, o JSON por stdin explícito.
 * No acepta credenciales en argumentos, no guarda archivos y no imprime secretos.
 */
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { stdin,stdout } from 'node:process';
import { databasePool } from '../config/database';
import { createFirstSuperAdmin } from '../services/bootstrap-super-admin.service';
import { AppError } from '../utils/app-error';
/** Obtiene datos de cuenta por argumentos o preguntas interactivas sin imprimir secretos. */
async function readInput():Promise<unknown> {
  const args=process.argv.slice(2);
  if(args.length===1&&args[0]==='--stdin') {
    let data='';for await(const chunk of stdin){data+=String(chunk);if(Buffer.byteLength(data)>16384)throw new Error('Entrada demasiado grande.');}
    try{return JSON.parse(data);}catch{throw new AppError('VALIDATION_ERROR',400,'La entrada debe ser un objeto JSON de identidad y contraseña.');}
  }
  if(args.length||!stdin.isTTY||!stdout.isTTY)throw new AppError('CLI_INPUT_REQUIRED',400,'Ejecutá en una terminal interactiva, o usá --stdin con una entrada segura. No se aceptan credenciales como argumentos.');
  let hidden=false;
  const output=new Writable({// Función write: implementa esta operación de la clase o del objeto.
/** Escribe los caracteres en la terminal y los oculta cuando se solicita una contraseña. */
write(chunk,_encoding,done){if(!hidden)stdout.write(chunk);done();}});
  const reader=createInterface({input:stdin,output,terminal:true,historySize:0});
  /** Solicita datos al operador y oculta la entrada cuando se introduce un secreto. */
async function ask(label:string,secret=false) {
    hidden=secret;if(secret)stdout.write(label);
    try{return await reader.question(secret?'':label);}finally{if(secret)stdout.write('\n');hidden=false;}
  }
  try {
    const firstName=await ask('Nombre: ');const lastName=await ask('Apellido: ');
    const email=await ask('Correo electrónico: ');const phone=await ask('Teléfono (opcional): ');
    const password=await ask('Contraseña (oculta): ',true);const repeat=await ask('Repetir contraseña (oculta): ',true);
    if(password!==repeat)throw new AppError('VALIDATION_ERROR',400,'Las contraseñas no coinciden.');
    return {firstName,lastName,email,phone,password};
  }finally{reader.close();output.end();}
}
void readInput().then(createFirstSuperAdmin).then(()=>console.info('Primer SUPER_ADMIN creado y activo. Iniciá sesión desde la pantalla habitual.'))
  .catch(error=>{console.error(error instanceof AppError?error.message:'No se pudo crear el primer SUPER_ADMIN. Revisá conexión y esquema, sin publicar credenciales.');process.exitCode=1;})
  .finally(()=>databasePool.end());
