/** Contenedor desplazable que respeta notch y barra inferior en distintos celulares. */
import { useRef,useState,type ComponentRef,type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView,useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export function ScreenContainer({ children, keyboardAvoiding = false, wide = false }: PropsWithChildren<{ keyboardAvoiding?: boolean; wide?: boolean }>) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const webTablet = Platform.OS === 'web' && width >= 768 && width < 1024;
  const webDesktop = Platform.OS === 'web' && width >= 1024;
  const insets=useSafeAreaInsets();const scrollRef=useRef<ComponentRef<typeof ScrollView>>(null);const [showTop,setShowTop]=useState(false);
  const scroll = <><ScrollView ref={scrollRef} onScroll={event=>setShowTop(event.nativeEvent.contentOffset.y>560)} scrollEventThrottle={80} contentContainerStyle={[styles.content,wide&&styles.wideContent,webTablet&&styles.tabletContent,webDesktop&&styles.desktopContent,webDesktop&&wide&&styles.wideDesktopContent]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"><View pointerEvents="none" accessible={false} style={styles.decoration}><Ionicons name="paw" size={25} color={colors.muted}/><Ionicons name="paw" size={19} color={colors.muted}/><Ionicons name="paw" size={29} color={colors.muted}/></View>{children}</ScrollView>{showTop&&<Pressable accessibilityRole="button" accessibilityLabel="Volver arriba" onPress={()=>scrollRef.current?.scrollTo({y:0,animated:true})} style={[styles.scrollTop,{backgroundColor:colors.primary,bottom:14+insets.bottom}]}><Ionicons name="arrow-up" size={22} color={colors.onPrimary}/></Pressable>}</>;
  return (
    <SafeAreaView edges={['left','right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* iOS desplaza con padding; Android reduce la ventana con softwareKeyboardLayoutMode=resize. */}
      {keyboardAvoiding ? <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{scroll}</KeyboardAvoidingView> : scroll}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 20, paddingBottom:80, gap: 18, overflow:'hidden' },
  wideContent: { maxWidth: 1100 },
  tabletContent: { maxWidth: 960, paddingHorizontal: 24 },
  desktopContent: { maxWidth: 1320, paddingHorizontal: 32 },
  wideDesktopContent: { maxWidth: 1500 },
  decoration:{position:'absolute',top:115,right:12,opacity:0.07,gap:25,alignItems:'flex-end'},
  scrollTop:{position:'absolute',right:20,width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',elevation:5},
});
