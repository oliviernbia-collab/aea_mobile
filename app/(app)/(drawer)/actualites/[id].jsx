import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../../services/api';
import useBottomPadding from '../../../../hooks/useBottomPadding';
import { resolveMediaUrl } from '../../../../utils/media';

export default function ActualiteDetail() {
  const { id } = useLocalSearchParams();
  const bottomPadding = useBottomPadding();
  const [actu, setActu] = useState(null);

  useEffect(() => {
    api.get(`/actualites/${id}`).then(({ data }) => setActu(data));
  }, [id]);

  if (!actu) {
    return (
      <View className="flex-1 items-center justify-center bg-bgLight dark:bg-bgDark">
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPadding }}>
      <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
        <FontAwesome6 name="arrow-left" size={12} color="#1d4ed8" />
        <Text className="text-sm text-blue-700 dark:text-blue-300">Retour aux actualites</Text>
      </Pressable>
      <View className="rounded-xl bg-white dark:bg-slate-800 shadow overflow-hidden">
        {actu.image ? <Image source={{ uri: resolveMediaUrl(actu.image) }} className="w-full h-56" resizeMode="cover" /> : null}
        <View className="p-5">
          {actu.epingle ? (
            <View className="flex-row items-center gap-1 mb-2">
              <FontAwesome6 name="thumbtack" size={10} color="#d97706" />
              <Text className="text-xs font-semibold text-amber-600">Epingle</Text>
            </View>
          ) : null}
          <Text className="text-xl font-bold text-slate-900 dark:text-white">{actu.titre}</Text>
          <Text className="text-xs text-slate-400 mt-1 mb-3">
            {actu.auteur_prenom} {actu.auteur_nom} - {new Date(actu.created_at).toLocaleDateString('fr-FR')}
          </Text>
          <Text className="text-slate-700 dark:text-slate-300">{actu.texte}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
