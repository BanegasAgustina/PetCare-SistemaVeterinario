/** Intentos OAuth durables de un uso. La identidad se une por provider+subject, jamás por email. */
import { randomBytes,createHash } from 'node:crypto';
import type { RowDataPacket,PoolConnection } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { digest,opaqueToken } from './session.repository';
import { AppError } from '../utils/app-error';
import { runDatabaseOperation } from '../utils/database-error';
import type { OAuthProvider } from '../config/oauth';
import type { ProviderIdentity } from '../services/oauth-provider.service';
export type OAuthAttempt=RowDataPacket&{provider:OAuthProvider;proof_challenge:string;provider_verifier:string;return_url:string;link_user_id:string|null;link_session_version:number|null;link_family_id:string|null;identity_json:ProviderIdentity;consumed_at:string|null;expired:number};
export async function createAttempt(provider:OAuthProvider,challenge:string,returnUrl:string,link?:{id:string;version:number;family:string}){
  const state=randomBytes(32).toString('hex'),verifier=randomBytes(32).toString('base64url');
  await runDatabaseOperation(()=>databasePool.execute('INSERT INTO oauth_attempts(state_hash,provider,proof_challenge,provider_verifier,return_url,link_user_id,link_session_version,link_family_id,expires_at) VALUES (?,?,?,?,?,?,?,?,TIMESTAMPADD(MINUTE,10,UTC_TIMESTAMP(3)))',[digest(state),provider,challenge,verifier,returnUrl,link?.id??null,link?.version??null,link?.family??null]));return {state,verifier};
}
/** Reclama state antes del intercambio: dos callbacks no pueden consumir el mismo código. */
export async function claimCallback(provider:OAuthProvider,state:unknown):Promise<OAuthAttempt>{
  const hash=digest(opaqueToken(state));return runDatabaseOperation(async()=>{const c=await databasePool.getConnection();try{await c.beginTransaction();const [rows]=await c.execute<OAuthAttempt[]>('SELECT *,expires_at<=UTC_TIMESTAMP(3) AS expired FROM oauth_attempts WHERE state_hash=? FOR UPDATE',[hash]);const row=rows[0];
    if(!row||row.provider!==provider||row.expired||row.callback_used_at)throw new AppError('OAUTH_INVALID_STATE',400,'La solicitud OAuth venció o ya fue usada.');
    await c.execute('UPDATE oauth_attempts SET callback_used_at=UTC_TIMESTAMP(3) WHERE state_hash=?',[hash]);await c.commit();return row;
  }catch(e){await c.rollback();throw e;}finally{c.release();}});
}
export async function saveCallback(state:string,identity:ProviderIdentity):Promise<string>{
  const ticket=randomBytes(32).toString('hex');await runDatabaseOperation(()=>databasePool.execute("UPDATE oauth_attempts SET ticket_hash=?,identity_json=?,provider_verifier='',expires_at=TIMESTAMPADD(MINUTE,5,UTC_TIMESTAMP(3)) WHERE state_hash=?",[digest(ticket),JSON.stringify(identity),digest(state)]));return ticket;
}
/** Un ticket interceptado no basta: se exige el secreto que generó el dispositivo al iniciar. */
export async function withTicket<T>(ticket:unknown,proof:unknown,operation:(c:PoolConnection,a:OAuthAttempt)=>Promise<T>):Promise<T>{
  opaqueToken(ticket);if(typeof proof!=='string'||!/^[A-Za-z0-9_-]{43,128}$/.test(proof))throw new AppError('OAUTH_INVALID_PROOF',400,'La prueba OAuth no es válida.');const challenge=createHash('sha256').update(proof).digest('base64url');
  return runDatabaseOperation(async()=>{const c=await databasePool.getConnection();try{await c.beginTransaction();const [rows]=await c.execute<OAuthAttempt[]>('SELECT *,expires_at<=UTC_TIMESTAMP(3) AS expired FROM oauth_attempts WHERE ticket_hash=? FOR UPDATE',[digest(ticket as string)]);const row=rows[0];
    if(!row||row.expired||row.consumed_at||row.proof_challenge!==challenge||!row.identity_json)throw new AppError('OAUTH_INVALID_PROOF',401,'La solicitud OAuth venció o no pertenece a este dispositivo.');
    if(typeof row.identity_json==='string')row.identity_json=JSON.parse(row.identity_json);const result=await operation(c,row);await c.commit();return result;
  }catch(e){await c.rollback();throw e;}finally{c.release();}});
}
export async function consume(c:PoolConnection,ticket:string):Promise<void>{await c.execute('UPDATE oauth_attempts SET consumed_at=UTC_TIMESTAMP(3),identity_json=NULL WHERE ticket_hash=?',[digest(ticket)]);}
