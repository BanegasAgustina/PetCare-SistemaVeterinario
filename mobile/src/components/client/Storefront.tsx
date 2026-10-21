/** Presentación de catálogo, promociones vigentes y detalle de productos en la tienda cliente. */
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Product,PromotionBanner } from '../../types/client';
import { PetCareBadge, money } from './PetCareUI';
import { AppButton } from '../ui/AppButton';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { AppInput } from '../forms/AppInput';
import { FormNotice } from '../ui/FormNotice';
import { useTheme } from '../../hooks/useTheme';
import { softSurfaceShadow } from '../../constants/surface';

type StoreProductCardProps = { product: Product; adding: boolean; cartReady: boolean; onOpen: () => void; onAdd: () => void };

export function StoreProductCard({ product, adding, cartReady, onOpen, onAdd }: StoreProductCardProps) {
  const { colors } = useTheme();
  const kind = product.category || productTypeLabel(product.productType);
  return <View style={[styles.productCard, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={[styles.productImageFrame, { backgroundColor: colors.accent }]}>
      {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" accessibilityLabel={`Imagen de ${product.name}`} /> : <Ionicons name="paw-outline" size={34} color={colors.muted} accessible={false} />}
    </View>
    <AppText numberOfLines={2} variant="subtitle" style={styles.productName}>{product.name}</AppText>
    <View style={[styles.productBadge, { backgroundColor: colors.accent }]}><AppText numberOfLines={1} ellipsizeMode="tail" variant="caption" style={styles.productBadgeText}>{kind}</AppText></View>
    <View style={styles.priceBlock}>
      <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} variant="subtitle" style={styles.price}>{money(product.priceCents)}</AppText>
      {product.priceCents < product.regularPriceCents && <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} variant="caption" muted style={styles.oldPrice}>{money(product.regularPriceCents)}</AppText>}
      <AppText numberOfLines={1} variant="caption" muted>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}</AppText>
    </View>
    <View style={styles.cardActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver producto ${product.name}`} onPress={onOpen} style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}>
        <Ionicons name="eye-outline" size={18} color={colors.primary} /><AppText numberOfLines={1} style={styles.actionLabel}>Ver</AppText>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={product.stock > 0 ? `Agregar ${product.name} al carrito` : `${product.name}, sin stock`} accessibilityState={{ disabled: product.stock <= 0 || !cartReady || adding, busy: adding }} disabled={product.stock <= 0 || !cartReady || adding} onPress={onAdd} style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: product.stock <= 0 || !cartReady || adding ? 0.62 : pressed ? 0.8 : 1 }]}>
        {adding ? <AppText numberOfLines={1} style={[styles.actionLabel, { color: colors.onPrimary }]}>Agregando…</AppText> : product.stock > 0 ? <View style={styles.cartAddIcon}><Ionicons name="cart-outline" size={18} color={colors.onPrimary} /><Ionicons name="add" size={12} color={colors.onPrimary} style={[styles.cartPlus, { backgroundColor: colors.primary }]} /></View> : <AppText numberOfLines={1} style={[styles.actionLabel, { color: colors.onPrimary }]}>Sin stock</AppText>}
      </Pressable>
    </View>
  </View>;
}

export function PromotionCarousel({ products, onOpen }: { products: PromotionBanner[]; onOpen: (product: Product) => void }) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const width = measuredWidth || Math.max(1, Math.min(windowWidth - 40, 560));
  const imageWidth = Math.max(88, Math.round(width * 0.38));
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [active, setActive] = useState(0);
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    if (products.length < 2 || interacting) return;
    const timer = setInterval(() => {
      const next = (active + 1) % products.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActive(next);
    }, 6500);
    return () => clearInterval(timer);
  }, [active, interacting, products.length, width]);

  if (!products.length) return null;
  return <View onLayout={event => { const nextWidth = event.nativeEvent.layout.width; setMeasuredWidth(current => Math.abs(current - nextWidth) < 1 ? current : nextWidth); }} style={styles.promotionSection}>
    <ScrollView ref={scrollRef} horizontal pagingEnabled snapToInterval={width} decelerationRate="fast" showsHorizontalScrollIndicator={false} onScrollBeginDrag={() => setInteracting(true)} onScrollEndDrag={() => setInteracting(false)} onMomentumScrollEnd={event => { setActive(Math.round(event.nativeEvent.contentOffset.x / width)); setInteracting(false); }} scrollEventThrottle={16}>
      {products.map(product => <View key={product.id} style={[styles.promotionCard, { width, backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.promotionCopy}>
          <View style={[styles.promotionBadge, { backgroundColor: colors.accent }]}><AppText variant="caption" style={{ color: colors.text }}>Ahorra {discountPercentage(product)}%</AppText></View>
          <AppText numberOfLines={1} variant="subtitle" style={styles.promotionTitle}>{product.promotionName}</AppText>
          {!!product.bannerSubtitle && <AppText numberOfLines={1} variant="caption" muted>{product.bannerSubtitle}</AppText>}
          <View style={styles.promotionPrice}><AppText style={styles.promotionCurrent}>{money(product.priceCents)}</AppText><AppText variant="caption" muted style={styles.oldPrice}>{money(product.regularPriceCents)}</AppText></View>
          <AppButton compact variant="primary" label={product.bannerCtaText} onPress={() => onOpen(product)} />
        </View>
        <View style={[styles.promotionImageFrame, { width: imageWidth, height: 132, backgroundColor: colors.accent }]}>
          {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.promotionImage} resizeMode="contain" accessibilityLabel={`Imagen de ${product.name}`} /> : <Ionicons name="paw-outline" size={38} color={colors.muted} accessible={false} />}
        </View>
      </View>)}
    </ScrollView>
    {products.length > 1 && <View style={styles.dots} accessibilityLabel={`Promoción ${active + 1} de ${products.length}`}>
      {products.map((product, index) => <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={`Mostrar promoción ${index + 1}`} onPress={() => { setActive(index); scrollRef.current?.scrollTo({ x: index * width, animated: true }); }} style={[styles.dot, { backgroundColor: active === index ? colors.primary : colors.border }]} />)}
    </View>}
  </View>;
}

export function ProductDetailModal({ product, quantity, inCart, error, saving, cartReady, onQuantityChange, onClose, onAdd }: {
  product: Product | null; quantity: string; inCart: number; error: string | null; saving: boolean; cartReady: boolean;
  onQuantityChange: (value: string) => void; onClose: () => void; onAdd: () => void;
}) {
  const { colors } = useTheme();
  const kind = product ? productTypeLabel(product.productType) : '';
  const parsedQuantity = Number(quantity);
  const maxAdditional = product ? Math.max(0, Math.min(product.stock - inCart, 99 - inCart)) : 0;
  const quantityInvalid = !Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > maxAdditional;
  return <AppModal visible={Boolean(product)} dismissible onClose={onClose} footer={
    <AppButton variant="primary" label={product?.stock ? 'Agregar al carrito' : 'Sin stock'} loading={saving} disabled={!cartReady || !product || product.stock <= 0 || quantityInvalid} onPress={onAdd} />
  }>
    {product && <>
      <View style={styles.modalHeading}>
        <AppText variant="subtitle" style={styles.modalTitle}>{product.name}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle del producto" onPress={onClose} hitSlop={8} style={[styles.closeButton, { backgroundColor: colors.accent }]}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
      </View>
      <View style={[styles.modalImageFrame, { backgroundColor: colors.accent }]}>
        {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.modalImage} resizeMode="contain" accessibilityLabel={`Imagen de ${product.name}`} /> : <Ionicons name="paw-outline" size={54} color={colors.muted} accessible={false} />}
      </View>
      <View style={styles.badges}>
        <PetCareBadge label={kind} />
        {!!product.category && product.category !== kind && <PetCareBadge label={product.category} />}
        {product.requiresPrescription && <PetCareBadge label="Requiere receta vigente" />}
      </View>
      <View style={styles.modalPrice}>
        <AppText variant="title" style={styles.price}>{money(product.priceCents)}</AppText>
        {product.priceCents < product.regularPriceCents && <AppText variant="caption" muted style={styles.oldPrice}>Precio regular: {money(product.regularPriceCents)}</AppText>}
      </View>
      <AppText variant="subtitle">Descripción</AppText>
      <AppText>{product.description || 'Descripción no informada.'}</AppText>
      <AppText muted>{product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin stock disponible'}</AppText>
      {inCart > 0 && maxAdditional === 0 && <AppText muted>Ya tenés {inCart} {inCart === 1 ? 'unidad' : 'unidades'} en el carrito.</AppText>}
      {product.stock > 0 && maxAdditional > 0 && <View style={styles.quantitySection}>
        <AppText variant="subtitle">Cantidad</AppText>
        <View style={styles.quantityControl}>
          <Pressable accessibilityRole="button" accessibilityLabel="Reducir cantidad" disabled={parsedQuantity <= 1} onPress={() => onQuantityChange(String(Math.max(1, (Number.isInteger(parsedQuantity) ? parsedQuantity : 1) - 1)))} style={[styles.quantityStep, { backgroundColor: colors.accent, borderColor: colors.border, opacity: parsedQuantity <= 1 ? 0.5 : 1 }]}><Ionicons name="remove" size={20} color={colors.text} /></Pressable>
          <View style={styles.quantityValue}><AppInput compact label="Unidades" keyboardType="number-pad" value={quantity} onChangeText={value => onQuantityChange(value.replace(/[^0-9]/g, '').slice(0, 2))} /></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Aumentar cantidad" disabled={parsedQuantity >= maxAdditional} onPress={() => onQuantityChange(String(Math.min(maxAdditional, (Number.isInteger(parsedQuantity) ? parsedQuantity : 0) + 1)))} style={[styles.quantityStep, { backgroundColor: colors.accent, borderColor: colors.border, opacity: parsedQuantity >= maxAdditional ? 0.5 : 1 }]}><Ionicons name="add" size={20} color={colors.text} /></Pressable>
        </View>
        <AppText variant="caption" muted>Máximo {maxAdditional} {maxAdditional === 1 ? 'unidad' : 'unidades'} · Subtotal {money(product.priceCents * (Number.isInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0))}</AppText>
      </View>}
      <FormNotice error message={error} />
    </>}
  </AppModal>;
}

function productTypeLabel(type: Product['productType']) {
  if (type === 'MEDICINE') return 'Medicamento';
  if (type === 'ACCESSORY') return 'Accesorio';
  return 'Producto general';
}

function discountPercentage(product: Product) {
  if (product.regularPriceCents <= 0) return 0;
  return Math.round((1 - product.priceCents / product.regularPriceCents) * 100);
}

const styles = StyleSheet.create({
  productCard: { flex: 1, minHeight: 0, padding: 9, borderRadius: 18, borderWidth: 1, gap: 5 },
  productImageFrame: { width: '100%', aspectRatio: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' }, productName: { minHeight: 38, fontSize: 15, lineHeight: 19 }, productBadge: { maxWidth: '100%', alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 11 }, productBadgeText: { fontSize: 12, lineHeight: 16 },
  priceBlock: { gap: 0, marginTop: 'auto' }, price: { fontSize: 16, lineHeight: 21 }, oldPrice: { textDecorationLine: 'line-through', fontSize: 12, lineHeight: 16 },
  cardActions: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginTop: 4 },
  actionButton: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 5, paddingVertical: 4, flexDirection: 'row', gap: 4, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, lineHeight: 15, fontWeight: '700', textAlign: 'center' }, cartAddIcon: { position: 'relative' }, cartPlus: { position: 'absolute', right: -3, top: -3, borderRadius: 6 },
  promotionSection: { width: '100%', gap: 8 },
  promotionCard: { minHeight: 166, padding: 12, borderWidth: 1, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  promotionCopy: { flex: 1, minWidth: 0, gap: 4, alignItems: 'flex-start' }, promotionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }, promotionTitle: { fontSize: 17, lineHeight: 20 }, promotionPrice: { flexDirection: 'row', alignItems: 'center', gap: 7 }, promotionCurrent: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
  promotionImageFrame: { width: 94, height: 100, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, promotionImage: { width: '100%', height: '100%' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }, dot: { width: 8, height: 8, borderRadius: 4 },
  modalHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, modalTitle: { flex: 1, minWidth: 0 }, closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  modalImageFrame: { width: '100%', height: 190, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, modalImage: { width: '100%', height: '100%' }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, modalPrice: { gap: 2 },
  quantitySection: { gap: 8 }, quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 10 }, quantityStep: { width: 44, height: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, quantityValue: { width: 86 },
});
