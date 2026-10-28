// Este archivo se encarga de lo siguiente: Componente reutilizable del área administrativa; organiza formularios, listas o controles de gestión.

/** Bloques y acciones compartidos para que los formularios administrativos se recorran en un orden claro. */
import { Children, isValidElement, type PropsWithChildren } from 'react';
import { Platform,StyleSheet,View,useWindowDimensions } from 'react-native';
import { AppText } from '../ui/AppText';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

// Tipo AdminFormSectionProps: define la forma o las opciones válidas de los datos usados por este módulo.
type AdminFormSectionProps = PropsWithChildren<{ title: string; description?: string; columns?: 1 | 2 }>;

/** A consistent form section. `columns={2}` only switches to a grid on web/tablet widths. */
// Función AdminFormSection: concentra la lógica dentro de este módulo.
export function AdminFormSection({ title, description, columns = 1, children }: AdminFormSectionProps) {
  return <View style={styles.section}>
    <View style={styles.heading}>
      <AppText variant="subtitle">{title}</AppText>
      {Boolean(description) && <AppText variant="caption" muted>{description}</AppText>}
    </View>
    <AdminFormGrid columns={columns}>{children}</AdminFormGrid>
  </View>;
}

/** Responsive field grid used by sections and multi-panel admin forms. */
// Función AdminFormGrid: concentra la lógica dentro de este módulo.
export function AdminFormGrid({ children, columns = 2 }: PropsWithChildren<{ columns?: 1 | 2 }>) {
  const {width}=useWindowDimensions();
  const tablet=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);
  return <View style={[styles.fields,columns===2&&tablet&&styles.fieldsDesktop]}>{children}</View>;
}

/** Use around fields that need the full row inside a two-column section. */
// Función AdminFormField: concentra la lógica dentro de este módulo.
export function AdminFormField({ children, fullWidth = false, style }: PropsWithChildren<{ fullWidth?: boolean; style?: object }>) {
  const {width}=useWindowDimensions();
  const tablet=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);
  return <View style={[styles.fieldItem,tablet&&styles.fieldItemDesktop,tablet&&fullWidth&&styles.fieldFullWidth,style]}>{children}</View>;
}

// Función AdminFormActions: concentra la lógica dentro de este módulo.
export function AdminFormActions({ children }: PropsWithChildren) {
  const {width}=useWindowDimensions();
  const tablet=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);
  return <View style={[styles.actions,tablet&&styles.actionsDesktop]}>{tablet?Children.toArray(children).map((child,index)=><View key={isValidElement(child)?child.key??index:index} style={styles.actionItem}>{child}</View>):children}</View>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  section: { width: '100%', gap: 12, paddingTop: 4 },
  heading: { gap: 4 },
  fields: { width: '100%', gap: 12 },
  fieldsDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: responsiveLayout.form.gap },
  fieldItem: { width: '100%', minWidth: 0 },
  fieldItemDesktop: { flexGrow: 1, flexBasis: '48%', maxWidth: 560 },
  fieldFullWidth: { flexBasis: '100%', maxWidth: '100%' },
  actions: { width: '100%', gap: 9, paddingTop: 5 },
  actionsDesktop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: responsiveLayout.form.gap },
  actionItem: { flexGrow: 0, flexBasis: 160, minWidth: 140, maxWidth: 220 },
});
