/**
 * ARCHIVO: LoginPets.tsx
 * UBICACIÓN: mobile/src/components/layout/LoginPets.tsx
 * FUNCIÓN: Ilustración decorativa adaptable de mascotas para pantallas de acceso.
 * RESPONSABILIDAD: Acompañar login y registro sin interferir con el formulario.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/register.tsx, mobile/src/components/layout/LoginLayout.tsx
 * FUNCIONAMIENTO: Controla disposición inline, solo móvil o variante de registro mediante props y layout responsivo.
 * IMPORTANCIA: Aporta identidad visual sin almacenar ni procesar estado de autenticación.
 */
/** Franja inferior full bleed; el marco recorta solo los cuerpos. */
import { useEffect, useState } from 'react';
import { Image, Keyboard, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
// Dato artwork: conserva un valor calculado o de configuración usado por este módulo.
const artwork = require('../../assets/auth-pets.png');
/** Ajusta la ilustración decorativa según la variante y el ancho de pantalla. */
export function LoginPets({ registration = false, inline = false, mobileOnly = false }: { registration?: boolean; inline?: boolean; mobileOnly?: boolean }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    if (!inline) return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, [inline]);
  if (mobileOnly && isWebAtLeast(Platform.OS, width, responsiveLayout.breakpoints.authDesktop)) return null;
  if (!registration) {
    const imageHeight = width * 703 / 1152;
    return <View accessible={false} style={[styles.frame, { width, height: imageHeight, transform: [{ translateY: -50 }] }]}>
      <View style={[styles.shape, { backgroundColor: colors.accent }]} />
      <Image source={require('../../assets/login-full-pets.png')} resizeMode="contain" style={{ position: 'absolute', top: 0, width, height: imageHeight }} />
    </View>;
  }
  if (inline && keyboardOpen) return null;
  const imageWidth = inline ? Math.max(0, width - 40) : width;
  const imageHeight = imageWidth * 745 / 2110;
  return <View accessible={false} style={[styles.frame, inline && styles.inlineArtwork, { width: imageWidth, height: imageHeight }]}>
    <Image source={artwork} resizeMode="contain" style={styles.registrationImage} />
  </View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  frame: { pointerEvents: 'none', flexShrink: 0, overflow: 'hidden', alignSelf: 'center' },
  inlineArtwork: { overflow: 'visible', transform: [{ translateY: -15 }] },
  registrationImage: { width: '100%', height: '100%' },
  shape: { position: 'absolute', bottom: 0, width: '100%', height: '55%', borderTopLeftRadius: 100, borderTopRightRadius: 100, opacity: 0.5 },
});
