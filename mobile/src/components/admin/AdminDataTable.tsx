// Este archivo se encarga de lo siguiente: Componente reutilizable del área administrativa; organiza formularios, listas o controles de gestión.

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

// Función AdminDataTable: concentra la lógica dentro de este módulo.
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

// Función columnStyle: concentra la lógica dentro de este módulo.
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
