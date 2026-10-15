import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

export default function TopBar({ navigation }) {
  const { user, isBureau } = useAuth();
  const { dark, toggleDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-primary flex-row items-center justify-between px-3"
      style={{ paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4), paddingBottom: 10 }}
    >
      <Pressable onPress={() => navigation.openDrawer()} hitSlop={8} className="p-2">
        <FontAwesome6 name="bars" size={18} color="#ffffff" />
      </Pressable>

      <View className="flex-1 items-center">
        <Logo size={28} showText={false} />
        <Text className="text-white text-xs font-semibold mt-0.5" numberOfLines={1}>
          {isBureau ? 'Espace Bureau' : 'Espace Membre'} - {user?.prenom}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Pressable onPress={toggleDark} hitSlop={8} className="p-2">
          <FontAwesome6 name={dark ? 'sun' : 'moon'} size={16} color="#ffffff" />
        </Pressable>
        <NotificationBell />
        <Pressable onPress={() => router.push('/mon-profil')} hitSlop={8} className="p-2">
          <FontAwesome6 name="circle-user" size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
