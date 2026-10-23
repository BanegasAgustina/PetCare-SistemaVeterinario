/** Bloques y acciones compartidos para que los formularios administrativos se recorran en un orden claro. */
import { Children,type PropsWithChildren,isValidElement } from 'react';
import { Platform,StyleSheet,View,useWindowDimensions } from 'react-native';
import { AppText } from '../ui/AppText';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

export function AdminFormSection({ title, description, children }: PropsWithChildren<{ title: string; description?: string }>) {
  const {width}=useWindowDimensions();
  const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  return <View style={styles.section}>
    <View style={styles.heading}>
      <AppText variant="subtitle">{title}</AppText>
      {Boolean(description) && <AppText variant="caption" muted>{description}</AppText>}
    </View>
    <View style={[styles.fields,desktop&&styles.fieldsDesktop]}>{desktop?Children.toArray(children).map((child,index)=><View key={isValidElement(child)?child.key??index:index} style={styles.fieldItem}>{child}</View>):children}</View>
  </View>;
}

export function AdminFormActions({ children }: PropsWithChildren) {
  const {width}=useWindowDimensions();
  const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  return <View style={[styles.actions,desktop&&styles.actionsDesktop]}>{desktop?Children.toArray(children).map((child,index)=><View key={isValidElement(child)?child.key??index:index} style={styles.actionItem}>{child}</View>):children}</View>;
}

const styles = StyleSheet.create({
  section: { width: '100%', gap: 13, paddingTop: 5 },
  heading: { gap: 4 },
  fields: { width: '100%', gap: 12 },
  fieldsDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: responsiveLayout.form.gap },
  fieldItem: { flexGrow: 1, flexBasis: responsiveLayout.form.minFieldWidth, minWidth: responsiveLayout.form.minFieldWidth },
  actions: { width: '100%', gap: 9, paddingTop: 5 },
  actionsDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: responsiveLayout.form.gap },
  actionItem: { flexGrow: 1, flexBasis: responsiveLayout.form.minFieldWidth, minWidth: responsiveLayout.form.minFieldWidth },
});
