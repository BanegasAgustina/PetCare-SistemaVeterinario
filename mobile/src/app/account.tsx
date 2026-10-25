import { AccountProfileScreen } from '../components/profile/AccountProfileScreen';
import { useLocalSearchParams } from 'expo-router';

export default function AccountScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const profileSection = section === 'personal' || section === 'security' || section === 'theme' ? section : 'all';
  return <AccountProfileScreen section={profileSection} />;
}
