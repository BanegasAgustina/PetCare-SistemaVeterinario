/**
 * ARCHIVO: ScreenContainer.tsx
 * UBICACIÓN: mobile/src/components/layout/ScreenContainer.tsx
 * FUNCIÓN: Contenedor de pantalla con ancho máximo, área segura y ajuste opcional al teclado.
 * RESPONSABILIDAD: Dar un marco consistente para páginas y formularios.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/components/client/PetCareDecorations.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 7 más
 * FUNCIONAMIENTO: Envuelve children, aplica dimensiones responsivas, decoraciones y comportamiento de teclado según props.
 * IMPORTANCIA: Centraliza reglas de superficie que necesitan todas las rutas.
 */
/** Contenedor desplazable que respeta notch y barra inferior en distintos celulares. */
import { useRef,useState,type ComponentRef,type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView,useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { PetCareDecorativeBackground } from '../client/PetCareDecorations';

/** Provee contenedor responsivo de pantalla y evita contenido bajo el teclado. */
export function ScreenContainer({ children, keyboardAvoiding = false, wide = false }: PropsWithChildren<{ keyboardAvoiding?: boolean; wide?: boolean }>) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const webTablet = isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet) && !isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const webDesktop = isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  const webLargeDesktop = isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.largeDesktop);
  const insets=useSafeAreaInsets();const scrollRef=useRef<ComponentRef<typeof ScrollView>>(null);const [showTop,setShowTop]=useState(false);
  const scroll = <><ScrollView nativeID={Platform.OS==='web'?'petcare-web-scroll-screen-container':undefined} ref={scrollRef} onScroll={event=>setShowTop(event.nativeEvent.contentOffset.y>560)} scrollEventThrottle={80} contentContainerStyle={[styles.content,wide&&styles.wideContent,webTablet&&styles.tabletContent,webDesktop&&(wide?styles.desktopWideContent:styles.desktopContent),webLargeDesktop&&wide&&styles.wideDesktopContent,webDesktop&&styles.desktopOverflow]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}</ScrollView>{showTop&&<Pressable accessibilityRole="button" accessibilityLabel="Volver arriba" onPress={()=>scrollRef.current?.scrollTo({y:0,animated:true})} style={[styles.scrollTop,{backgroundColor:colors.primary,bottom:14+insets.bottom}]}><Ionicons name="arrow-up" size={22} color={colors.onPrimary}/></Pressable>}</>;
  return (
    <SafeAreaView edges={['left','right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PetCareDecorativeBackground variant="care" />
      {/* iOS desplaza con padding; Android reduce la ventana con softwareKeyboardLayoutMode=resize. */}
      {keyboardAvoiding ? <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{scroll}</KeyboardAvoidingView> : scroll}
    </SafeAreaView>
  );
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: responsiveLayout.content.mobileMaxWidth, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 20, paddingBottom:80, gap: 18, overflow:'hidden' },
  wideContent: { maxWidth: 1100 },
  tabletContent: { maxWidth: responsiveLayout.content.tabletMaxWidth, paddingHorizontal: 24 },
  desktopContent: { maxWidth: 960, paddingHorizontal: 32 },
  desktopWideContent: { maxWidth: responsiveLayout.content.desktopMaxWidth, paddingHorizontal: 32 },
  wideDesktopContent: { maxWidth: responsiveLayout.content.desktopMaxWidth },
  desktopOverflow: { overflow: 'visible' },
  scrollTop:{position:'absolute',right:20,width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',elevation:5},
});
