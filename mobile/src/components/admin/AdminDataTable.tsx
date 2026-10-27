import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';
import { responsiveLayout } from '../../constants/responsive';

export type AdminDataTableColumn<Row> = {
  key: string;
  label: string;
  flex?: number;
  minWidth?: number;
  align?: 'left' | 'right';
  render: (row: Row) => ReactNode;
};

export function AdminDataTable<Row>({
  columns,
  rows,
  rowKey,
}: {
  columns: AdminDataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cellPadding = Platform.OS === 'web' && width < responsiveLayout.table.compactBefore
    ? responsiveLayout.table.compactCellPadding
    : responsiveLayout.table.comfortableCellPadding;
  return (
    <View accessibilityRole="table" style={[styles.table, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View accessibilityRole="row" style={[styles.header, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}>
        {columns.map(column => (
          <View key={column.key} accessibilityRole="columnheader" style={[styles.cell, styles.headerCell, { paddingHorizontal: cellPadding }, columnStyle(column)]}>
            <AppText variant="caption" muted numberOfLines={1}>{column.label}</AppText>
          </View>
        ))}
      </View>
      {rows.map((row,index) => (
        <View key={rowKey(row)} accessibilityRole="row" style={[styles.row, { borderBottomColor: colors.border }, index === rows.length - 1 && styles.lastRow]}>
          {columns.map(column => (
            <View key={column.key} accessibilityRole="cell" style={[styles.cell, { paddingHorizontal: cellPadding }, column.align === 'right' && styles.alignRight, columnStyle(column)]}>
              {column.render(row)}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function columnStyle<Row>(column: AdminDataTableColumn<Row>) {
  return { flex: column.flex ?? 1, minWidth: column.minWidth ?? 0 };
}

const styles = StyleSheet.create({
  table: { width: '100%', overflow: 'hidden', borderWidth: 1, borderRadius: 14 },
  header: { minHeight: 42, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  lastRow: { borderBottomWidth: 0 },
  cell: { minWidth: 0, paddingHorizontal: 12, paddingVertical: 9 },
  headerCell: { justifyContent: 'center' },
  alignRight: { alignItems: 'flex-end' },
});
