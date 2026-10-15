import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function NotificationBell({ color = '#ffffff' }) {
  const [nonLues, setNonLues] = useState(0);

  const charger = async () => {
    const { data } = await api.get('/notifications');
    setNonLues(data.filter((n) => !n.lu).length);
  };

  useEffect(() => {
    charger();
    const socket = getSocket();
    const onNotif = () => setNonLues((n) => n + 1);
    socket?.on('notification', onNotif);
    return () => socket?.off('notification', onNotif);
  }, []);

  return (
    <Pressable onPress={() => router.push('/notifications')} className="relative rounded-full p-2" hitSlop={8}>
      <FontAwesome6 name="bell" size={18} color={color} />
      {nonLues > 0 && (
        <View className="absolute -top-0.5 -right-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1">
          <Text className="text-[10px] font-bold text-white">{nonLues > 9 ? '9+' : nonLues}</Text>
        </View>
      )}
    </Pressable>
  );
}
