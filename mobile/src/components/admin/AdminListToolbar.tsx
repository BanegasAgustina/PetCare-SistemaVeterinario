import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { FilterDisclosure } from '../ui/FilterDisclosure';

type Props = {
  search?: ReactNode;
  sort?: ReactNode;
  filters?: ReactNode;
  filterCount?: number;
  onApply?: () => void;
  onClear?: () => void;
  onFilterOpen?: () => void;
  onFilterCancel?: () => void;
  actions?: ReactNode;
};

/** Compact list controls with a single responsive arrangement for search, sorting, filters, and actions. */
export function AdminListToolbar({ search, sort, filters, filterCount = 0, onApply = () => undefined, onClear = () => undefined, onFilterOpen, onFilterCancel, actions }: Props) {
  const { width } = useWindowDimensions();
  const tablet = isWebAtLeast(Platform.OS, width, responsiveLayout.breakpoints.tablet);
  const desktop = isWebAtLeast(Platform.OS, width, responsiveLayout.breakpoints.desktop);
  return <View accessibilityRole="toolbar" style={[styles.container, tablet && styles.tablet, desktop && styles.desktop]}>
    {search&&<View style={[styles.search, desktop && styles.searchDesktop]}>{search}</View>}
    {sort && <View style={[styles.sort, tablet && styles.sortTablet, desktop && styles.sortDesktop]}>{sort}</View>}
    {filters && <View style={[styles.filters, tablet && styles.filtersTablet]}><FilterDisclosure activeCount={filterCount} onApply={onApply} onClear={onClear} onOpen={onFilterOpen} onCancel={onFilterCancel} fullWidth={!tablet}>{filters}</FilterDisclosure></View>}
    {actions && <View style={[styles.actions, desktop&&styles.actionsDesktop]}>{actions}</View>}
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 10, alignItems: 'stretch' },
  tablet: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  desktop: { flexWrap: 'nowrap', gap: 12 },
  search: { width: '100%', minWidth: 0 },
  searchDesktop: { flex: 1, flexBasis: 280, maxWidth: 760 },
  sort: { width: '100%', minWidth: 0 },
  sortTablet: { flexGrow: 0, flexBasis: 220, maxWidth: 300 },
  sortDesktop: { flex: 0, flexBasis: 220 },
  filters: { width: '100%', minWidth: 0 },
  filtersTablet: { width: 'auto', flexGrow: 0, flexBasis: 'auto' },
  actions: { width: '100%', minWidth: 0 },
  actionsDesktop: { width: 'auto', flexGrow: 0, flexShrink: 0, maxWidth: 360, alignItems: 'flex-end' },
});
