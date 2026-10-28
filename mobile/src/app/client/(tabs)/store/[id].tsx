// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/** Detalle del catálogo y alta en el carrito real; el servidor vuelve a comprobar stock y precio. */
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useClient } from '../../../../hooks/useClient';
import { useClientQuery } from '../../../../hooks/useClientQuery';
import { useFeedback } from '../../../../contexts/FeedbackContext';
import { PetCareBadge, PetCareCard, PetCareHeader, PetCareScreen, QueryState, money } from '../../../../components/client/PetCareUI';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppInput } from '../../../../components/forms/AppInput';
import { AppText } from '../../../../components/ui/AppText';
import { FormNotice } from '../../../../components/ui/FormNotice';
import { useTheme } from '../../../../hooks/useTheme';

// Función ProductDetail: concentra la lógica dentro de este módulo.
export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useClient();
  const query = useClientQuery(useCallback(() => api.product(id), [api, id]));
  const cart = useClientQuery(api.cart);
  const { colors } = useTheme();
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useFeedback();
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const inCart = cart.data?.items.find(item => item.id === id)?.quantity ?? 0;
  const maxAdditional = query.data ? Math.max(0, Math.min(query.data.stock - inCart, 99 - inCart)) : 0;
  const amount = Number(quantity);
  const quantityInvalid = !Number.isInteger(amount) || amount < 1 || amount > maxAdditional;

  // Función addToCart: crea un registro o inicia una operación dentro de este módulo.
async function addToCart() {
    const existing = cart.data?.items.find(item => item.id === id)?.quantity ?? 0;
    if (!cart.data || !query.data || !Number.isInteger(amount) || amount < 1 || amount > 99 || amount + existing > 99 || amount + existing > query.data.stock) {
      setError('Ingresá una cantidad válida dentro del stock disponible.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateCart(id, existing + amount);
      showToast('Producto agregado al carrito', 'success');
      router.push('/client/store/cart');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo agregar el producto.');
    } finally {
      setSaving(false);
    }
  }

  return <PetCareScreen wide tabbed>
    <PetCareHeader title={query.data?.name ?? 'Producto'} back right={<Pressable accessibilityRole="button" accessibilityLabel={`Carrito, ${cartCount} artículos`} onPress={() => router.push('/client/store/cart')} style={[styles.cartButton, { backgroundColor: colors.accent }]}><Ionicons name="cart-outline" size={22} color={colors.text} />{cartCount > 0 && <View style={[styles.badge, { backgroundColor: colors.accent }]}><AppText style={[styles.badgeText, { color: colors.text }]}>{cartCount > 99 ? '99+' : cartCount}</AppText></View>}</Pressable>} />
    
<QueryState {...query} />
    
<QueryState {...cart} />
    {query.data && <>
      <PetCareCard>
        <View style={[styles.productImageFrame, { backgroundColor: colors.accent }]}>
          {query.data.imageUrl ? <Image source={{ uri: query.data.imageUrl }} style={styles.productImage} resizeMode="contain" accessibilityLabel={`Imagen de ${query.data.name}`} /> : <Ionicons name="paw-outline" size={46} color={colors.muted} />}
        </View>
        <View style={styles.badges}>
          {query.data.productType === 'MEDICINE' && <PetCareBadge label="Medicamento" />}
          {query.data.productType === 'ACCESSORY' && <PetCareBadge label="Accesorio" />}
          {!!query.data.category && <PetCareBadge label={query.data.category} />}
          {query.data.priceCents < query.data.regularPriceCents && <PetCareBadge label="Promoción vigente" />}
        </View>
        <View style={styles.priceBlock}><AppText variant="title">{money(query.data.priceCents)}</AppText>{query.data.priceCents < query.data.regularPriceCents && <AppText variant="caption" muted style={styles.oldPrice}>Precio regular: {money(query.data.regularPriceCents)}</AppText>}</View>
        <AppText variant="subtitle">Descripción</AppText>
        <AppText>{query.data.description || 'Descripción no informada.'}</AppText>
        <AppText>{query.data.stock > 0 ? `${query.data.stock} unidades disponibles` : 'Sin stock disponible'}</AppText>
        {query.data.stock > 0 && maxAdditional > 0 && <View style={styles.quantitySection}>
          <AppText variant="subtitle">Cantidad</AppText>
          <View style={styles.quantityControl}>
            <Pressable accessibilityRole="button" accessibilityLabel="Reducir cantidad" accessibilityState={{ disabled: amount <= 1 }} disabled={amount <= 1} onPress={() => setQuantity(String(Math.max(1, (Number.isInteger(amount) ? amount : 1) - 1)))} style={[styles.quantityStep,{backgroundColor:colors.accent,borderColor:colors.border,opacity:amount<=1?0.5:1}]}><Ionicons name="remove" size={20} color={colors.text}/></Pressable>
            <View style={styles.quantityInput}><AppInput compact label="Cantidad" required keyboardType="number-pad" value={quantity} error={quantityInvalid?'Elegí una cantidad entre 1 y el máximo disponible.':undefined} onChangeText={value => setQuantity(value.replace(/[^0-9]/g, '').slice(0, 2))} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Aumentar cantidad" accessibilityState={{ disabled: amount >= maxAdditional }} disabled={amount >= maxAdditional} onPress={() => setQuantity(String(Math.min(maxAdditional, (Number.isInteger(amount) ? amount : 0) + 1)))} style={[styles.quantityStep,{backgroundColor:colors.accent,borderColor:colors.border,opacity:amount>=maxAdditional?0.5:1}]}><Ionicons name="add" size={20} color={colors.text}/></Pressable>
          </View>
          <AppText variant="caption" muted>Máximo {maxAdditional} {maxAdditional===1?'unidad':'unidades'} · Subtotal {money(query.data.priceCents*(Number.isInteger(amount)&&amount>0?amount:0))}</AppText>
        </View>}
        {inCart > 0 && maxAdditional === 0 && <AppText muted>Ya tenés {inCart} {inCart === 1 ? 'unidad' : 'unidades'} en el carrito.</AppText>}
      </PetCareCard>
      <FormNotice error message={error} />
      <AppButton label={query.data.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'} loading={saving || cart.loading} disabled={query.data.stock <= 0 || cart.loading || !cart.data || saving || quantityInvalid || maxAdditional === 0} onPress={() => void addToCart()} />
      <AppButton label="Ver carrito" variant="secondary" onPress={() => router.push('/client/store/cart')} />
    </>}
  </PetCareScreen>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ cartButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, badge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, badgeText: { fontSize: 10, lineHeight: 13, fontWeight: '700' }, productImageFrame: { width: '100%', height: 220, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, productImage: { width: '100%', height: '100%' },badges:{flexDirection:'row',flexWrap:'wrap',gap:7},priceBlock:{gap:2},oldPrice:{textDecorationLine:'line-through'},quantitySection:{gap:8},quantityControl:{flexDirection:'row',alignItems:'center',gap:8},quantityStep:{width:44,height:44,borderWidth:1,borderRadius:13,alignItems:'center',justifyContent:'center'},quantityInput:{flex:1,minWidth:80} });
