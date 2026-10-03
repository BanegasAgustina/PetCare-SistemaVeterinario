/** Servicios comparten repositories: cliente, profesional y secretaría leen las mismas filas. */
import type { AuthUser } from '../types/auth';
import * as client from '../repositories/client.repository';
import * as clinic from '../repositories/clinic.repository';
import * as reservations from '../repositories/reservation.repository';
import * as admin from '../repositories/clinic-admin.repository';
import * as v from '../validators/clinic.validator';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
export async function clinicOperation(actor:AuthUser,operation:string,id:unknown,value:unknown,query:Record<string,unknown>,kind?:string) {
 return runDatabaseOperation(async()=>{switch(operation){
 case 'slots':return clinic.slots(v.id(query.serviceId),query.professionalId?v.id(query.professionalId):undefined);
 case 'products':clinic.permit(actor,actor.permissions?.includes('prescriptions.create')?'prescriptions.create':'products.view');return client.products(v.text(query.search,100,true)??'');
 case 'appointment':{const results=await clinic.appointments(actor,{id:v.id(id)});if(!results[0])throw new AppError('NOT_FOUND',404,'Turno no encontrado.');return results[0];}
 case 'home':return clinic.home(actor);
 case 'catalog':return clinic.catalog(actor);
 case 'appointments':return clinic.appointments(actor,query);
 case 'appointment-update':return clinic.changeAppointment(actor,v.id(id),value);
 case 'patient':return clinic.patient(actor,v.id(id));
 case 'patients':return clinic.patients(actor,v.text(query.search,100,true)??'');
 case 'clinical':return clinic.clinical(actor,v.id(id),kind!);
 case 'clinical-create':return clinic.saveClinical(actor,v.id(id),kind!,value);
 case 'clients':return clinic.clients(actor,v.text(query.search,100,true)??'');
 case 'client':return clinic.clientDetails(actor,v.id(id));
 case 'reservations':return reservations.list(actor,query);
 case 'reservation':return reservations.detail(actor,v.id(id));
 case 'reservation-create':return reservations.create(actor,value);
 case 'reservation-update':return reservations.change(actor,v.id(id),value);
 case 'professionals':admin.administrative(actor);clinic.permit(actor,'professionals.manage');return clinic.professionals();
 case 'professional-type':return admin.assignType(actor,v.id(id),value);
 case 'professional-services':return admin.assignServices(actor,v.id(id),value);
 case 'admin-list':return admin.list(actor,admin.entity(kind!),query);
 case 'admin-save':return admin.save(actor,admin.entity(kind!),id===undefined?undefined:v.id(id),value);
 case 'availability':return admin.availability(actor,query);
 case 'availability-save':return admin.saveAvailability(actor,value);
 case 'availability-disable':return admin.disableAvailability(actor,kind!,v.id(id));
 default:v.invalid();
 }});
}
