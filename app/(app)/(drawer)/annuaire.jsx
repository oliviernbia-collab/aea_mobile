import { useEffect, useState } from 'react';
import { FlatList, Image, Text, TextInput, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../services/api';
import useLiveRefresh from '../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../hooks/useBottomPadding';
import { resolveMediaUrl } from '../../../utils/media';

export default function Annuaire() {
  const bottomPadding = useBottomPadding();
  const [membres, setMembres] = useState([]);
  const [q, setQ] = useState('');

  const charger = async () => {
    const { data } = await api.get('/membres', { params: q ? { q } : {} });
    setMembres(data);
  };

  useEffect(() => {
    const timeout = setTimeout(charger, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useLiveRefresh('membres:update', charger);

  return (
    <View className="flex-1 bg-bgLight dark:bg-bgDark">
      <FlatList
        data={membres}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPadding }}
        ListHeaderComponent={
          <View className="gap-4 mb-2">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Annuaire des membres</Text>
            <View className="relative flex-row items-center">
              <FontAwesome6 name="magnifying-glass" size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, zIndex: 1 }} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Rechercher un membre..."
                placeholderTextColor="#94a3b8"
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 py-2.5 pl-9 pr-3 text-sm"
              />
            </View>
          </View>
        }
        ListEmptyComponent={<Text className="text-sm text-slate-400">Aucun membre trouve.</Text>}
        renderItem={({ item: m }) => (
          <View className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow flex-row items-center gap-3">
            {m.photo ? (
              <Image source={{ uri: resolveMediaUrl(m.photo) }} className="w-12 h-12 rounded-full" />
            ) : (
              <FontAwesome6 name="circle-user" size={36} color="#cbd5e1" />
            )}
            <View>
              <Text className="font-medium text-sm text-slate-900 dark:text-white">{m.prenom} {m.nom}</Text>
              <Text className="text-xs text-slate-400">{m.numero_membre}</Text>
              {m.filiere ? <Text className="text-xs text-slate-400">{m.filiere} - {m.promotion}</Text> : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}
