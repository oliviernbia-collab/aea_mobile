import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import useBottomPadding from '../../hooks/useBottomPadding';

export default function Notifications() {
  const bottomPadding = useBottomPadding();
  const [notifications, setNotifications] = useState([]);

  const charger = async () => {
    const { data } = await api.get('/notifications');
    setNotifications(data);
  };

  useEffect(() => {
    charger();
    const socket = getSocket();
    const onNotif = (notif) => setNotifications((prev) => [notif, ...prev]);
    socket?.on('notification', onNotif);
    return () => socket?.off('notification', onNotif);
  }, []);

  const toutLire = async () => {
    await api.patch('/notifications/tout-lire');
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  const ouvrir = async (n) => {
    if (!n.lu) {
      await api.patch(`/notifications/${n.id}/lu`);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, lu: true } : x)));
    }
    if (n.lien) router.push(n.lien);
  };

  return (
    <View className="flex-1 bg-bgLight dark:bg-bgDark">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <Text className="font-semibold text-slate-900 dark:text-white">Notifications</Text>
        <Pressable onPress={toutLire}>
          <Text className="text-xs text-blue-700 dark:text-blue-300">Tout marquer lu</Text>
        </Pressable>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: bottomPadding }}
        ListEmptyComponent={<Text className="text-center text-sm text-slate-400 mt-8">Aucune notification.</Text>}
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => ouvrir(n)}
            className={`rounded-lg px-4 py-3 ${!n.lu ? 'bg-blue-50 dark:bg-slate-700/50' : 'bg-white dark:bg-slate-800'}`}
          >
            <Text className="font-medium text-slate-900 dark:text-white">{n.titre}</Text>
            {n.contenu ? (
              <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={2}>{n.contenu}</Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}
