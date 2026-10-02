import bcrypt from 'bcrypt';
import * as repository from '../repositories/client.repository';
import { findUserById } from '../repositories/user.repository';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';
import { readName,readPhone,readPassword } from '../validators/auth.validator';
import { clientBody,clientId,petInput,cartQuantity,requestKey,text,invalid } from '../validators/client.validator';
export const clinicalKinds=['medical-history','vaccines','prescriptions','recommendations'] as const;
export async function clientOperation(owner:string,operation:string,id:unknown,body:unknown,query:Record<string,unknown>) {
  return runDatabaseOperation(async()=>{
    switch(operation){
      case 'home': {const [pets,appointments,products,notifications]=await Promise.all([repository.pets(owner),repository.appointments(owner),repository.products('',undefined,true),repository.notifications(owner)]);
        return {pets,nextAppointment:appointments.filter(a=>a.isUpcoming).sort((a,b)=>a.startsAt.localeCompare(b.startsAt))[0]??null,featuredProducts:products,unreadNotifications:notifications.filter(n=>!n.readAt).length};}
      case 'pets':return repository.pets(owner);
      case 'pet-catalog':return repository.petCatalog();
      case 'pet':return repository.pet(owner,clientId(id));
      case 'create-pet':return repository.savePet(owner,petInput(body));
      case 'update-pet':return repository.savePet(owner,petInput(body),clientId(id));
      case 'deactivate-pet':clientBody(body,[]);return repository.deactivatePet(owner,clientId(id));
      case 'appointments':return repository.appointments(owner);
      case 'appointment-catalog':return repository.appointmentCatalog();
      case 'slots':return repository.slots(clientId(query.serviceId),query.veterinarianId?clientId(query.veterinarianId):undefined);
      case 'create-appointment': {const values=clientBody(body,['petId','slotId']);return repository.createAppointment(owner,clientId(values.petId),clientId(values.slotId));}
      case 'clinical': {if(!clinicalKinds.includes(String(id) as typeof clinicalKinds[number]))invalid();return repository.clinical(owner,String(id),query.petId?clientId(query.petId):undefined);}
      case 'products':return repository.products(text(query.search,200,true)??'',query.categoryId?clientId(query.categoryId):undefined);
      case 'categories':return repository.categories();
      case 'product':return repository.product(clientId(id));
      case 'cart':return repository.cart(owner);
      case 'cart-update':{const values=clientBody(body,['quantity']);return repository.updateCart(owner,clientId(id),cartQuantity(values.quantity));}
      case 'orders':return repository.orders(owner);
      case 'order':return repository.order(owner,clientId(id));
      case 'checkout':{const values=clientBody(body,['requestKey']);return repository.checkout(owner,requestKey(values.requestKey));}
      case 'notifications':return repository.notifications(owner);
      case 'notification-read':clientBody(body,[]);return repository.readNotification(owner,clientId(id));
      case 'profile-update':{const values=clientBody(body,['firstName','lastName','phone']);return repository.updateProfile(owner,readName(values.firstName,'El nombre'),readName(values.lastName,'El apellido'),readPhone(values.phone));}
      case 'password-update':{const values=clientBody(body,['currentPassword','password']);const current=readPassword(values.currentPassword,false);const password=readPassword(values.password,true);
        const user=await findUserById(owner);if(!user||!await bcrypt.compare(current,user.passwordHash))throw new AppError('CURRENT_PASSWORD_INVALID',400,'La contraseña actual no es correcta.');
        return repository.changePassword(owner,user.passwordHash,await bcrypt.hash(password,env.bcryptSaltRounds));}
      default:throw new AppError('NOT_FOUND',404,'Recurso no encontrado.');
    }
  });
}
