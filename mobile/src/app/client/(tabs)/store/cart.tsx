// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/** Carrito del cliente sincronizado con el catálogo y la disponibilidad actuales del backend. */
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClient } from '../../../../hooks/useClient';
import { useClientQuery } from '../../../../hooks/useClientQuery';
import { useFeedback } from '../../../../contexts/FeedbackContext';
import { PetCareCard, PetCareEmptyState, PetCareHeader, PetCareScreen, QueryState, money } from '../../../../components/client/PetCareUI';
import { AppText } from '../../../../components/ui/AppText';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppInput } from '../../../../components/forms/AppInput';
import { FormNotice } from '../../../../components/ui/FormNotice';
import { useTheme } from '../../../../hooks/useTheme';
import { useStoreCheckout } from '../../../../contexts/StoreCheckoutContext';

// Función CartScreen: concentra la lógica dentro de este módulo.
export default function CartScreen() {
  const api = useClient();
  const cart = useClientQuery(api.cart);
  const cartData = cart.data;
  const reloadCart = cart.reload;
  const { showToast } = useFeedback();
  const { colors } = useTheme();
  const flow = useStoreCheckout();
  const shippingQuoted = flow.fulfillment === 'delivery' && Boolean(flow.quote?.available) && flow.quotedSubtotalCents===cart.data?.totalCents;
  const shipping = shippingQuoted ? flow.quote!.feeCents : 0;
  const [pending, setPending] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (productId: string, quantity: number) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(productId);
    setError(null);
    try {
      await api.updateCart(productId, quantity);
      setDrafts(current => { const next = { ...current }; delete next[productId]; return next; });
      reloadCart();
      if (quantity === 0) showToast('Producto eliminado del carrito', 'success');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo actualizar el carrito.');
      reloadCart();
    } finally {
      pendingRef.current = false;
      setPending(null);
    }
  }, [api, reloadCart, showToast]);

  const commitQuantity = useCallback((productId: string, currentQuantity: number, stock: number) => {
    const raw = drafts[productId] ?? String(currentQuantity);
    if (!/^\d{1,2}$/.test(raw)) {
      setError('Ingresá una cantidad entera entre 0 y 99.');
      return;
    }
    const quantity = Number(raw);
    if (quantity > stock) {
      setError(`La cantidad no puede superar las ${stock} unidades disponibles.`);
      return;
    }
    void update(productId, quantity);
  }, [drafts, update]);

  const totalItems = cartData?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const unavailable = cartData?.items.some(item => !item.isActive || item.quantity > item.stock) ?? false;
  return <PetCareScreen wide tabbed>
    <PetCareHeader title="Carrito" subtitle={`${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`} right={<Pressable accessibilityRole="button" accessibilityLabel="Seguir comprando" onPress={() => router.navigate('/client/store')} style={[styles.continueButton, { backgroundColor: colors.accent }]}><Ionicons name="bag-handle-outline" size={21} color={colors.text} /></Pressable>} />
    
<QueryState {...cart} />
    <FormNotice error message={error} />
    {cartData && cartData.items.length === 0 && <PetCareEmptyState title="Tu carrito está vacío" message="Explorá los productos disponibles para encontrar lo que necesita tu mascota." icon="cart-outline" action={() => router.navigate('/client/store')} label="Ir a la tienda" />}

    {cartData?.items.map(item => <PetCareCard key={item.id}>
      <View style={styles.itemHeader}>
        <View style={[styles.productImage, { backgroundColor: colors.accent }]}>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" accessibilityLabel={`Imagen de ${item.name}`} /> : <Ionicons name="paw-outline" size={28} color={colors.muted} />}
        </View>
        <View style={styles.productInfo}>
          <AppText numberOfLines={2} variant="subtitle">{item.name}</AppText>
          <AppText>{money(item.priceCents)} <AppText muted>por unidad</AppText></AppText>
          <AppText muted>{item.stock} disponibles</AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${item.name} del carrito`} accessibilityState={{ disabled: Boolean(pending) }} disabled={Boolean(pending)} hitSlop={8} onPress={() => void update(item.id, 0)} style={[styles.removeButton, { backgroundColor: colors.accent, opacity: pending ? 0.55 : 1 }]}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>
      <View style={[styles.quantityRow, styles.wrapRow]}>
        <View style={styles.quantityControl}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Reducir cantidad de ${item.name}`} disabled={Boolean(pending)} onPress={() => void update(item.id, Math.max(0, item.quantity - 1))} style={[styles.stepButton, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pending ? 0.55 : 1 }]}>
            <Ionicons name="remove" size={18} color={colors.text} />
          </Pressable>
          <View style={styles.quantityInput}>
            <AppInput compact label={`Cantidad de ${item.name}`} keyboardType="number-pad" returnKeyType="done" maxLength={2} value={drafts[item.id] ?? String(item.quantity)} onChangeText={value => setDrafts(current => ({ ...current, [item.id]: value.replace(/[^0-9]/g, '').slice(0, 2) }))} onBlur={() => commitQuantity(item.id, item.quantity, item.stock)} onSubmitEditing={() => commitQuantity(item.id, item.quantity, item.stock)} editable={!pending} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar cantidad de ${item.name}`} disabled={Boolean(pending) || item.quantity >= item.stock || item.quantity >= 99} onPress={() => void update(item.id, item.quantity + 1)} style={[styles.stepButton, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pending || item.quantity >= item.stock || item.quantity >= 99 ? 0.5 : 1 }]}>
            <Ionicons name="add" size={18} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.subtotal}>
          <AppText variant="caption" muted>Subtotal</AppText>
          <AppText variant="subtitle">{money(item.subtotalCents)}</AppText>
        </View>
      </View>
      {!item.isActive && <AppText style={{ color: colors.danger }}>Este producto ya no está disponible. Eliminá el artículo para continuar.</AppText>}
      {item.quantity > item.stock && <AppText style={{ color: colors.danger }}>El stock cambió. Ajustá la cantidad antes de continuar.</AppText>}
    </PetCareCard>)}

    {!!cartData?.items.length && <PetCareCard>
      <AppText variant="subtitle">Resumen</AppText>
      <View style={styles.summaryRow}><AppText muted>Subtotal</AppText><AppText>{money(cartData.totalCents)}</AppText></View>
      {flow.fulfillment==='delivery'&&<View style={styles.summaryRow}><AppText muted>Envío</AppText><AppText>{shippingQuoted?money(shipping):'A confirmar en el checkout'}</AppText></View>}
      <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}><AppText variant="subtitle">{flow.fulfillment==='delivery'&&!shippingQuoted?'Total a confirmar':'Total'}</AppText><AppText variant="subtitle">{flow.fulfillment==='delivery'&&!shippingQuoted?'A confirmar':money(cartData.totalCents+shipping)}</AppText></View>
      <AppButton variant="primary" label="Comprar ahora" disabled={unavailable || Boolean(pending)} onPress={() => router.push('/client/store/checkout')} />
      <AppButton label="Seguir comprando" variant="secondary" onPress={() => router.navigate('/client/store')} />
    </PetCareCard>}
  </PetCareScreen>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  continueButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productImage: { width: 68, height: 68, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' }, productInfo: { flex: 1, minWidth: 0, gap: 4 },
  removeButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quantityRow: { marginTop: 2, alignItems: 'center', justifyContent: 'space-between', gap: 12 }, wrapRow: { flexWrap: 'wrap' },
  quantityControl: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  stepButton: { width: 42, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quantityInput: { width: 82 }, subtotal: { alignItems: 'flex-end', minWidth: 100, marginLeft: 'auto', gap: 3 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  totalRow: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
