import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const NAV_ITEMS = [
  { to: '/accueil', label: 'Accueil', icon: 'house', permission: null },
  { to: '/caisse', label: 'Caisse', icon: 'wallet', permission: null },
  { to: '/cotisations', label: 'Cotisations', icon: 'table-list', permission: null },
  { to: '/ma-fiche-cotisation', label: 'Ma cotisation', icon: 'user-check', permission: null },
  { to: '/actualites', label: 'Actualites', icon: 'newspaper', permission: null },
  { to: '/messagerie', label: 'Messagerie', icon: 'comments', permission: null },
  { to: '/annuaire', label: 'Annuaire', icon: 'address-book', permission: null },
  { to: '/saisie-financiere', label: 'Saisie financiere', icon: 'file-invoice-dollar', permission: 'saisie_financiere.acceder' },
  { to: '/administration', label: 'Administration', icon: 'gear', permission: 'administration.acceder' },
  { to: '/journal-activite', label: "Journal d'activite", icon: 'clock-rotate-left', permission: 'journal.consulter' },
  { to: '/gestion-permissions', label: 'Gestion des permissions', icon: 'user-shield', permission: 'permissions.gerer' },
];

export default function DrawerContent(props) {
  const { user, logout, hasPermission } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const items = NAV_ITEMS.filter(
    (item) => !item.permission || user?.role === 'super_admin' || hasPermission(item.permission)
  );

  const aller = (to) => {
    props.navigation.closeDrawer();
    router.push(to);
  };

  const handleLogout = async () => {
    props.navigation.closeDrawer();
    await logout();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-primary" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-5">
        <Logo />
      </View>

      <Pressable
        onPress={() => aller('/')}
        className="mx-2 mb-2 flex-row items-center gap-3 rounded-lg border border-white/20 px-3 py-2.5"
      >
        <FontAwesome6 name="globe" size={14} color="#dbeafe" />
        <Text className="text-sm text-blue-100">Page d&apos;accueil du site</Text>
      </Pressable>

      <ScrollView className="flex-1 px-2">
        {items.map((item) => {
          const actif = pathname === item.to;
          return (
            <Pressable
              key={item.to}
              onPress={() => aller(item.to)}
              className={`flex-row items-center gap-3 rounded-lg px-3 py-2.5 mb-0.5 ${actif ? 'bg-white/15' : ''}`}
            >
              <FontAwesome6 name={item.icon} size={14} color={actif ? '#ffffff' : '#bfdbfe'} />
              <Text className={`text-sm ${actif ? 'text-white font-semibold' : 'text-blue-100'}`}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={handleLogout}
        className="m-2 flex-row items-center gap-3 rounded-lg px-3 py-2.5"
        style={{ marginBottom: insets.bottom + 8 }}
      >
        <FontAwesome6 name="right-from-bracket" size={14} color="#fca5a5" />
        <Text className="text-sm text-red-300">Deconnexion</Text>
      </Pressable>
    </View>
  );
}
