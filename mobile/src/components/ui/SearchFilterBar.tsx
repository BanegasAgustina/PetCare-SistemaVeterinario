/** Agrupa campo de búsqueda, filtros y acción debajo en un único ancho de contenido. */
import { Children,type PropsWithChildren } from 'react';
import { Platform,StyleSheet,View,useWindowDimensions } from 'react-native';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

export function SearchFilterBar({children}:PropsWithChildren){
  const {width}=useWindowDimensions();
  const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  return <View style={[styles.container,desktop&&styles.desktopContainer]}>{desktop?Children.toArray(children).map((child,index)=><View key={index} style={styles.desktopItem}>{child}</View>):children}</View>;
}

const styles=StyleSheet.create({container:{width:'100%',alignItems:'stretch',gap:10},desktopContainer:{flexDirection:'row',flexWrap:'wrap',alignItems:'flex-end'},desktopItem:{flexGrow:1,flexBasis:responsiveLayout.form.minFieldWidth,minWidth:responsiveLayout.form.minFieldWidth,maxWidth:'100%'}});
