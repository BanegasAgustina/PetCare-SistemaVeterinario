/**
 * ARCHIVO: client.ts
 * UBICACIÓN: mobile/src/types/client.ts
 * FUNCIÓN: Tipos y contratos TypeScript.
 * RESPONSABILIDAD: Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de client.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/ClinicalScreen.tsx, mobile/src/components/client/PetEditor.tsx y 7 más
 * FUNCIONAMIENTO: Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Define mascotas, turnos, productos y registros reales de /client. Los valores nullable representan ausencia de un campo, sin crear entidades para completar la interfaz.
 */
/** Elemento identificable de un catálogo remoto. */
export type CatalogItem={id:string;name:string};
/** Valores de sexo que acepta el formulario y la API de mascotas. */
export type PetSex='MALE'|'FEMALE'|'UNKNOWN';
/** Evento del historial de activación/desactivación de una mascota. */
export type PetLifecycleEvent={id:string;previousIsActive:boolean;isActive:boolean;reason:string;createdAt:string;actorRole?:string;actorName?:string};
/** Mascota presentada por API, incluyendo estado/historial opcional de ciclo de vida. */
export type Pet={id:string;name:string;sex:PetSex|null;speciesId:string;species:string;breedId:string|null;breed:string|null;birthDate:string|null;microchipNumber:string|null;photoUrl:string|null;weightKg:string|null;isActive?:boolean|number|string|null;deactivationReason?:string|null;deactivatedAt?:string|null;lifecycleHistory?:PetLifecycleEvent[]};
/** Valores editables en PetEditor; los campos de selección vacíos conservan forma de formulario. */
export type PetValues={name:string;sex:PetSex|'';speciesId:string;breedId:string;breedName?:string;birthDate:string;microchipNumber:string;photoUrl:string;weightKg:string};
/** Especies y razas disponibles; cada raza indica su especie asociada. */
export type PetCatalog={species:CatalogItem[];breeds:(CatalogItem&{speciesId:string})[]};
/** Turno presentado a cliente o profesional; campos opcionales reflejan datos que la API puede ocultar por rol. */
export type Appointment={id:string;status:string;isUpcoming:boolean;petId:string;petName:string;petPhotoUrl?:string|null;startsAt:string;endsAt:string;service:string;veterinarian:string;ownerName?:string;observations?:string|null;cancellationReason?:string|null};
/** Tipos, servicios, profesionales, especialidades y asignaciones que alimentan el selector de turnos. */
export type AppointmentCatalog={types:(CatalogItem&{isClinical?:boolean|number})[];services:(CatalogItem&{specialtyId:string|null;typeId:string;description?:string|null;imageUrl?:string|null;durationMinutes?:number|null;priceCents?:number|null;isActive?:boolean|number})[];specialties:CatalogItem[];veterinarians:(CatalogItem&{typeId:string;isClinical?:boolean|number;isActive?:boolean|number;specialties?:string|null;profilePhotoUrl:string|null})[];assignments:{professionalId:string;serviceId:string}[]};
/** Horario reservable devuelto para un servicio y profesional. */
export type Slot={id:string;startsAt:string;endsAt:string;veterinarianId:string;veterinarian:string};
/** Secciones de ficha clínica que el cliente puede consultar. */
export type ClinicalKind='medical-history'|'vaccines'|'prescriptions'|'recommendations';
/** Registro clínico mostrado al responsable, con datos opcionales específicos de receta o vacunación. */
export type ClinicalRecord={isValid?:boolean;productId?:string|null;productName?:string|null;validUntil?:string|null;dose?:string|null;frequency?:string|null;duration?:string|null;reason?:string|null;diagnosis?:string|null;treatment?:string|null;weightKg?:string|null;id:string;petId:string;petName:string;title:string;content:string;occurredAt:string;nextDueAt:string|null;veterinarian:string};
// El producto incluye su tipo y origen persistidos para separar medicamentos reservables de accesorios externos.
/** Producto de tienda, con stock disponible y metadatos necesarios para receta/especie/precio. */
export type Product={requiresPrescription:boolean;speciesId:string|null;productType:'GENERAL'|'MEDICINE'|'ACCESSORY';id:string;name:string;description:string|null;imageUrl:string|null;categoryId:string|null;category:string|null;stock:number;isActive:boolean;priceCents:number;regularPriceCents:number};
/** Producto publicado en promoción junto con texto e imagen de presentación. */
export type PromotionBanner=Product&{promotionName:string;bannerImageUrl?:string|null;bannerSubtitle:string|null;bannerCtaText:string};
/** Banner comercial y destino tipado para que la UI no ejecute enlaces arbitrarios. */
export type StoreBanner={id:string;title:string|null;subtitle:string|null;description:string|null;mobileImageUrl:string;desktopImageUrl:string|null;backgroundColor:string;textColor:string;contentAlignment:'LEFT'|'CENTER'|'RIGHT';darkOverlay:boolean;destinationType:'PRODUCT'|'CATEGORY'|'PROMOTION'|'PRODUCT_LIST'|'INFO';destinationId:string|null;targetProductId:string|null;ctaText:string|null;sortOrder:number;isActive:boolean;startsAt:string|null;endsAt:string|null};
/** Producto del carrito con cantidad y subtotal ya calculados por la API. */
export type CartItem=Product&{quantity:number;subtotalCents:number};
/** Carrito actual y suma de sus líneas en centavos. */
export type Cart={items:CartItem[];totalCents:number};
/** Zona configurada para cotizar envíos, con filtro postal y tarifa opcional. */
export type DeliveryZone={id:string;name:string;province:string;city:string;postalCodePrefix:string|null;feeCents:number|null;isActive:boolean};
/** Configuración de retiro/envío y datos informativos de transferencia devueltos por la API. */
export type FulfillmentSettings={demoModeEnabled:boolean;pickupEnabled:boolean;pickupAddress:string|null;pickupHours:string|null;pickupInstructions:string|null;deliveryEnabled:boolean;deliveryBaseFeeCents:number;freeDeliveryThresholdCents:number|null;deliveryHours:string|null;deliveryDays:string|null;deliveryInformation:string|null;bankName:string|null;bankAccountHolder:string|null;bankCbuCvu:string|null;bankAlias:string|null;zones:DeliveryZone[]};
/** Resultado de cobertura y tarifa; reason identifica por qué una dirección no está disponible. */
export type DeliveryQuote={available:boolean;feeCents:number;reason:'delivery_disabled'|'outside_zone'|null;zoneName:string|null};
/** Dirección guardada para completar una entrega, separada de la configuración de tienda. */
export type DeliveryAddress={id:string;label:string;recipientName:string;phone:string;street:string;streetNumber:string;unit:string|null;city:string;province:string;postalCode:string;reference:string|null};
/** Resumen de pedido con estados comerciales, pago, entrega e importes en centavos. */
export type Order={id:string;status:string;orderType:'RESERVATION'|'DEMO_PURCHASE'|'STORE_PURCHASE';paymentStatus:'NOT_APPLICABLE'|'DEMO_NOT_PAID'|'PAID'|'PENDING_VERIFICATION'|'PAYMENT_FAILED';isStoreOrder:boolean;storeOrderStatus:string|null;storePaymentStatus:string;paymentMethod:string|null;fulfillmentMethod:'PICKUP'|'DELIVERY'|null;deliveryStatus:string;subtotalCents:number|null;deliveryFeeCents:number;recipientName:string|null;deliveryStreet:string|null;deliveryNumber:string|null;deliveryUnit:string|null;deliveryCity:string|null;deliveryProvince:string|null;deliveryPostalCode:string|null;totalCents:number;createdAt:string};
/** Pedido ampliado con artículos, intención de pago y metadatos de comprobante/revisión. */
export type OrderDetail=Order&{recipientPhone:string|null;deliveryReference:string|null;paymentReference:string|null;paymentIntentId:string|null;paymentExpiresAt:string|null;paymentIntentStatus:'ACTIVE'|'EXPIRED'|null;paymentProofLate:boolean;paymentReviewStatus:string|null;proofSubmittedAt:string|null;items:{productId:string;name:string;quantity:number;priceCents:number;subtotalCents:number}[]};
/** Notificación interna persistida, con vínculo opcional a una entidad y estado de lectura. */
export type Notification={id:string;title:string;body:string;eventType:string;referenceType:string|null;referenceId:string|null;readAt:string|null;createdAt:string};
/** Página cursorada del centro de notificaciones y su contador de no leídas. */
export type NotificationPage={items:Notification[];nextCursor:string|null;unreadCount:number};
/** Datos agregados para el inicio del cliente. */
export type Home={pets:Pet[];nextAppointment:Appointment|null;nextAppointments?:Appointment[];featuredProducts:Product[];unreadNotifications:number};
