/**
 * Define mascotas, turnos, productos y registros reales de /client. Los valores nullable representan ausencia de un campo, sin crear entidades para completar la interfaz.
 */
export type CatalogItem={id:string;name:string};
export type Pet={id:string;name:string;speciesId:string;species:string;breedId:string|null;breed:string|null;birthDate:string|null;microchipNumber:string|null;photoUrl:string|null;weightKg:string|null};
export type PetValues={name:string;speciesId:string;breedId:string;breedName?:string;birthDate:string;microchipNumber:string;photoUrl:string;weightKg:string;photoBase64?:string};
export type PetCatalog={species:CatalogItem[];breeds:(CatalogItem&{speciesId:string})[]};
export type Appointment={id:string;status:string;isUpcoming:boolean;petId:string;petName:string;startsAt:string;endsAt:string;service:string;veterinarian:string};
export type AppointmentCatalog={types:CatalogItem[];services:(CatalogItem&{specialtyId:string|null;typeId:string})[];specialties:CatalogItem[];veterinarians:(CatalogItem&{typeId:string})[];assignments:{professionalId:string;serviceId:string}[]};
export type Slot={id:string;startsAt:string;endsAt:string;veterinarianId:string;veterinarian:string};
export type ClinicalKind='medical-history'|'vaccines'|'prescriptions'|'recommendations';
export type ClinicalRecord={isValid?:boolean;productId?:string|null;validUntil?:string|null;reason?:string|null;diagnosis?:string|null;treatment?:string|null;weightKg?:string|null;id:string;petId:string;petName:string;title:string;content:string;occurredAt:string;nextDueAt:string|null;veterinarian:string};
export type Product={requiresPrescription:boolean;speciesId:string|null;reservationKey?:string;id:string;name:string;description:string|null;imageUrl:string|null;categoryId:string|null;category:string|null;stock:number;isActive:boolean;priceCents:number;regularPriceCents:number};
export type CartItem=Product&{quantity:number;subtotalCents:number};
export type Cart={items:CartItem[];totalCents:number;checkoutKey:string};
export type Order={id:string;status:string;totalCents:number;createdAt:string};
export type OrderDetail=Order&{items:{productId:string;name:string;quantity:number;priceCents:number;subtotalCents:number}[]};
export type Notification={id:string;title:string;body:string;readAt:string|null;createdAt:string};
export type Home={pets:Pet[];nextAppointment:Appointment|null;featuredProducts:Product[];unreadNotifications:number};
