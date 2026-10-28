// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useFeedback } from '../../contexts/FeedbackContext';
import type { FulfillmentSettings } from '../../types/client';
import { PetCareCard, PetCareHeader, PetCareScreen, QueryState } from '../../components/client/PetCareUI';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/forms/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { FormNotice } from '../../components/ui/FormNotice';
import { SelectionRow } from '../../components/ui/SelectionRow';
import { useTheme } from '../../hooks/useTheme';
import { ApiError } from '../../services/api';
import { parseArsToCents, validatePostalCodePrefix, validateStoreFulfillment, type StoreFulfillmentFieldErrors } from '../../utils/store-fulfillment-validation';
import { createSubmissionGate } from '../../utils/submission-gate';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

// Configuración blank: reúne valores o reglas que consume el resto del módulo.
const blank: FulfillmentSettings = { demoModeEnabled: false, pickupEnabled: false, pickupAddress: null, pickupHours: null, pickupInstructions: null, deliveryEnabled: false, deliveryBaseFeeCents: 0, freeDeliveryThresholdCents: null, deliveryHours: null, deliveryDays: null, deliveryInformation: null, bankName: null, bankAccountHolder: null, bankCbuCvu: null, bankAlias: null, zones: [] };
// Función formatCents: concentra una operación reutilizable de este módulo.
const formatCents = (cents: number | null) => cents === null ? '' : (cents / 100).toFixed(2);
// Función zoneKey: concentra una operación reutilizable de este módulo.
const zoneKey = (index: number) => `zone-${index}`;

// Función StoreSettings: concentra la lógica dentro de este módulo.
export default function StoreSettings() {
  const api = useClinic();
  const auth = useAuth();
  const { showToast } = useFeedback();
  const { colors } = useTheme();
  const load = useCallback(() => api.storeFulfillment(), [api]);
  const query = useClientQuery(load);
  const [edited, setEdited] = useState<FulfillmentSettings | null>(null);
  const settings = edited ?? query.data ?? blank;
  const [feeDrafts, setFeeDrafts] = useState<Record<string, string>>({});
  const [newZone, setNewZone] = useState({ name: '', province: '', city: '', postalCodePrefix: '', fee: '' });
  const [fieldErrors, setFieldErrors] = useState<StoreFulfillmentFieldErrors>({});
  const [didSubmit, setDidSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasFeeDraftChanges = Object.entries(feeDrafts).some(([key, value]) => {
    if (key === 'base') return value !== formatCents(query.data?.deliveryBaseFeeCents ?? 0);
    if (key === 'free') return value !== formatCents(query.data?.freeDeliveryThresholdCents ?? null);
    const zoneIndex = Number(key.replace('zone-', ''));
    return value !== formatCents(query.data?.zones[zoneIndex]?.feeCents ?? null);
  });
  const hasSettingsChanges = Boolean(query.data) && JSON.stringify(settings) !== JSON.stringify(query.data);
  const hasNewZoneChanges = Boolean(newZone.name || newZone.province || newZone.city || newZone.postalCodePrefix || newZone.fee);
  const { confirmation: unsavedChangesPrompt } = useUnsavedChangesGuard(hasSettingsChanges || hasFeeDraftChanges || hasNewZoneChanges);
  const saveGate = useRef(createSubmissionGate());
  const inputRefs = useRef<Record<string, ComponentRef<typeof TextInput> | null>>({});
  const canManage = auth.hasPermission('store.settings.manage');

  // Función updateSettings: agrupa una operación que este módulo puede ejecutar o reutilizar.
const updateSettings = (update: (current: FulfillmentSettings) => FulfillmentSettings) => setEdited(current => update(current ?? query.data ?? blank));
  // Función clearError: agrupa una operación que este módulo puede ejecutar o reutilizar.
const clearError = (field: string) => setFieldErrors(current => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
  // Función changeField: agrupa una operación que este módulo puede ejecutar o reutilizar.
const changeField = (field: string, update: (current: FulfillmentSettings) => FulfillmentSettings) => { updateSettings(update); clearError(field); setError(null); };
  // Función updateZone: agrupa una operación que este módulo puede ejecutar o reutilizar.
const updateZone = (index: number, patch: Partial<FulfillmentSettings['zones'][number]>) => updateSettings(current => ({ ...current, zones: current.zones.map((zone, position) => position === index ? { ...zone, ...patch } : zone) }));
  // Función feeDraft: agrupa una operación que este módulo puede ejecutar o reutilizar.
const feeDraft = (key: string, stored: number | null) => feeDrafts[key] ?? formatCents(stored);
  // Función changeFeeDraft: agrupa una operación que este módulo puede ejecutar o reutilizar.
const changeFeeDraft = (key: string, field: string, label: string, value: string, optional: boolean, onValid: (cents: number | null) => void) => {
    setFeeDrafts(current => ({ ...current, [key]: value })); setError(null);
    const parsed = parseArsToCents(value, label, optional);
    setFieldErrors(current => {
      if (!didSubmit && !current[field]) return current;
      const next = { ...current };
      if (parsed.error) next[field] = parsed.error; else delete next[field];
      return next;
    });
    if (!parsed.error) onValid(parsed.cents);
  };
  // Función firstError: agrupa una operación que este módulo puede ejecutar o reutilizar.
const firstError = (issues: StoreFulfillmentFieldErrors) => {
    const first = Object.keys(issues)[0];
    if (first) inputRefs.current[first]?.focus();
  };

  // Función addZone: agrupa una operación que este módulo puede ejecutar o reutilizar.
const addZone = () => {
    const issues: StoreFulfillmentFieldErrors = {};
    if (!newZone.name.trim()) issues['newZone.name'] = 'Ingresá el nombre de la zona.';
    if (!newZone.province.trim()) issues['newZone.province'] = 'Ingresá la provincia.';
    if (!newZone.city.trim()) issues['newZone.city'] = 'Ingresá la ciudad.';
    const postalCodeError = validatePostalCodePrefix(newZone.postalCodePrefix);
    if (postalCodeError) issues['newZone.postalCodePrefix'] = postalCodeError;
    const parsedFee = parseArsToCents(newZone.fee, 'El costo de esta zona', true);
    if (parsedFee.error) issues['newZone.fee'] = parsedFee.error;
    if (Object.keys(issues).length) { setFieldErrors(current => ({ ...current, ...issues })); firstError(issues); return; }
    updateSettings(current => ({ ...current, zones: [...current.zones, { id: '', name: newZone.name.trim(), province: newZone.province.trim(), city: newZone.city.trim(), postalCodePrefix: newZone.postalCodePrefix.trim() || null, feeCents: parsedFee.cents, isActive: true }] }));
    setFeeDrafts(current => ({ ...current, [zoneKey(settings.zones.length)]: newZone.fee }));
    setNewZone({ name: '', province: '', city: '', postalCodePrefix: '', fee: '' });
    setFieldErrors(current => { const next = { ...current }; for (const key of Object.keys(issues)) delete next[key]; return next; });
    setError(null);
  };

  // Función save: agrupa una operación que este módulo puede ejecutar o reutilizar.
const save = () => saveGate.current.run(async () => {
    setDidSubmit(true);
    const baseFeeText = feeDraft('base', settings.deliveryBaseFeeCents);
    const freeThresholdText = feeDraft('free', settings.freeDeliveryThresholdCents);
    const issues = validateStoreFulfillment(settings, baseFeeText, freeThresholdText, feeDrafts);
    if (Object.keys(issues).length) { setFieldErrors(issues); setError(null); firstError(issues); return; }
    const baseFee = parseArsToCents(baseFeeText, 'El costo de envío')
      .cents ?? 0;
    const freeThreshold = parseArsToCents(freeThresholdText, 'El monto mínimo para envío gratis', true).cents;
    const zones = settings.zones.map((zone, index) => ({
      ...zone,
      feeCents: feeDrafts[zoneKey(index)] === undefined ? zone.feeCents : parseArsToCents(feeDrafts[zoneKey(index)], 'El costo de esta zona', true).cents,
    }));
    setSaving(true); setError(null); setFieldErrors({});
    try {
      await api.saveStoreFulfillment({ ...settings, deliveryBaseFeeCents: baseFee, freeDeliveryThresholdCents: freeThreshold, zones });
      setEdited(null); setFeeDrafts({}); showToast('Configuración de tienda guardada', 'success'); query.reload();
    } catch (failure) {
      if (failure instanceof ApiError && failure.fieldErrors.length) {
        const issues = Object.fromEntries(failure.fieldErrors.map(item => [item.field, item.message]));
        setFieldErrors(issues); firstError(issues); setError(null);
      } else setError(failure instanceof Error ? failure.message : 'No se pudo guardar la configuración.');
    } finally { setSaving(false); }
  });

  const baseFeeText = feeDraft('base', settings.deliveryBaseFeeCents);
  const freeThresholdText = feeDraft('free', settings.freeDeliveryThresholdCents);
  return <PetCareScreen wide>
    <PetCareHeader title="Retiro y envíos" subtitle="Configuración de la tienda" back hideForAdmin />
    
<QueryState {...query} />
    {query.data && <>
      <PetCareCard>
        <AppText variant="subtitle">Retiro en el local</AppText>
        <SelectionRow label="Habilitar retiro" checked={settings.pickupEnabled} disabled={!canManage} onPress={() => changeField('pickupEnabled', current => ({ ...current, pickupEnabled: !current.pickupEnabled }))} />
        <AppInput label="Dirección del establecimiento" required={settings.pickupEnabled} value={settings.pickupAddress ?? ''} editable={canManage} maxLength={300} error={fieldErrors.pickupAddress} ref={node => { inputRefs.current.pickupAddress = node; }} onChangeText={value => changeField('pickupAddress', current => ({ ...current, pickupAddress: value || null }))} />
        <AppInput label="Horarios de retiro" value={settings.pickupHours ?? ''} editable={canManage} maxLength={500} error={fieldErrors.pickupHours} ref={node => { inputRefs.current.pickupHours = node; }} onChangeText={value => changeField('pickupHours', current => ({ ...current, pickupHours: value || null }))} />
        <AppInput label="Indicaciones para retirar" value={settings.pickupInstructions ?? ''} editable={canManage} maxLength={500} multiline error={fieldErrors.pickupInstructions} ref={node => { inputRefs.current.pickupInstructions = node; }} onChangeText={value => changeField('pickupInstructions', current => ({ ...current, pickupInstructions: value || null }))} />
      </PetCareCard>

      <PetCareCard>
        <AppText variant="subtitle">Envíos a domicilio</AppText>
        <SelectionRow label="Habilitar envíos" checked={settings.deliveryEnabled} disabled={!canManage} onPress={() => changeField('deliveryEnabled', current => ({ ...current, deliveryEnabled: !current.deliveryEnabled }))} />
        <AppInput label="Tarifa base (ARS)" prefix="$" value={baseFeeText} keyboardType="decimal-pad" maxLength={10} editable={canManage} error={fieldErrors.deliveryBaseFeeCents} ref={node => { inputRefs.current.deliveryBaseFeeCents = node; }} onChangeText={value => changeFeeDraft('base','deliveryBaseFeeCents','El costo de envío',value,false,cents=>updateSettings(current=>({...current,deliveryBaseFeeCents:cents??0})))} />
        <AppInput label="Envío gratis desde (ARS, opcional)" prefix="$" value={freeThresholdText} keyboardType="decimal-pad" maxLength={10} editable={canManage} error={fieldErrors.freeDeliveryThresholdCents} ref={node => { inputRefs.current.freeDeliveryThresholdCents = node; }} onChangeText={value => changeFeeDraft('free','freeDeliveryThresholdCents','El monto mínimo para envío gratis',value,true,cents=>updateSettings(current=>({...current,freeDeliveryThresholdCents:cents})))} />
        <AppInput label="Días de entrega" value={settings.deliveryDays ?? ''} editable={canManage} maxLength={100} error={fieldErrors.deliveryDays} ref={node => { inputRefs.current.deliveryDays = node; }} onChangeText={value => changeField('deliveryDays', current => ({ ...current, deliveryDays: value || null }))} />
        <AppInput label="Horarios de entrega" value={settings.deliveryHours ?? ''} editable={canManage} maxLength={500} error={fieldErrors.deliveryHours} ref={node => { inputRefs.current.deliveryHours = node; }} onChangeText={value => changeField('deliveryHours', current => ({ ...current, deliveryHours: value || null }))} />
        <AppInput label="Información para clientes" value={settings.deliveryInformation ?? ''} editable={canManage} maxLength={500} multiline error={fieldErrors.deliveryInformation} ref={node => { inputRefs.current.deliveryInformation = node; }} onChangeText={value => changeField('deliveryInformation', current => ({ ...current, deliveryInformation: value || null }))} />
        <AppText variant="caption" muted>Una zona activa requiere coincidencia de ciudad y provincia. El prefijo postal es opcional; una tarifa de zona reemplaza la tarifa base.</AppText>
      </PetCareCard>

      <PetCareCard>
        <AppText variant="subtitle">Datos para transferencia bancaria</AppText>
        <AppText variant="caption" muted>Completá todos los datos si vas a habilitar transferencias.</AppText>
        <AppInput label="Banco o billetera" value={settings.bankName ?? ''} editable={canManage} maxLength={120} error={fieldErrors.bankName} ref={node => { inputRefs.current.bankName = node; }} onChangeText={value => changeField('bankName', current => ({ ...current, bankName: value || null }))} />
        <AppInput label="Titular de la cuenta" value={settings.bankAccountHolder ?? ''} editable={canManage} maxLength={160} error={fieldErrors.bankAccountHolder} ref={node => { inputRefs.current.bankAccountHolder = node; }} onChangeText={value => changeField('bankAccountHolder', current => ({ ...current, bankAccountHolder: value || null }))} />
        <AppInput label="CBU o CVU" value={settings.bankCbuCvu ?? ''} editable={canManage} maxLength={32} error={fieldErrors.bankCbuCvu} ref={node => { inputRefs.current.bankCbuCvu = node; }} onChangeText={value => changeField('bankCbuCvu', current => ({ ...current, bankCbuCvu: value || null }))} />
        <AppInput label="Alias" value={settings.bankAlias ?? ''} editable={canManage} maxLength={80} error={fieldErrors.bankAlias} ref={node => { inputRefs.current.bankAlias = node; }} onChangeText={value => changeField('bankAlias', current => ({ ...current, bankAlias: value || null }))} />
      </PetCareCard>

      <AppText variant="subtitle">Zonas configuradas</AppText>
      {settings.zones.map((zone, index) => <PetCareCard key={zone.id || `new-${index}`}>
        <View style={styles.heading}><AppText variant="subtitle" style={{ flex: 1 }}>{zone.name || 'Nueva zona'}</AppText><Pressable accessibilityRole="button" accessibilityLabel={zone.isActive ? 'Desactivar zona' : 'Activar zona'} disabled={!canManage} onPress={() => updateZone(index, { isActive: !zone.isActive })}><Ionicons name={zone.isActive ? 'checkmark-circle' : 'close-circle'} size={24} color={zone.isActive ? colors.primary : colors.muted} /></Pressable></View>
        <View style={styles.row}><View style={styles.flex}><AppInput label="Nombre" required maxLength={100} value={zone.name} editable={canManage} error={fieldErrors[`zones.${index}.name`]} ref={node => { inputRefs.current[`zones.${index}.name`] = node; }} onChangeText={value => { updateZone(index, { name: value }); clearError(`zones.${index}.name`); }} /></View><View style={styles.flex}><AppInput label="Provincia" required maxLength={100} value={zone.province} editable={canManage} error={fieldErrors[`zones.${index}.province`]} ref={node => { inputRefs.current[`zones.${index}.province`] = node; }} onChangeText={value => { updateZone(index, { province: value }); clearError(`zones.${index}.province`); }} /></View></View>
        <AppInput label="Ciudad" required maxLength={100} value={zone.city} editable={canManage} error={fieldErrors[`zones.${index}.city`]} ref={node => { inputRefs.current[`zones.${index}.city`] = node; }} onChangeText={value => { updateZone(index, { city: value }); clearError(`zones.${index}.city`); }} />
        <View style={styles.row}><View style={styles.flex}><AppInput label="Prefijo postal (opcional)" maxLength={16} value={zone.postalCodePrefix ?? ''} editable={canManage} error={fieldErrors[`zones.${index}.postalCodePrefix`]} ref={node => { inputRefs.current[`zones.${index}.postalCodePrefix`] = node; }} onChangeText={value => { updateZone(index, { postalCodePrefix: value || null }); clearError(`zones.${index}.postalCodePrefix`); }} /></View><View style={styles.flex}><AppInput label="Tarifa de zona (ARS, opcional)" prefix="$" value={feeDraft(zoneKey(index), zone.feeCents)} keyboardType="decimal-pad" maxLength={10} editable={canManage} error={fieldErrors[`zones.${index}.feeCents`]} ref={node => { inputRefs.current[`zones.${index}.feeCents`] = node; }} onChangeText={value => changeFeeDraft(zoneKey(index),`zones.${index}.feeCents`,'El costo de esta zona',value,true,cents=>updateZone(index,{feeCents:cents}))} /></View></View>
        <AppText variant="caption" muted>{zone.isActive ? 'Activa' : 'Desactivada'}</AppText>
      </PetCareCard>)}

      {canManage && <PetCareCard>
        <AppText variant="subtitle">Agregar zona de entrega</AppText>
        <AppInput label="Nombre de zona" required maxLength={100} value={newZone.name} error={fieldErrors['newZone.name']} ref={node => { inputRefs.current['newZone.name'] = node; }} onChangeText={value => { setNewZone(current => ({ ...current, name: value })); clearError('newZone.name'); }} />
        <View style={styles.row}><View style={styles.flex}><AppInput label="Provincia" required maxLength={100} value={newZone.province} error={fieldErrors['newZone.province']} ref={node => { inputRefs.current['newZone.province'] = node; }} onChangeText={value => { setNewZone(current => ({ ...current, province: value })); clearError('newZone.province'); }} /></View><View style={styles.flex}><AppInput label="Ciudad" required maxLength={100} value={newZone.city} error={fieldErrors['newZone.city']} ref={node => { inputRefs.current['newZone.city'] = node; }} onChangeText={value => { setNewZone(current => ({ ...current, city: value })); clearError('newZone.city'); }} /></View></View>
        <View style={styles.row}><View style={styles.flex}><AppInput label="Prefijo postal" maxLength={16} value={newZone.postalCodePrefix} error={fieldErrors['newZone.postalCodePrefix']} ref={node => { inputRefs.current['newZone.postalCodePrefix'] = node; }} onChangeText={value => { setNewZone(current => ({ ...current, postalCodePrefix: value })); clearError('newZone.postalCodePrefix'); }} /></View><View style={styles.flex}><AppInput label="Tarifa (ARS, opcional)" prefix="$" value={newZone.fee} keyboardType="decimal-pad" maxLength={10} error={fieldErrors['newZone.fee']} ref={node => { inputRefs.current['newZone.fee'] = node; }} onChangeText={value => { setNewZone(current => ({ ...current, fee: value })); clearError('newZone.fee'); }} /></View></View>
        <AppButton variant="secondary" label="Agregar zona" onPress={addZone} />
      </PetCareCard>}
      <FormNotice error message={error} />
      {canManage && <AppButton variant="accent" label="Guardar configuración" loading={saving} disabled={saving} onPress={() => void save()} />}
      {!canManage && <AppText muted>Tenés acceso de consulta. Se requiere el permiso store.settings.manage para editar.</AppText>}
    </>}
    {unsavedChangesPrompt}
  </PetCareScreen>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ heading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, row: { flexDirection: 'row', gap: 10 }, flex: { flex: 1, minWidth: 0 } });
