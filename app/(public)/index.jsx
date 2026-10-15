import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import CarteAEA from '../../components/CarteAEA';
import useBottomPadding from '../../hooks/useBottomPadding';
import { resolveMediaUrl } from '../../utils/media';

const CATEGORIE_LABEL = {
  annonce_officielle: 'Annonce officielle',
  vie_academique: 'Vie academique',
  culture: 'Culture',
  social: 'Social',
  opportunites: 'Opportunites',
};

const ARGUMENTS = [
  { icon: 'wallet', titre: 'Transparence financiere', texte: 'Solde de la caisse visible par tous' },
  { icon: 'table-list', titre: 'Suivi des cotisations', texte: 'Mois par mois, pour chaque membre' },
  { icon: 'comments', titre: 'Communication centralisee', texte: 'Messages et actualites en un seul endroit' },
];

export default function AccueilPublic() {
  const { user } = useAuth();
  const bottomPadding = useBottomPadding(32);
  const [actus, setActus] = useState([]);

  useEffect(() => {
    api.get('/actualites/publiques').then(({ data }) => setActus(data));
  }, []);

  return (
    <View className="flex-1 bg-bgLight dark:bg-bgDark">
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding }}>
        <View className="bg-primary px-4 pt-14 pb-10">
          <View className="flex-row items-center justify-between mb-6">
            <Logo />
            {user ? (
              <Link href="/accueil" asChild>
                <Pressable className="rounded-lg bg-accent px-4 py-2 flex-row items-center gap-1.5">
                  <FontAwesome6 name="gauge" size={12} color="#1e293b" />
                  <Text className="text-sm font-semibold text-slate-900">Mon espace</Text>
                </Pressable>
              </Link>
            ) : (
              <View className="flex-row gap-2">
                <Link href="/connexion" asChild>
                  <Pressable className="rounded-lg border border-white/40 px-3 py-2">
                    <Text className="text-sm text-white">Connexion</Text>
                  </Pressable>
                </Link>
                <Link href="/inscription" asChild>
                  <Pressable className="rounded-lg bg-accent px-3 py-2">
                    <Text className="text-sm font-semibold text-slate-900">Adherer</Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </View>
          <Text className="text-2xl font-bold text-white text-center">Association des Etudiants d&apos;Assoumoukro</Text>
          <Text className="mt-3 text-blue-100 text-center">
            Entraide, culture et reussite academique. Suivez en temps reel la caisse de l&apos;association, vos
            cotisations et toutes les actualites de l&apos;AEA.
          </Text>
        </View>

        <View className="px-4 -mt-6 gap-4">
          {ARGUMENTS.map((a) => (
            <CarteAEA key={a.titre} className="items-center">
              <FontAwesome6 name={a.icon} size={22} color="#1e3a8a" />
              <Text className="mt-2 font-semibold text-slate-900 dark:text-white">{a.titre}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">{a.texte}</Text>
            </CarteAEA>
          ))}

          <Image
            source={require('../../assets/images/AEA.jpg')}
            className="w-full h-48 rounded-2xl mt-2"
            resizeMode="cover"
          />

          <Text className="text-xl font-bold text-slate-900 dark:text-white mt-2">Actualites publiques</Text>

          {actus.length === 0 && (
            <Text className="text-sm text-slate-500 dark:text-slate-400">Aucune actualite publiee pour le moment.</Text>
          )}

          {actus.map((a) => (
            <View key={a.id} className="rounded-xl bg-white dark:bg-slate-800 shadow overflow-hidden">
              {a.image ? <Image source={{ uri: resolveMediaUrl(a.image) }} className="h-40 w-full" resizeMode="cover" /> : null}
              <View className="p-4">
                {a.epingle ? (
                  <View className="flex-row items-center gap-1 mb-1">
                    <FontAwesome6 name="thumbtack" size={10} color="#d97706" />
                    <Text className="text-xs font-semibold text-amber-600">Epingle</Text>
                  </View>
                ) : null}
                <Text className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">{CATEGORIE_LABEL[a.categorie]}</Text>
                <Text className="font-semibold text-slate-900 dark:text-white">{a.titre}</Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1" numberOfLines={3}>{a.texte}</Text>
              </View>
            </View>
          ))}

          <View className="items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Text className="text-xs text-slate-400 text-center">AEA - Association des Etudiants d&apos;Assoumoukro</Text>
            <Text className="text-xs text-slate-400 text-center">contact@aea-assoumoukro.org</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
