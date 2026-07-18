import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, isReady } = useAuth();

  if (!isReady) return null;

  return (
    <Redirect
      href={user?.role === 'employee' ? '/admin/dashboard/employee' : user ? '/admin/dashboard' : '/login'}
    />
  );
}
