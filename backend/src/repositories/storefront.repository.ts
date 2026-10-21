/** Configuración de retiro y envío. No crea pedidos ni reserva stock. */
import type { RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import type { AuthUser } from '../types/auth';
import { databasePool } from '../config/database';
import * as clinic from './clinic.repository';
import * as productsRepository from './client.repository';
import * as v from '../validators/clinic.validator';
import { assertAdminPermission } from '../utils/admin-authorization';
import { AppError } from '../utils/app-error';
import { DatabaseError, runDatabaseOperation } from '../utils/database-error';

export type DeliveryZone = { id: string; name: string; province: string; city: string; postalCodePrefix: string | null; feeCents: number | null; isActive: boolean };
export type FulfillmentSettings = { pickupEnabled: boolean; pickupAddress: string | null; pickupHours: string | null; pickupInstructions: string | null; deliveryEnabled: boolean; deliveryBaseFeeCents: number; freeDeliveryThresholdCents: number | null; deliveryHours: string | null; deliveryDays: string | null; deliveryInformation: string | null; zones: DeliveryZone[] };
export type PromotionBanner = { id:string;name:string;description:string|null;imageUrl:string|null;categoryId:string|null;category:string|null;stock:number;isActive:boolean;priceCents:number;regularPriceCents:number;requiresPrescription:boolean;speciesId:string|null;productType:'GENERAL'|'MEDICINE'|'ACCESSORY';promotionName:string;bannerSubtitle:string|null;bannerCtaText:string };

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
    delivery_hours AS deliveryHours,delivery_days AS deliveryDays,delivery_information AS deliveryInformation
    FROM client_store_fulfillment_settings WHERE id=1`);
  return rows[0] ?? { pickupEnabled: 0, pickupAddress: null, pickupHours: null, pickupInstructions: null, deliveryEnabled: 0, deliveryBaseFeeCents: 0, freeDeliveryThresholdCents: null, deliveryHours: null, deliveryDays: null, deliveryInformation: null };
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
    pickupEnabled: Boolean(settings.pickupEnabled), pickupAddress: settings.pickupAddress as string | null,
    pickupHours: settings.pickupHours as string | null, pickupInstructions: settings.pickupInstructions as string | null, deliveryEnabled: Boolean(settings.deliveryEnabled),
    deliveryBaseFeeCents: Number(settings.deliveryBaseFeeCents),
    freeDeliveryThresholdCents: settings.freeDeliveryThresholdCents === null ? null : Number(settings.freeDeliveryThresholdCents),
    deliveryHours: settings.deliveryHours as string | null, deliveryDays: settings.deliveryDays as string | null, deliveryInformation: settings.deliveryInformation as string | null,
    zones: zones.map(({ id, name, province, city, postalCodePrefix, feeCents }) => ({ id, name, province, city, postalCodePrefix, feeCents, isActive: true })),
  };
}

export async function adminFulfillment(actor: AuthUser): Promise<FulfillmentSettings> {
  clinic.permit(actor, 'store.settings.view');
  const [settings, zones] = await Promise.all([settingsRow(), zoneRows(false)]);
  return {
    pickupEnabled: Boolean(settings.pickupEnabled), pickupAddress: settings.pickupAddress as string | null,
    pickupHours: settings.pickupHours as string | null, pickupInstructions: settings.pickupInstructions as string | null, deliveryEnabled: Boolean(settings.deliveryEnabled),
    deliveryBaseFeeCents: Number(settings.deliveryBaseFeeCents),
    freeDeliveryThresholdCents: settings.freeDeliveryThresholdCents === null ? null : Number(settings.freeDeliveryThresholdCents), zones,
    deliveryHours: settings.deliveryHours as string | null, deliveryDays: settings.deliveryDays as string | null, deliveryInformation: settings.deliveryInformation as string | null,
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
  const body = v.body(value, ['pickupEnabled', 'pickupAddress', 'pickupHours', 'pickupInstructions', 'deliveryEnabled', 'deliveryBaseFeeCents', 'freeDeliveryThresholdCents', 'deliveryHours', 'deliveryDays', 'deliveryInformation', 'zones']);
  if (typeof body.pickupEnabled !== 'boolean' || typeof body.deliveryEnabled !== 'boolean') v.invalid('Indicá si cada método está habilitado.');
  const pickupEnabled = body.pickupEnabled as boolean;
  const deliveryEnabled = body.deliveryEnabled as boolean;
  const pickupAddress = optionalText(body.pickupAddress, 300);
  const pickupHours = optionalText(body.pickupHours, 500);
  const pickupInstructions = optionalText(body.pickupInstructions, 500);
  const deliveryHours = optionalText(body.deliveryHours, 500);
  const deliveryDays = optionalText(body.deliveryDays, 100);
  const deliveryInformation = optionalText(body.deliveryInformation, 500);
  const deliveryBaseFeeCents = v.integer(body.deliveryBaseFeeCents, 0, 100000000);
  const freeDeliveryThresholdCents = body.freeDeliveryThresholdCents === null || body.freeDeliveryThresholdCents === '' ? null : v.integer(body.freeDeliveryThresholdCents, 0, 100000000);
  if (!Array.isArray(body.zones) || body.zones.length > 100) v.invalid('Revisá las zonas de entrega.');

  const zones = body.zones.map((raw: unknown) => {
    const zone = v.body(raw, ['id', 'name', 'province', 'city', 'postalCodePrefix', 'feeCents', 'isActive']);
    const id = zone.id === undefined || zone.id === null || zone.id === '' ? null : v.id(zone.id);
    const name = requiredText(zone.name, 'Nombre de zona', 100);
    const province = requiredText(zone.province, 'Provincia', 100);
    const city = requiredText(zone.city, 'Ciudad', 100);
    const postalCodePrefix = optionalText(zone.postalCodePrefix, 16);
    if (postalCodePrefix && !/^[\p{L}\d -]+$/u.test(postalCodePrefix)) v.invalid('El prefijo postal contiene caracteres inválidos.');
    const feeCents = zone.feeCents === null || zone.feeCents === '' ? null : v.integer(zone.feeCents, 0, 100000000);
    if (typeof zone.isActive !== 'boolean') v.invalid('Indicá si la zona está habilitada.');
    return { id, name, province, city, postalCodePrefix, feeCents, isActive: zone.isActive };
  });

  return clinic.transaction(actor, async (connection, fresh) => {
    assertAdminPermission(fresh, 'store.settings.manage');
    await connection.execute(`INSERT INTO client_store_fulfillment_settings
      (id,pickup_enabled,pickup_address,pickup_hours,pickup_instructions,delivery_enabled,delivery_base_fee_cents,free_delivery_threshold_cents,delivery_hours,delivery_days,delivery_information,updated_by)
      VALUES (1,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE pickup_enabled=VALUES(pickup_enabled),pickup_address=VALUES(pickup_address),
      pickup_hours=VALUES(pickup_hours),pickup_instructions=VALUES(pickup_instructions),delivery_enabled=VALUES(delivery_enabled),delivery_base_fee_cents=VALUES(delivery_base_fee_cents),
      free_delivery_threshold_cents=VALUES(free_delivery_threshold_cents),delivery_hours=VALUES(delivery_hours),delivery_days=VALUES(delivery_days),delivery_information=VALUES(delivery_information),updated_by=VALUES(updated_by)`,
    [pickupEnabled, pickupAddress, pickupHours, pickupInstructions, deliveryEnabled, deliveryBaseFeeCents, freeDeliveryThresholdCents, deliveryHours, deliveryDays, deliveryInformation, fresh.id]);
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
