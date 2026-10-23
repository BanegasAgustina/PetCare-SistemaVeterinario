/**
 * Define mascotas, turnos, productos y registros reales de /client. Los valores nullable representan ausencia de un campo, sin crear entidades para completar la interfaz.
 */
export type CatalogItem={id:string;name:string};
export type PetSex='MALE'|'FEMALE'|'UNKNOWN';
export type Pet={id:string;name:string;sex:PetSex|null;speciesId:string;species:string;breedId:string|null;breed:string|null;birthDate:string|null;microchipNumber:string|null;photoUrl:string|null;weightKg:string|null;isActive?:boolean};
export type PetValues={name:string;sex:PetSex|'';speciesId:string;breedId:string;breedName?:string;birthDate:string;microchipNumber:string;photoUrl:string;weightKg:string;photoBase64?:string};
export type PetCatalog={species:CatalogItem[];breeds:(CatalogItem&{speciesId:string})[]};
export type Appointment={id:string;status:string;isUpcoming:boolean;petId:string;petName:string;petPhotoUrl?:string|null;startsAt:string;endsAt:string;service:string;veterinarian:string};
export type AppointmentCatalog={types:(CatalogItem&{isClinical?:boolean|number})[];services:(CatalogItem&{specialtyId:string|null;typeId:string;description?:string|null;durationMinutes?:number|null;priceCents?:number|null;isActive?:boolean|number})[];specialties:CatalogItem[];veterinarians:(CatalogItem&{typeId:string;isClinical?:boolean|number;isActive?:boolean|number;specialties?:string|null;profilePhotoUrl:string|null})[];assignments:{professionalId:string;serviceId:string}[]};
export type Slot={id:string;startsAt:string;endsAt:string;veterinarianId:string;veterinarian:string};
export type ClinicalKind='medical-history'|'vaccines'|'prescriptions'|'recommendations';
export type ClinicalRecord={isValid?:boolean;productId?:string|null;productName?:string|null;validUntil?:string|null;dose?:string|null;frequency?:string|null;duration?:string|null;reason?:string|null;diagnosis?:string|null;treatment?:string|null;weightKg?:string|null;id:string;petId:string;petName:string;title:string;content:string;occurredAt:string;nextDueAt:string|null;veterinarian:string};
// El producto incluye su tipo y origen persistidos para separar medicamentos reservables de accesorios externos.
export type Product={requiresPrescription:boolean;speciesId:string|null;productType:'GENERAL'|'MEDICINE'|'ACCESSORY';id:string;name:string;description:string|null;imageUrl:string|null;categoryId:string|null;category:string|null;stock:number;isActive:boolean;priceCents:number;regularPriceCents:number};
export type PromotionBanner=Product&{promotionName:string;bannerImageUrl?:string|null;bannerSubtitle:string|null;bannerCtaText:string};
export type StoreBanner={id:string;title:string|null;subtitle:string|null;description:string|null;mobileImageUrl:string;desktopImageUrl:string|null;backgroundColor:string;textColor:string;contentAlignment:'LEFT'|'CENTER'|'RIGHT';darkOverlay:boolean;destinationType:'PRODUCT'|'CATEGORY'|'PROMOTION'|'PRODUCT_LIST'|'INFO';destinationId:string|null;targetProductId:string|null;ctaText:string|null;sortOrder:number;isActive:boolean;startsAt:string|null;endsAt:string|null};
export type CartItem=Product&{quantity:number;subtotalCents:number};
export type Cart={items:CartItem[];totalCents:number};
export type DeliveryZone={id:string;name:string;province:string;city:string;postalCodePrefix:string|null;feeCents:number|null;isActive:boolean};
export type FulfillmentSettings={demoModeEnabled:boolean;pickupEnabled:boolean;pickupAddress:string|null;pickupHours:string|null;pickupInstructions:string|null;deliveryEnabled:boolean;deliveryBaseFeeCents:number;freeDeliveryThresholdCents:number|null;deliveryHours:string|null;deliveryDays:string|null;deliveryInformation:string|null;bankName:string|null;bankAccountHolder:string|null;bankCbuCvu:string|null;bankAlias:string|null;zones:DeliveryZone[]};
export type DeliveryQuote={available:boolean;feeCents:number;reason:'delivery_disabled'|'outside_zone'|null;zoneName:string|null};
export type DeliveryAddress={id:string;label:string;recipientName:string;phone:string;street:string;streetNumber:string;unit:string|null;city:string;province:string;postalCode:string;reference:string|null};
export type Order={id:string;status:string;orderType:'RESERVATION'|'DEMO_PURCHASE'|'STORE_PURCHASE';paymentStatus:'NOT_APPLICABLE'|'DEMO_NOT_PAID'|'PAID'|'PENDING_VERIFICATION'|'PAYMENT_FAILED';isStoreOrder:boolean;storeOrderStatus:string|null;storePaymentStatus:string;paymentMethod:string|null;fulfillmentMethod:'PICKUP'|'DELIVERY'|null;deliveryStatus:string;subtotalCents:number|null;deliveryFeeCents:number;recipientName:string|null;deliveryStreet:string|null;deliveryNumber:string|null;deliveryUnit:string|null;deliveryCity:string|null;deliveryProvince:string|null;deliveryPostalCode:string|null;totalCents:number;createdAt:string};
export type OrderDetail=Order&{recipientPhone:string|null;deliveryReference:string|null;paymentReference:string|null;paymentIntentId:string|null;paymentExpiresAt:string|null;paymentIntentStatus:'ACTIVE'|'EXPIRED'|null;paymentProofLate:boolean;paymentReviewStatus:string|null;proofSubmittedAt:string|null;items:{productId:string;name:string;quantity:number;priceCents:number;subtotalCents:number}[]};
export type Notification={id:string;title:string;body:string;eventType:string;referenceType:string|null;referenceId:string|null;readAt:string|null;createdAt:string};
export type NotificationPage={items:Notification[];nextCursor:string|null;unreadCount:number};
export type NotificationPreferences={pushEnabled:boolean;appointmentRemindersEnabled:boolean;orderUpdatesEnabled:boolean};
export type Home={pets:Pet[];nextAppointment:Appointment|null;nextAppointments?:Appointment[];featuredProducts:Product[];unreadNotifications:number};
