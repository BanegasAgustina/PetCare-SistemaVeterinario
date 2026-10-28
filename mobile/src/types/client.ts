// Este archivo se encarga de lo siguiente: Tipos de TypeScript compartidos; describen la forma de los datos que maneja la app.

/**
 * Define mascotas, turnos, productos y registros reales de /client. Los valores nullable representan ausencia de un campo, sin crear entidades para completar la interfaz.
 */
// Tipo CatalogItem: define la forma o las opciones válidas de los datos usados por este módulo.
export type CatalogItem={id:string;name:string};
// Tipo PetSex: define la forma o las opciones válidas de los datos usados por este módulo.
export type PetSex='MALE'|'FEMALE'|'UNKNOWN';
// Tipo PetLifecycleEvent: define la forma o las opciones válidas de los datos usados por este módulo.
export type PetLifecycleEvent={id:string;previousIsActive:boolean;isActive:boolean;reason:string;createdAt:string;actorRole?:string;actorName?:string};
// Tipo Pet: define la forma o las opciones válidas de los datos usados por este módulo.
export type Pet={id:string;name:string;sex:PetSex|null;speciesId:string;species:string;breedId:string|null;breed:string|null;birthDate:string|null;microchipNumber:string|null;photoUrl:string|null;weightKg:string|null;isActive?:boolean|number|string|null;deactivationReason?:string|null;deactivatedAt?:string|null;lifecycleHistory?:PetLifecycleEvent[]};
// Tipo PetValues: define la forma o las opciones válidas de los datos usados por este módulo.
export type PetValues={name:string;sex:PetSex|'';speciesId:string;breedId:string;breedName?:string;birthDate:string;microchipNumber:string;photoUrl:string;weightKg:string;photoBase64?:string};
// Tipo PetCatalog: define la forma o las opciones válidas de los datos usados por este módulo.
export type PetCatalog={species:CatalogItem[];breeds:(CatalogItem&{speciesId:string})[]};
// Tipo Appointment: define la forma o las opciones válidas de los datos usados por este módulo.
export type Appointment={id:string;status:string;isUpcoming:boolean;petId:string;petName:string;petPhotoUrl?:string|null;startsAt:string;endsAt:string;service:string;veterinarian:string;ownerName?:string;observations?:string|null;cancellationReason?:string|null};
// Tipo AppointmentCatalog: define la forma o las opciones válidas de los datos usados por este módulo.
export type AppointmentCatalog={types:(CatalogItem&{isClinical?:boolean|number})[];services:(CatalogItem&{specialtyId:string|null;typeId:string;description?:string|null;imageUrl?:string|null;durationMinutes?:number|null;priceCents?:number|null;isActive?:boolean|number})[];specialties:CatalogItem[];veterinarians:(CatalogItem&{typeId:string;isClinical?:boolean|number;isActive?:boolean|number;specialties?:string|null;profilePhotoUrl:string|null})[];assignments:{professionalId:string;serviceId:string}[]};
// Tipo Slot: define la forma o las opciones válidas de los datos usados por este módulo.
export type Slot={id:string;startsAt:string;endsAt:string;veterinarianId:string;veterinarian:string};
// Tipo ClinicalKind: define la forma o las opciones válidas de los datos usados por este módulo.
export type ClinicalKind='medical-history'|'vaccines'|'prescriptions'|'recommendations';
// Tipo ClinicalRecord: define la forma o las opciones válidas de los datos usados por este módulo.
export type ClinicalRecord={isValid?:boolean;productId?:string|null;productName?:string|null;validUntil?:string|null;dose?:string|null;frequency?:string|null;duration?:string|null;reason?:string|null;diagnosis?:string|null;treatment?:string|null;weightKg?:string|null;id:string;petId:string;petName:string;title:string;content:string;occurredAt:string;nextDueAt:string|null;veterinarian:string};
// El producto incluye su tipo y origen persistidos para separar medicamentos reservables de accesorios externos.
// Tipo Product: define la forma o las opciones válidas de los datos usados por este módulo.
export type Product={requiresPrescription:boolean;speciesId:string|null;productType:'GENERAL'|'MEDICINE'|'ACCESSORY';id:string;name:string;description:string|null;imageUrl:string|null;categoryId:string|null;category:string|null;stock:number;isActive:boolean;priceCents:number;regularPriceCents:number};
// Tipo PromotionBanner: define la forma o las opciones válidas de los datos usados por este módulo.
export type PromotionBanner=Product&{promotionName:string;bannerImageUrl?:string|null;bannerSubtitle:string|null;bannerCtaText:string};
// Tipo StoreBanner: define la forma o las opciones válidas de los datos usados por este módulo.
export type StoreBanner={id:string;title:string|null;subtitle:string|null;description:string|null;mobileImageUrl:string;desktopImageUrl:string|null;backgroundColor:string;textColor:string;contentAlignment:'LEFT'|'CENTER'|'RIGHT';darkOverlay:boolean;destinationType:'PRODUCT'|'CATEGORY'|'PROMOTION'|'PRODUCT_LIST'|'INFO';destinationId:string|null;targetProductId:string|null;ctaText:string|null;sortOrder:number;isActive:boolean;startsAt:string|null;endsAt:string|null};
// Tipo CartItem: define la forma o las opciones válidas de los datos usados por este módulo.
export type CartItem=Product&{quantity:number;subtotalCents:number};
// Tipo Cart: define la forma o las opciones válidas de los datos usados por este módulo.
export type Cart={items:CartItem[];totalCents:number};
// Tipo DeliveryZone: define la forma o las opciones válidas de los datos usados por este módulo.
export type DeliveryZone={id:string;name:string;province:string;city:string;postalCodePrefix:string|null;feeCents:number|null;isActive:boolean};
// Tipo FulfillmentSettings: define la forma o las opciones válidas de los datos usados por este módulo.
export type FulfillmentSettings={demoModeEnabled:boolean;pickupEnabled:boolean;pickupAddress:string|null;pickupHours:string|null;pickupInstructions:string|null;deliveryEnabled:boolean;deliveryBaseFeeCents:number;freeDeliveryThresholdCents:number|null;deliveryHours:string|null;deliveryDays:string|null;deliveryInformation:string|null;bankName:string|null;bankAccountHolder:string|null;bankCbuCvu:string|null;bankAlias:string|null;zones:DeliveryZone[]};
// Tipo DeliveryQuote: define la forma o las opciones válidas de los datos usados por este módulo.
export type DeliveryQuote={available:boolean;feeCents:number;reason:'delivery_disabled'|'outside_zone'|null;zoneName:string|null};
// Tipo DeliveryAddress: define la forma o las opciones válidas de los datos usados por este módulo.
export type DeliveryAddress={id:string;label:string;recipientName:string;phone:string;street:string;streetNumber:string;unit:string|null;city:string;province:string;postalCode:string;reference:string|null};
// Tipo Order: define la forma o las opciones válidas de los datos usados por este módulo.
export type Order={id:string;status:string;orderType:'RESERVATION'|'DEMO_PURCHASE'|'STORE_PURCHASE';paymentStatus:'NOT_APPLICABLE'|'DEMO_NOT_PAID'|'PAID'|'PENDING_VERIFICATION'|'PAYMENT_FAILED';isStoreOrder:boolean;storeOrderStatus:string|null;storePaymentStatus:string;paymentMethod:string|null;fulfillmentMethod:'PICKUP'|'DELIVERY'|null;deliveryStatus:string;subtotalCents:number|null;deliveryFeeCents:number;recipientName:string|null;deliveryStreet:string|null;deliveryNumber:string|null;deliveryUnit:string|null;deliveryCity:string|null;deliveryProvince:string|null;deliveryPostalCode:string|null;totalCents:number;createdAt:string};
// Tipo OrderDetail: define la forma o las opciones válidas de los datos usados por este módulo.
export type OrderDetail=Order&{recipientPhone:string|null;deliveryReference:string|null;paymentReference:string|null;paymentIntentId:string|null;paymentExpiresAt:string|null;paymentIntentStatus:'ACTIVE'|'EXPIRED'|null;paymentProofLate:boolean;paymentReviewStatus:string|null;proofSubmittedAt:string|null;items:{productId:string;name:string;quantity:number;priceCents:number;subtotalCents:number}[]};
// Tipo Notification: define la forma o las opciones válidas de los datos usados por este módulo.
export type Notification={id:string;title:string;body:string;eventType:string;referenceType:string|null;referenceId:string|null;readAt:string|null;createdAt:string};
// Tipo NotificationPage: define la forma o las opciones válidas de los datos usados por este módulo.
export type NotificationPage={items:Notification[];nextCursor:string|null;unreadCount:number};
// Tipo Home: define la forma o las opciones válidas de los datos usados por este módulo.
export type Home={pets:Pet[];nextAppointment:Appointment|null;nextAppointments?:Appointment[];featuredProducts:Product[];unreadNotifications:number};
