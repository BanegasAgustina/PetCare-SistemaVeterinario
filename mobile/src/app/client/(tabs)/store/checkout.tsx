/** Checkout demostrativo. Solo lee el carrito; los campos son efímeros y nunca se envían ni persisten. */
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClient } from '../../../../hooks/useClient';
import { useClientQuery } from '../../../../hooks/useClientQuery';
import { PetCareCard, PetCareEmptyState, PetCareHeader, PetCareScreen, QueryState, money } from '../../../../components/client/PetCareUI';
import { AppText } from '../../../../components/ui/AppText';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppInput } from '../../../../components/forms/AppInput';
import { FormNotice } from '../../../../components/ui/FormNotice';
import { useTheme } from '../../../../hooks/useTheme';
import { useStoreCheckout } from '../../../../contexts/StoreCheckoutContext';

type PaymentMethod = 'card' | 'transfer' | 'wallet';

const methods: { id: PaymentMethod; title: string; detail: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'card', title: 'Tarjeta de crédito o débito', detail: 'Formulario simulado, sin procesar pagos.', icon: 'card-outline' },
  { id: 'transfer', title: 'Transferencia bancaria', detail: 'Datos de referencia demostrativos.', icon: 'swap-horizontal-outline' },
  { id: 'wallet', title: 'Billetera virtual', detail: 'Sin conexión con proveedores externos.', icon: 'wallet-outline' },
];

export default function DemoCheckout() {
  const api = useClient();
  const cart = useClientQuery(api.cart);
  const { colors } = useTheme();
  const flow = useStoreCheckout();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [holder, setHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [walletUser, setWalletUser] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultVisible, setResultVisible] = useState(false);

  const cartData = cart.data;
  const unavailable = cartData?.items.some(item => !item.isActive || item.quantity < 1 || item.quantity > item.stock) ?? false;
  const itemCount = cartData?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const shippingCents = flow.fulfillment === 'delivery' && flow.quote?.available && flow.quotedSubtotalCents===cartData?.totalCents ? flow.quote.feeCents : 0;
  const totalCents = (cartData?.totalCents ?? 0) + shippingCents;

  function finishDemo() {
    if (!cartData?.items.length) {
      setError('El carrito está vacío. Volvé a la tienda para elegir productos.');
      return;
    }
    if (unavailable) {
      setError('Revisá la disponibilidad y las cantidades en el carrito antes de continuar.');
      return;
    }
    if (!method) {
      setError('Elegí un método de pago demostrativo para continuar.');
      return;
    }
    if (!flow.fulfillment || (flow.fulfillment === 'delivery' && (!flow.quote?.available || flow.quotedSubtotalCents!==cartData.totalCents))) {
      setError('Elegí un método de entrega y confirmá una tarifa válida antes de continuar.');
      return;
    }
    if (method === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      const validExpiry = /^(0[1-9]|1[0-2])\/(\d{2}|20\d{2})$/.test(expiry.trim());
      if (holder.trim().length < 3 || digits.length < 13 || digits.length > 19 || !validExpiry || !/^\d{3,4}$/.test(securityCode)) {
        setError('Revisá el nombre, número, vencimiento y código de seguridad de ejemplo.');
        return;
      }
    } else if (method === 'transfer') {
      if (holder.trim().length < 3 || reference.trim().length < 4) {
        setError('Ingresá un titular y una referencia de ejemplo (al menos 4 caracteres).');
        return;
      }
    } else if (walletUser.trim().length < 3) {
      setError('Ingresá un nombre de usuario de billetera de ejemplo.');
      return;
    }
    // Limpiamos todos los campos del método de demostración antes de mostrar el resultado.
    setHolder('');
    setCardNumber('');
    setExpiry('');
    setSecurityCode('');
    setReference('');
    setNotes('');
    setWalletUser('');
    setError(null);
    setResultVisible(true);
  }

  const stickyFooter = cartData?.items.length && !resultVisible ? <View style={[styles.stickyFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
    <View style={styles.footerTotal}><AppText variant="caption" muted>Total</AppText><AppText variant="subtitle">{money(totalCents)}</AppText></View>
    <AppButton compact variant="primary" label="Finalizar compra" disabled={!method || unavailable || !flow.fulfillment || (flow.fulfillment==='delivery'&&(!flow.quote?.available||flow.quotedSubtotalCents!==cartData.totalCents))} onPress={finishDemo} />
  </View> : undefined;

  return <PetCareScreen wide tabbed footer={stickyFooter}>
    {!resultVisible && <>
      <PetCareHeader title="Método de pago" subtitle="Checkout demostrativo" right={<Pressable accessibilityRole="button" accessibilityLabel="Volver al carrito" onPress={() => router.navigate('/client/store/cart')} style={[styles.cartButton, { backgroundColor: colors.accent }]}><Ionicons name="cart-outline" size={22} color={colors.text} /><View style={[styles.countBadge, { backgroundColor: colors.accent }]}><AppText style={[styles.countText, { color: colors.text }]}>{itemCount > 99 ? '99+' : itemCount}</AppText></View></Pressable>} />
      <FormNotice message="Esta pantalla es una demostración. No se realizan pagos, no se guardan datos bancarios y los campos nunca se envían al servidor." />
      <QueryState {...cart} />
    </>}
    {resultVisible && <View style={styles.resultScreen}>
      <PetCareCard>
      <View style={[styles.resultIcon, { backgroundColor: colors.accent }]}><Ionicons name="paw" size={38} color={colors.primary} /><View style={[styles.resultAlert, { backgroundColor: colors.primary }]}><Ionicons name="information" size={16} color={colors.onPrimary} /></View></View>
      <AppText variant="title" style={styles.resultTitle}>Servicio no disponible</AppText>
      <AppText style={styles.resultMessage}>Por el momento no podemos procesar tu compra. Intentá nuevamente más tarde.</AppText>
      <AppText variant="caption" muted>El carrito se conserva y no se registró ninguna compra ni pago.</AppText>
      <AppButton variant="primary" label="Entendido" onPress={() => { setResultVisible(false); setMethod(null); router.navigate('/client/store/cart'); }} />
      </PetCareCard>
    </View>}
    {!resultVisible && cartData && cartData.items.length === 0 && <PetCareEmptyState title="Tu carrito está vacío" message="Agregá productos antes de elegir un método de pago." icon="cart-outline" action={() => router.navigate('/client/store')} label="Ir a la tienda" />}
    {!resultVisible && !!cartData?.items.length && <>
      <PetCareCard>
        <AppText variant="subtitle">Entrega</AppText>
        <View style={styles.summaryItem}><AppText>{flow.fulfillment==='pickup'?'Retiro en el local':'Envío a domicilio'}</AppText><AppText>{flow.fulfillment==='delivery'?money(shippingCents):'Sin costo'}</AppText></View>
        {flow.fulfillment==='delivery'&&<AppText variant="caption" muted>{flow.address.recipientName} · {flow.address.street} · {flow.address.city}, {flow.address.province} ({flow.address.postalCode})</AppText>}
        <AppButton compact variant="secondary" label="Cambiar entrega" onPress={()=>router.navigate('/client/store/delivery')}/>
      </PetCareCard>
      <PetCareCard>
        <AppText variant="subtitle">Resumen de la compra</AppText>
        {cartData.items.map(item => <View key={item.id} style={styles.summaryItem}><AppText numberOfLines={2} style={styles.summaryName}>{item.name} · {item.quantity} × {money(item.priceCents)}</AppText><AppText>{money(item.subtotalCents)}</AppText></View>)}
        <View style={styles.summaryItem}><AppText muted>Subtotal</AppText><AppText>{money(cartData.totalCents)}</AppText></View><View style={styles.summaryItem}><AppText muted>Envío</AppText><AppText>{money(shippingCents)}</AppText></View><View style={styles.summaryItem}><AppText variant="subtitle">Total</AppText><AppText variant="subtitle">{money(totalCents)}</AppText></View>
        {unavailable && <FormNotice error message="Hay productos con disponibilidad modificada. Ajustá el carrito para continuar." />}
      </PetCareCard>

      <View style={styles.methodList}>
        <AppText variant="subtitle">Seleccioná un método</AppText>
        {methods.map(option => {
          const selected = method === option.id;
          return <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => { setMethod(option.id); setError(null); }} style={[styles.methodCard, { backgroundColor: selected ? colors.accent : colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
            <Ionicons name={option.icon} size={24} color={colors.primary} />
            <View style={styles.methodCopy}><AppText variant="subtitle">{option.title}</AppText><AppText variant="caption" muted>{option.detail}</AppText></View>
            <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={21} color={colors.primary} />
          </Pressable>;
        })}
      </View>

      {method === 'card' && <PetCareCard>
        <AppText variant="subtitle">Tarjeta de prueba</AppText>
        <AppText variant="caption" muted>Usá cualquier dato de ejemplo con formato válido. No ingreses datos reales.</AppText>
        <AppInput label="Nombre del titular" value={holder} onChangeText={setHolder} autoCapitalize="words" maxLength={80} />
        <AppInput label="Número de tarjeta de ejemplo" value={cardNumber} onChangeText={value => setCardNumber(value.replace(/[^0-9 ]/g, '').slice(0, 23))} keyboardType="number-pad" maxLength={23} autoComplete="off" />
        <View style={styles.inlineFields}>
          <View style={styles.inlineField}><AppInput label="Vencimiento" placeholder="MM/AA" value={expiry} onChangeText={value => { const digits = value.replace(/\D/g, '').slice(0, 4); setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits); }} keyboardType="number-pad" maxLength={7} autoComplete="off" /></View>
          <View style={styles.inlineField}><AppInput label="Código" value={securityCode} onChangeText={value => setSecurityCode(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} autoComplete="off" /></View>
        </View>
      </PetCareCard>}

      {method === 'transfer' && <PetCareCard>
        <AppText variant="subtitle">Referencia demostrativa</AppText>
        <AppText variant="caption" muted>No ingreses ni envíes una transferencia real.</AppText>
        <AppInput label="Nombre del titular" value={holder} onChangeText={setHolder} autoCapitalize="words" maxLength={80} />
        <AppInput label="Referencia o número de operación de ejemplo" value={reference} onChangeText={setReference} maxLength={60} />
        <AppInput label="Observaciones (opcional)" value={notes} onChangeText={setNotes} maxLength={240} multiline numberOfLines={3} textAlignVertical="top" />
      </PetCareCard>}

      {method === 'wallet' && <PetCareCard>
        <AppText variant="subtitle">Billetera virtual</AppText>
        <AppText variant="caption" muted>No hay proveedores conectados. El campo es solo demostrativo.</AppText>
        <AppInput label="Usuario de ejemplo" value={walletUser} onChangeText={setWalletUser} maxLength={80} autoCapitalize="none" />
      </PetCareCard>}

      <FormNotice error message={error} />
      <AppButton label="Volver al carrito" variant="secondary" onPress={() => router.navigate('/client/store/cart')} />
    </>}

  </PetCareScreen>;
}

const styles = StyleSheet.create({
  cartButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  countBadge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 10, lineHeight: 13, fontWeight: '700' },
  stickyFooter: { paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerTotal: { flex: 1, minWidth: 0, gap: 2 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, summaryName: { flex: 1, minWidth: 0 },
  methodList: { gap: 10 }, methodCard: { minHeight: 76, padding: 14, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, methodCopy: { flex: 1, minWidth: 0, gap: 3 },
  inlineFields: { flexDirection: 'row', gap: 12 }, inlineField: { flex: 1, minWidth: 0 },
  resultScreen: { width: '100%', flexGrow: 1, justifyContent: 'center' },
  resultIcon: { width: 76, height: 76, borderRadius: 28, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', position: 'relative' }, resultAlert: { width: 25, height: 25, borderRadius: 13, position: 'absolute', top: -3, right: -3, alignItems: 'center', justifyContent: 'center' }, resultTitle: { textAlign: 'center' }, resultMessage: { textAlign: 'center' },
});
