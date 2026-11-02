/**
 * ARCHIVO: AdminDataTable.tsx
 * UBICACIÓN: mobile/src/components/admin/AdminDataTable.tsx
 * FUNCIÓN: Tabla adaptable y genérica para filas administrativas o clínicas.
 * RESPONSABILIDAD: Renderizar columnas configurables con estilos y acciones definidos por cada listado.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/orders/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AvailabilityScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx y 2 más
 * FUNCIONAMIENTO: Recibe filas, columnas y clave; calcula estilo de columna y crea celdas usando renderizadores opcionales y tema.
 * IMPORTANCIA: Permite compartir tablas sin acoplarlas a entidades concretas.
 */
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';
import { responsiveLayout } from '../../constants/responsive';

// Tipo AdminDataTableColumn: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminDataTableColumn<Row> = {
  key: string;
  label: string;
  flex?: number;
  minWidth?: number;
  align?: 'left' | 'right';
  render: (row: Row) => ReactNode;
};

/** Renderiza las filas y sus columnas con contenido adaptable a pantalla. */
export function AdminDataTable<Row>({
  columns,
  rows,
  rowKey,
  compact = false,
}: {
  columns: AdminDataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cellPadding = Platform.OS === 'web' && width < responsiveLayout.table.compactBefore
    ? responsiveLayout.table.compactCellPadding
    : responsiveLayout.table.comfortableCellPadding;
  return (
    <View accessibilityRole="table" style={[styles.table, compact && styles.compactTable, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View accessibilityRole="row" style={[styles.header, compact && styles.compactHeader, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}>
        {columns.map(column => (
          <View key={column.key} accessibilityRole="columnheader" style={[styles.cell, styles.headerCell, compact && styles.compactCell, { paddingHorizontal: compact ? 10 : cellPadding }, columnStyle(column)]}>
            <AppText variant="caption" muted numberOfLines={1}>{column.label}</AppText>
          </View>
        ))}
      </View>
      {rows.map((row,index) => (
        <View key={rowKey(row)} accessibilityRole="row" style={[styles.row, compact && styles.compactRow, { borderBottomColor: colors.border }, index === rows.length - 1 && styles.lastRow]}>
          {columns.map(column => (
            <View key={column.key} accessibilityRole="cell" style={[styles.cell, compact && styles.compactCell, { paddingHorizontal: compact ? 10 : cellPadding }, column.align === 'right' && styles.alignRight, columnStyle(column)]}>
              {column.render(row)}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Devuelve la alineación y el ancho que cada columna declara.
function columnStyle<Row>(column: AdminDataTableColumn<Row>) {
  return { flex: column.flex ?? 1, minWidth: column.minWidth ?? 0 };
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  table: { width: '100%', overflow: 'hidden', borderWidth: 1, borderRadius: 14 },compactTable:{borderRadius:12},
  header: { minHeight: 42, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  compactHeader: { minHeight: 38 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  compactRow: { minHeight: 58 },
  lastRow: { borderBottomWidth: 0 },
  cell: { minWidth: 0, paddingHorizontal: 12, paddingVertical: 9 },
  compactCell: { paddingVertical: 7 },
  headerCell: { justifyContent: 'center' },
  alignRight: { alignItems: 'flex-end' },
});
