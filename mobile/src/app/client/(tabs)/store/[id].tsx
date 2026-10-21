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

  async function addToCart() {
    const amount = Number(quantity);
    const existing = cart.data?.items.find(item => item.id === id)?.quantity ?? 0;
    if (!Number.isInteger(amount) || amount < 1 || amount + existing > 99 || amount + existing > (query.data?.stock ?? 0)) {
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
    {query.data && <>
      <PetCareCard>
        <View style={[styles.productImageFrame, { backgroundColor: colors.accent }]}>
          {query.data.imageUrl ? <Image source={{ uri: query.data.imageUrl }} style={styles.productImage} resizeMode="contain" accessibilityLabel={`Imagen de ${query.data.name}`} /> : <Ionicons name="paw-outline" size={46} color={colors.muted} />}
        </View>
        {query.data.productType === 'MEDICINE' && <PetCareBadge label="Medicamento" />}
        {query.data.productType === 'ACCESSORY' && <PetCareBadge label="Accesorio" />}
        {!!query.data.category && <PetCareBadge label={query.data.category} />}
        <AppText variant="subtitle">{money(query.data.priceCents)}</AppText>
        {!!query.data.description && <AppText>{query.data.description}</AppText>}
        <AppText>{query.data.stock > 0 ? `${query.data.stock} unidades disponibles` : 'Sin stock disponible'}</AppText>
        <AppInput label="Cantidad" keyboardType="number-pad" value={quantity} onChangeText={value => setQuantity(value.replace(/[^0-9]/g, '').slice(0, 2))} />
      </PetCareCard>
      <FormNotice error message={error} />
      <AppButton label="Agregar al carrito" loading={saving || cart.loading} disabled={query.data.stock <= 0 || cart.loading || !cart.data} onPress={() => void addToCart()} />
      <AppButton label="Ver carrito" variant="secondary" onPress={() => router.push('/client/store/cart')} />
    </>}
  </PetCareScreen>;
}

const styles = StyleSheet.create({ cartButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, badge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, badgeText: { fontSize: 10, lineHeight: 13, fontWeight: '700' }, productImageFrame: { width: '100%', height: 220, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, productImage: { width: '100%', height: '100%' } });
