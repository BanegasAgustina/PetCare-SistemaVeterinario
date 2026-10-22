/** Configuración de retiro y envío. No crea pedidos ni reserva stock. */
import type { RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import type { AuthUser } from '../types/auth';
import { databasePool } from '../config/database';
import * as clinic from './clinic.repository';
import * as productsRepository from './client.repository';
import * as v from '../validators/clinic.validator';
import { isBannerPhotoKey } from '../services/pet-photo.service';
import { assertAdminPermission } from '../utils/admin-authorization';
import { AppError } from '../utils/app-error';
import { DatabaseError, runDatabaseOperation } from '../utils/database-error';
import { env } from '../config/env';

export type DeliveryZone = { id: string; name: string; province: string; city: string; postalCodePrefix: string | null; feeCents: number | null; isActive: boolean };
export type FulfillmentSettings = { demoModeEnabled:boolean;pickupEnabled: boolean; pickupAddress: string | null; pickupHours: string | null; pickupInstructions: string | null; deliveryEnabled: boolean; deliveryBaseFeeCents: number; freeDeliveryThresholdCents: number | null; deliveryHours: string | null; deliveryDays: string | null; deliveryInformation: string | null; bankName: string | null; bankAccountHolder: string | null; bankCbuCvu: string | null; bankAlias: string | null; zones: DeliveryZone[] };
export type PromotionBanner = { id:string;name:string;description:string|null;imageUrl:string|null;categoryId:string|null;category:string|null;stock:number;isActive:boolean;priceCents:number;regularPriceCents:number;requiresPrescription:boolean;speciesId:string|null;productType:'GENERAL'|'MEDICINE'|'ACCESSORY';promotionName:string;bannerSubtitle:string|null;bannerCtaText:string };
export type StoreBanner={id:string;title:string|null;subtitle:string|null;description:string|null;mobileImageUrl:string;desktopImageUrl:string|null;backgroundColor:string;textColor:string;contentAlignment:'LEFT'|'CENTER'|'RIGHT';darkOverlay:boolean;destinationType:'PRODUCT'|'CATEGORY'|'PROMOTION'|'PRODUCT_LIST'|'INFO';destinationId:string|null;targetProductId:string|null;ctaText:string|null;sortOrder:number;isActive:boolean;startsAt:string|null;endsAt:string|null};

export async function publicBanners():Promise<StoreBanner[]> {
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT CAST(b.id AS CHAR) AS id,b.title,b.subtitle,b.description,b.mobile_image_url AS mobileImageUrl,b.desktop_image_url AS desktopImageUrl,
    b.background_color AS backgroundColor,b.text_color AS textColor,b.content_alignment AS contentAlignment,b.dark_overlay AS darkOverlay,
    b.destination_type AS destinationType,CAST(b.destination_id AS CHAR) AS destinationId,CAST(COALESCE(p.id,pr.product_id) AS CHAR) AS targetProductId,b.cta_text AS ctaText,b.sort_order AS sortOrder,b.is_active AS isActive,
    b.starts_at AS startsAt,b.ends_at AS endsAt FROM client_store_banners b
    LEFT JOIN client_products p ON b.destination_type='PRODUCT' AND p.id=b.destination_id AND p.is_active=1
    LEFT JOIN client_product_categories pc ON pc.id=p.category_id AND pc.is_active=1
    LEFT JOIN client_product_categories c ON b.destination_type='CATEGORY' AND c.id=b.destination_id AND c.is_active=1
    LEFT JOIN client_promotions pr ON b.destination_type='PROMOTION' AND pr.id=b.destination_id AND pr.is_active=1 AND pr.starts_at<=UTC_TIMESTAMP() AND pr.ends_at>UTC_TIMESTAMP()
    WHERE b.is_active=1 AND (b.starts_at IS NULL OR b.starts_at<=UTC_TIMESTAMP()) AND (b.ends_at IS NULL OR b.ends_at>UTC_TIMESTAMP())
      AND (b.destination_type NOT IN ('PRODUCT','CATEGORY','PROMOTION') OR p.id IS NOT NULL AND (p.category_id IS NULL OR pc.id IS NOT NULL) OR c.id IS NOT NULL OR pr.id IS NOT NULL AND EXISTS(SELECT 1 FROM client_products pp WHERE pp.id=pr.product_id AND pp.is_active=1))
    ORDER BY b.sort_order,b.id LIMIT 30`);
  return rows.map(row=>({...row,id:String(row.id),destinationId:row.destinationId===null?null:String(row.destinationId),targetProductId:row.targetProductId===null?null:String(row.targetProductId),darkOverlay:Boolean(row.darkOverlay),isActive:Boolean(row.isActive),sortOrder:Number(row.sortOrder)})) as StoreBanner[];
}

export async function adminBanners(actor:AuthUser):Promise<{items:StoreBanner[];products:{id:string;name:string}[];categories:{id:string;name:string}[];promotions:{id:string;name:string}[]}> {
  clinic.permit(actor,'store.banners.manage');
  const [[rows],[products],[categories],[promotions]]=await Promise.all([
    databasePool.execute<RowDataPacket[]>(`SELECT CAST(id AS CHAR) AS id,title,subtitle,description,mobile_image_url AS mobileImageUrl,desktop_image_url AS desktopImageUrl,
    background_color AS backgroundColor,text_color AS textColor,content_alignment AS contentAlignment,dark_overlay AS darkOverlay,
    destination_type AS destinationType,CAST(destination_id AS CHAR) AS destinationId,cta_text AS ctaText,sort_order AS sortOrder,is_active AS isActive,
    starts_at AS startsAt,ends_at AS endsAt FROM client_store_banners ORDER BY sort_order,id`),
    databasePool.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) AS id,name FROM client_products WHERE is_active=1 ORDER BY name,id LIMIT 1000'),
    databasePool.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) AS id,name FROM client_product_categories WHERE is_active=1 ORDER BY name,id LIMIT 500'),
    databasePool.execute<RowDataPacket[]>(`SELECT CAST(pr.id AS CHAR) AS id,CONCAT(pr.name,' · ',p.name) AS name FROM client_promotions pr JOIN client_products p ON p.id=pr.product_id WHERE p.is_active=1 ORDER BY pr.starts_at DESC,pr.id DESC LIMIT 1000`),
  ]);
  const items=rows.map(row=>({...row,id:String(row.id),destinationId:row.destinationId===null?null:String(row.destinationId),targetProductId:null,darkOverlay:Boolean(row.darkOverlay),isActive:Boolean(row.isActive),sortOrder:Number(row.sortOrder)})) as StoreBanner[];
  return {items,products:products.map(row=>({id:String(row.id),name:String(row.name)})),categories:categories.map(row=>({id:String(row.id),name:String(row.name)})),promotions:promotions.map(row=>({id:String(row.id),name:String(row.name)}))};
}

export async function saveBanner(actor:AuthUser,rawId:unknown,value:unknown) {
  const id=rawId===undefined?null:v.id(rawId);
  const body=v.body(value,['title','subtitle','description','mobileImageUrl','desktopImageUrl','backgroundColor','textColor','contentAlignment','darkOverlay','destinationType','destinationId','ctaText','sortOrder','isActive','startsAt','endsAt']);
  const title=v.text(typeof body.title==='string'?body.title.trim():body.title,160,true);const subtitle=v.text(body.subtitle,250,true)??null;const description=v.text(body.description,5000,true)??null;
  const mobileImage=v.imageUrl(body.mobileImageUrl);if(!mobileImage||!isBannerPhotoKey(mobileImage))v.invalid('Subí una imagen válida para móvil.');
  const desktopImage=body.desktopImageUrl===null||body.desktopImageUrl===''||body.desktopImageUrl===undefined?null:v.imageUrl(body.desktopImageUrl);
  if(desktopImage&&!isBannerPhotoKey(desktopImage))v.invalid('Subí una imagen válida para escritorio.');
  const backgroundColor=String(body.backgroundColor??'#176B52'),textColor=String(body.textColor??'#FFFFFF');
  if(!/^#[0-9A-Fa-f]{6}$/.test(backgroundColor)||!/^#[0-9A-Fa-f]{6}$/.test(textColor))v.invalid('Los colores deben estar en formato hexadecimal #RRGGBB.');
  const contentAlignment=String(body.contentAlignment??'LEFT');if(!['LEFT','CENTER','RIGHT'].includes(contentAlignment))v.invalid('La alineación no es válida.');
  const destinationType=String(body.destinationType??'INFO');if(!['PRODUCT','CATEGORY','PROMOTION','PRODUCT_LIST','INFO'].includes(destinationType))v.invalid('El destino del banner no es válido.');
  const destinationId=v.optionalId(body.destinationId);const ctaText=v.text(body.ctaText,40,true)??null;const sortOrder=v.integer(body.sortOrder,0,1000000);const isActive=v.bool(body.isActive);const darkOverlay=v.bool(body.darkOverlay);
  const startsAt=body.startsAt===null||body.startsAt===''||body.startsAt===undefined?null:v.instant(body.startsAt);const endsAt=body.endsAt===null||body.endsAt===''||body.endsAt===undefined?null:v.instant(body.endsAt);
  if(startsAt&&endsAt&&endsAt<=startsAt)v.invalid('La fecha de finalización debe ser posterior a la de inicio.');
  if(['PRODUCT','CATEGORY','PROMOTION'].includes(destinationType)&&!destinationId)v.invalid('Seleccioná un destino válido.');
  if(destinationType==='INFO'&&destinationId)v.invalid('Un banner informativo no lleva destino.');
  return clinic.transaction(actor,async(c,fresh)=>{
    clinic.permit(fresh,'store.banners.manage');
    if(destinationId){const table=destinationType==='PRODUCT'?'client_products':destinationType==='CATEGORY'||destinationType==='PRODUCT_LIST'?'client_product_categories':destinationType==='PROMOTION'?'client_promotions':null;if(table){const [target]=await c.execute<RowDataPacket[]>(`SELECT id FROM ${table} WHERE id=? FOR UPDATE`,[destinationId]);if(!target[0])v.invalid('El destino seleccionado ya no está disponible.');}}
    let previous:{mobileImageUrl:string;desktopImageUrl:string|null}|undefined;let savedId=id;
    if(id){const [found]=await c.execute<RowDataPacket[]>('SELECT mobile_image_url AS mobileImageUrl,desktop_image_url AS desktopImageUrl FROM client_store_banners WHERE id=? FOR UPDATE',[id]);if(!found[0])throw new AppError('NOT_FOUND',404,'Banner no encontrado.');previous={mobileImageUrl:String(found[0].mobileImageUrl),desktopImageUrl:found[0].desktopImageUrl as string|null};
      await c.execute(`UPDATE client_store_banners SET title=?,subtitle=?,description=?,mobile_image_url=?,desktop_image_url=?,background_color=?,text_color=?,content_alignment=?,dark_overlay=?,destination_type=?,destination_id=?,cta_text=?,sort_order=?,is_active=?,starts_at=?,ends_at=? WHERE id=?`,[title,subtitle,description,mobileImage,desktopImage,backgroundColor.toUpperCase(),textColor.toUpperCase(),contentAlignment,darkOverlay,destinationType,destinationId,ctaText,sortOrder,isActive,startsAt,endsAt,id]);
    } else {await c.execute(`INSERT INTO client_store_banners(title,subtitle,description,mobile_image_url,desktop_image_url,background_color,text_color,content_alignment,dark_overlay,destination_type,destination_id,cta_text,sort_order,is_active,starts_at,ends_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[title,subtitle,description,mobileImage,desktopImage,backgroundColor.toUpperCase(),textColor.toUpperCase(),contentAlignment,darkOverlay,destinationType,destinationId,ctaText,sortOrder,isActive,startsAt,endsAt]);const [created]=await c.execute<RowDataPacket[]>('SELECT LAST_INSERT_ID() AS id');savedId=String(created[0]?.id??'');}
    return {saved:true,id:savedId,previous};
  });
}

export async function removeBanner(actor:AuthUser,rawId:unknown) {
  const id=v.id(rawId);return clinic.transaction(actor,async(c,fresh)=>{clinic.permit(fresh,'store.banners.manage');const [rows]=await c.execute<RowDataPacket[]>('SELECT mobile_image_url AS mobileImageUrl,desktop_image_url AS desktopImageUrl FROM client_store_banners WHERE id=? FOR UPDATE',[id]);if(!rows[0])throw new AppError('NOT_FOUND',404,'Banner no encontrado.');await c.execute('DELETE FROM client_store_banners WHERE id=?',[id]);return {deleted:true,mobileImageUrl:String(rows[0].mobileImageUrl),desktopImageUrl:rows[0].desktopImageUrl as string|null};});
}

export async function reorderBanners(actor:AuthUser,value:unknown) {
  const body=v.body(value,['ids']);if(!Array.isArray(body.ids)||body.ids.length>200)v.invalid('La lista de orden no es válida.');const ids=[...new Set(body.ids.map(v.id))];if(ids.length!==body.ids.length)v.invalid('La lista contiene banners repetidos.');
  return clinic.transaction(actor,async(c,fresh)=>{clinic.permit(fresh,'store.banners.manage');const [rows]=await c.execute<RowDataPacket[]>('SELECT id FROM client_store_banners ORDER BY sort_order,id FOR UPDATE');if(rows.length!==ids.length||rows.some(row=>!ids.includes(String(row.id))))v.invalid('La lista no coincide con los banners actuales.');for(const [index,id] of ids.entries())await c.execute('UPDATE client_store_banners SET sort_order=? WHERE id=?',[index,id]);return {saved:true};});
}

export async function publicPromotions(): Promise<PromotionBanner[]> {
  const [rows] = await databasePool.execute<RowDataPacket[]>(`SELECT pr.id,pr.name AS promotionName,pr.product_id AS productId,pr.banner_image_url AS bannerImageUrl,
    pr.banner_subtitle AS bannerSubtitle,pr.banner_cta_text AS bannerCtaText
    FROM client_promotions pr JOIN client_products p ON p.id=pr.product_id
    LEFT JOIN client_product_categories c ON c.id=p.category_id
    WHERE pr.is_active=1 AND pr.starts_at<=UTC_TIMESTAMP() AND pr.ends_at>UTC_TIMESTAMP() AND p.is_active=1 AND (c.id IS NULL OR c.is_active=1)
      AND pr.price_cents=(SELECT MIN(active.price_cents) FROM client_promotions active WHERE active.product_id=p.id AND active.is_active=1 AND active.starts_at<=UTC_TIMESTAMP() AND active.ends_at>UTC_TIMESTAMP() AND active.price_cents<p.price_cents)
    ORDER BY pr.starts_at DESC,pr.id DESC LIMIT 12`);
  const banners: (PromotionBanner|null)[] = await Promise.all(rows.map(async row => {
    const product = await productsRepository.product(String(row.productId)) as unknown as Omit<PromotionBanner,'promotionName'|'bannerSubtitle'|'bannerCtaText'>;
    if (product.priceCents >= product.regularPriceCents) return null;
    return { ...product, imageUrl: row.bannerImageUrl ?? product.imageUrl, promotionName: String(row.promotionName), bannerSubtitle: row.bannerSubtitle as string|null, bannerCtaText: String(row.bannerCtaText) };
  }));
  return banners.filter((banner): banner is PromotionBanner => banner !== null);
}

type QueryConnection = Pick<PoolConnection, 'execute'>;
async function settingsRow(connection: QueryConnection = databasePool) {
  const [rows] = await connection.execute<RowDataPacket[]>(`SELECT pickup_enabled AS pickupEnabled,pickup_address AS pickupAddress,pickup_hours AS pickupHours,pickup_instructions AS pickupInstructions,
    delivery_enabled AS deliveryEnabled,delivery_base_fee_cents AS deliveryBaseFeeCents,free_delivery_threshold_cents AS freeDeliveryThresholdCents,
    delivery_hours AS deliveryHours,delivery_days AS deliveryDays,delivery_information AS deliveryInformation,
    bank_name AS bankName,bank_account_holder AS bankAccountHolder,bank_cbu_cvu AS bankCbuCvu,bank_alias AS bankAlias
    FROM client_store_fulfillment_settings WHERE id=1`);
  return rows[0] ?? { pickupEnabled: 0, pickupAddress: null, pickupHours: null, pickupInstructions: null, deliveryEnabled: 0, deliveryBaseFeeCents: 0, freeDeliveryThresholdCents: null, deliveryHours: null, deliveryDays: null, deliveryInformation: null, bankName: null, bankAccountHolder: null, bankCbuCvu: null, bankAlias: null };
}

async function zoneRows(activeOnly: boolean, connection: QueryConnection = databasePool): Promise<DeliveryZone[]> {
  const [rows] = await connection.execute<RowDataPacket[]>(`SELECT CAST(id AS CHAR) AS id,name,province,city,postal_code_prefix AS postalCodePrefix,
    fee_cents AS feeCents,is_active AS isActive FROM client_store_delivery_zones ${activeOnly ? 'WHERE is_active=1' : ''} ORDER BY province,city,name,id`);
  return rows.map(row => ({ ...row, id: String(row.id), feeCents: row.feeCents === null ? null : Number(row.feeCents), isActive: Boolean(row.isActive) })) as DeliveryZone[];
}

export async function publicFulfillment(): Promise<FulfillmentSettings> {
  let settings: RowDataPacket;
  let zones: DeliveryZone[];
  try {
    [settings, zones] = await runDatabaseOperation(() => Promise.all([settingsRow(), zoneRows(true)]));
  } catch (error) {
    if (error instanceof DatabaseError && error.code === 'SCHEMA_UPDATE_REQUIRED') {
      throw new AppError('STORE_FULFILLMENT_SCHEMA_REQUIRED', 503, 'La configuración de retiro y envío necesita la migración 004 del ecommerce.');
    }
    throw error;
  }
  return {
    demoModeEnabled:env.storeDemoEnabled,
    pickupEnabled: Boolean(settings.pickupEnabled), pickupAddress: settings.pickupAddress as string | null,
    pickupHours: settings.pickupHours as string | null, pickupInstructions: settings.pickupInstructions as string | null, deliveryEnabled: Boolean(settings.deliveryEnabled),
    deliveryBaseFeeCents: Number(settings.deliveryBaseFeeCents),
    freeDeliveryThresholdCents: settings.freeDeliveryThresholdCents === null ? null : Number(settings.freeDeliveryThresholdCents),
    deliveryHours: settings.deliveryHours as string | null, deliveryDays: settings.deliveryDays as string | null, deliveryInformation: settings.deliveryInformation as string | null,
    bankName: settings.bankName as string | null, bankAccountHolder: settings.bankAccountHolder as string | null, bankCbuCvu: settings.bankCbuCvu as string | null, bankAlias: settings.bankAlias as string | null,
    zones: zones.map(({ id, name, province, city, postalCodePrefix, feeCents }) => ({ id, name, province, city, postalCodePrefix, feeCents, isActive: true })),
  };
}

export async function adminFulfillment(actor: AuthUser): Promise<FulfillmentSettings> {
  clinic.permit(actor, 'store.settings.view');
  const [settings, zones] = await Promise.all([settingsRow(), zoneRows(false)]);
  return {
    demoModeEnabled:env.storeDemoEnabled,
    pickupEnabled: Boolean(settings.pickupEnabled), pickupAddress: settings.pickupAddress as string | null,
    pickupHours: settings.pickupHours as string | null, pickupInstructions: settings.pickupInstructions as string | null, deliveryEnabled: Boolean(settings.deliveryEnabled),
    deliveryBaseFeeCents: Number(settings.deliveryBaseFeeCents),
    freeDeliveryThresholdCents: settings.freeDeliveryThresholdCents === null ? null : Number(settings.freeDeliveryThresholdCents), zones,
    deliveryHours: settings.deliveryHours as string | null, deliveryDays: settings.deliveryDays as string | null, deliveryInformation: settings.deliveryInformation as string | null,
    bankName: settings.bankName as string | null, bankAccountHolder: settings.bankAccountHolder as string | null, bankCbuCvu: settings.bankCbuCvu as string | null, bankAlias: settings.bankAlias as string | null,
  };
}

export async function quoteDelivery(query: Record<string, unknown>) {
  const province = requiredText(query.province, 'Provincia', 100);
  const city = requiredText(query.city, 'Ciudad', 100);
  const postalCode = requiredText(query.postalCode, 'Código postal', 16);
  const subtotalText = String(query.subtotalCents ?? '');
  if (!/^\d{1,12}$/.test(subtotalText)) v.invalid('El subtotal no es válido.');
  const subtotalCents = Number(subtotalText);
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) v.invalid('El subtotal no es válido.');

  const [settings, zones] = await Promise.all([settingsRow(), zoneRows(true)]);
  if (!Boolean(settings.deliveryEnabled)) return { available: false, feeCents: 0, reason: 'delivery_disabled' as const, zoneName: null };
  const matched = zones
    .filter(zone => sameAddress(zone.province, province) && sameAddress(zone.city, city))
    .filter(zone => !zone.postalCodePrefix || postalCode.toLocaleUpperCase('es').startsWith(zone.postalCodePrefix.toLocaleUpperCase('es')))
    .sort((a, b) => (b.postalCodePrefix?.length ?? 0) - (a.postalCodePrefix?.length ?? 0))[0];
  if (!matched) return { available: false, feeCents: 0, reason: 'outside_zone' as const, zoneName: null };
  const threshold = settings.freeDeliveryThresholdCents === null ? null : Number(settings.freeDeliveryThresholdCents);
  const feeCents = threshold !== null && subtotalCents >= threshold ? 0 : matched.feeCents ?? Number(settings.deliveryBaseFeeCents);
  return { available: true, feeCents, reason: null, zoneName: matched.name };
}

export async function saveFulfillment(actor: AuthUser, value: unknown) {
  const body = v.body(value, ['pickupEnabled', 'pickupAddress', 'pickupHours', 'pickupInstructions', 'deliveryEnabled', 'deliveryBaseFeeCents', 'freeDeliveryThresholdCents', 'deliveryHours', 'deliveryDays', 'deliveryInformation', 'bankName', 'bankAccountHolder', 'bankCbuCvu', 'bankAlias', 'zones']);
  if (typeof body.pickupEnabled !== 'boolean') v.invalid('Indicá si el retiro en local está habilitado.', 'pickupEnabled');
  if (typeof body.deliveryEnabled !== 'boolean') v.invalid('Indicá si el envío a domicilio está habilitado.', 'deliveryEnabled');
  const pickupEnabled = body.pickupEnabled as boolean;
  const deliveryEnabled = body.deliveryEnabled as boolean;
  const pickupAddress = pickupEnabled
    ? fulfillmentRequiredText(body.pickupAddress, 'la dirección del local', 300, 'pickupAddress')
    : fulfillmentText(body.pickupAddress, 300, 'pickupAddress', 'La dirección del local');
  const pickupHours = fulfillmentText(body.pickupHours, 500, 'pickupHours', 'El horario de retiro');
  const pickupInstructions = fulfillmentText(body.pickupInstructions, 500, 'pickupInstructions', 'Las instrucciones de retiro');
  const deliveryHours = fulfillmentText(body.deliveryHours, 500, 'deliveryHours', 'El horario de envío');
  const deliveryDays = fulfillmentText(body.deliveryDays, 100, 'deliveryDays', 'Los días de envío');
  const deliveryInformation = fulfillmentText(body.deliveryInformation, 500, 'deliveryInformation', 'La información de entrega');
  const bankName = fulfillmentText(body.bankName, 120, 'bankName', 'El banco o billetera');
  const bankAccountHolder = fulfillmentText(body.bankAccountHolder, 160, 'bankAccountHolder', 'El titular');
  const bankCbuCvu = fulfillmentText(body.bankCbuCvu, 32, 'bankCbuCvu', 'El CBU o CVU');
  const bankAlias = fulfillmentText(body.bankAlias, 80, 'bankAlias', 'El alias');
  if ([bankName, bankAccountHolder, bankCbuCvu, bankAlias].some(Boolean) && ![bankName, bankAccountHolder, bankCbuCvu, bankAlias].every(Boolean)) {
    const labels = [['bankName',bankName,'Completá el banco o billetera.'],['bankAccountHolder',bankAccountHolder,'Completá el titular.'],['bankCbuCvu',bankCbuCvu,'Completá el CBU o CVU.'],['bankAlias',bankAlias,'Completá el alias.']] as const;
    const errors = labels.filter(([, current]) => !current).map(([field,,message]) => ({field,message}));
    throw new AppError('VALIDATION_ERROR',400,'Completá todos los datos bancarios para habilitar transferencias.',undefined,errors);
  }
  const deliveryBaseFeeCents = fulfillmentInteger(body.deliveryBaseFeeCents, 'deliveryBaseFeeCents', 'El costo de envío');
  const freeDeliveryThresholdCents = body.freeDeliveryThresholdCents === null || body.freeDeliveryThresholdCents === '' ? null : fulfillmentInteger(body.freeDeliveryThresholdCents, 'freeDeliveryThresholdCents', 'El monto mínimo para envío gratis');
  if (!Array.isArray(body.zones)) v.invalid('Agregá las zonas como una lista válida.', 'zones');
  if (body.zones.length > 100) v.invalid('No se pueden configurar más de 100 zonas.', 'zones');

  const zones = body.zones.map((raw: unknown, index: number) => {
    const prefix = `zones.${index}`;
    const zone = v.body(raw, ['id', 'name', 'province', 'city', 'postalCodePrefix', 'feeCents', 'isActive']);
    const id = zone.id === undefined || zone.id === null || zone.id === '' ? null : zoneId(zone.id, `${prefix}.id`);
    const name = fulfillmentRequiredText(zone.name, 'el nombre de la zona', 100, `${prefix}.name`);
    const province = fulfillmentRequiredText(zone.province, 'la provincia', 100, `${prefix}.province`);
    const city = fulfillmentRequiredText(zone.city, 'la ciudad', 100, `${prefix}.city`);
    const postalCodePrefix = fulfillmentText(zone.postalCodePrefix, 16, `${prefix}.postalCodePrefix`, 'El prefijo postal');
    if (postalCodePrefix && !/^[\p{L}\d -]+$/u.test(postalCodePrefix)) v.invalid('El prefijo postal admite letras, números, espacios y guiones.', `${prefix}.postalCodePrefix`);
    const feeCents = zone.feeCents === null || zone.feeCents === '' ? null : fulfillmentInteger(zone.feeCents, `${prefix}.feeCents`, 'El costo de esta zona');
    if (typeof zone.isActive !== 'boolean') v.invalid('Indicá si la zona está habilitada.', `${prefix}.isActive`);
    return { id, name, province, city, postalCodePrefix, feeCents, isActive: zone.isActive };
  });

  return clinic.transaction(actor, async (connection, fresh) => {
    assertAdminPermission(fresh, 'store.settings.manage');
    await connection.execute(`INSERT INTO client_store_fulfillment_settings
      (id,pickup_enabled,pickup_address,pickup_hours,pickup_instructions,delivery_enabled,delivery_base_fee_cents,free_delivery_threshold_cents,delivery_hours,delivery_days,delivery_information,bank_name,bank_account_holder,bank_cbu_cvu,bank_alias,updated_by)
      VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE pickup_enabled=VALUES(pickup_enabled),pickup_address=VALUES(pickup_address),
      pickup_hours=VALUES(pickup_hours),pickup_instructions=VALUES(pickup_instructions),delivery_enabled=VALUES(delivery_enabled),delivery_base_fee_cents=VALUES(delivery_base_fee_cents),
      free_delivery_threshold_cents=VALUES(free_delivery_threshold_cents),delivery_hours=VALUES(delivery_hours),delivery_days=VALUES(delivery_days),delivery_information=VALUES(delivery_information),
      bank_name=VALUES(bank_name),bank_account_holder=VALUES(bank_account_holder),bank_cbu_cvu=VALUES(bank_cbu_cvu),bank_alias=VALUES(bank_alias),updated_by=VALUES(updated_by)`,
    [pickupEnabled, pickupAddress, pickupHours, pickupInstructions, deliveryEnabled, deliveryBaseFeeCents, freeDeliveryThresholdCents, deliveryHours, deliveryDays, deliveryInformation, bankName, bankAccountHolder, bankCbuCvu, bankAlias, fresh.id]);
    for (const zone of zones) {
      if (zone.id) {
        const [found] = await connection.execute<RowDataPacket[]>('SELECT id FROM client_store_delivery_zones WHERE id=? FOR UPDATE', [zone.id]);
        if (!found.length) v.invalid('Una zona de entrega ya no existe.');
        await connection.execute(`UPDATE client_store_delivery_zones SET name=?,province=?,city=?,postal_code_prefix=?,fee_cents=?,is_active=?,updated_by=? WHERE id=?`,
          [zone.name, zone.province, zone.city, zone.postalCodePrefix, zone.feeCents, zone.isActive, fresh.id, zone.id]);
      } else {
        await connection.execute(`INSERT INTO client_store_delivery_zones (name,province,city,postal_code_prefix,fee_cents,is_active,created_by,updated_by)
          VALUES (?,?,?,?,?,?,?,?)`, [zone.name, zone.province, zone.city, zone.postalCodePrefix, zone.feeCents, zone.isActive, fresh.id, fresh.id]);
      }
    }
    return { saved: true };
  });
}

function fulfillmentText(value: unknown, maxLength: number, field: string, label: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') v.invalid(`${label} debe ser texto.`, field);
  const normalized = value.trim();
  if (normalized.length > maxLength) v.invalid(`${label} admite hasta ${maxLength} caracteres.`, field);
  return normalized || null;
}

function fulfillmentRequiredText(value: unknown, label: string, maxLength: number, field: string): string {
  const normalized = fulfillmentText(value, maxLength, field, label);
  if (!normalized) v.invalid(`Ingresá ${label}.`, field);
  return normalized;
}

function fulfillmentInteger(value: unknown, field: string, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 100000000) v.invalid(`${label} debe ser un importe no negativo y no superar $1.000.000.`, field);
  return value;
}

function zoneId(value: unknown, field: string): string {
  try { return v.id(value); } catch { v.invalid('La zona seleccionada no tiene un identificador válido.', field); }
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  const result = v.text(value, maxLength);
  return result?.trim() || null;
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  const result = optionalText(value, maxLength);
  if (!result) v.invalid(`Ingresá ${label.toLocaleLowerCase('es')}.`);
  return result;
}

function sameAddress(first: string, second: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');
  return normalize(first) === normalize(second);
}
