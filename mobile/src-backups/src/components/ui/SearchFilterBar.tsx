/** Agrupa campo de búsqueda, filtros y acción debajo en un único ancho de contenido. */
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function SearchFilterBar({children}:PropsWithChildren){
  return <View style={styles.container}>{children}</View>;
}

const styles=StyleSheet.create({container:{width:'100%',alignItems:'stretch',gap:10}});
