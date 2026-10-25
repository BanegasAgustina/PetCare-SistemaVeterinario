import { AppText } from '../ui/AppText';
import { useAuth } from '../../hooks/useAuth';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { BackButton } from '../layout/BackButton';
import { View } from 'react-native';

export function AdminPageHeading({ title }: { title: string }) {
  const { user } = useAuth();
  const { shouldShowBack } = useBackNavigation();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  if (isAdmin) return null;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    {shouldShowBack && <BackButton />}
    <AppText variant="title" style={{ flex: 1, minWidth: 0 }}>{title}</AppText>
  </View>;
}
