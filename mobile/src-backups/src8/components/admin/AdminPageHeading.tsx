import { AppText } from '../ui/AppText';
import { useAuth } from '../../hooks/useAuth';

export function AdminPageHeading({ title }: { title: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  return isAdmin ? null : <AppText variant="title">{title}</AppText>;
}
