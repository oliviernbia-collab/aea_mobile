import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// Stack englobant : garde d'authentification, puis le Drawer (groupe (drawer)) comme ecran
// principal et la modale "notifications" poussee par-dessus - un Drawer ne peut pas heberger
// directement un ecran modal, d'ou ce Stack parent (pattern standard React Navigation).
export default function AppLayout() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: true, title: 'Notifications' }} />
    </Stack>
  );
}
