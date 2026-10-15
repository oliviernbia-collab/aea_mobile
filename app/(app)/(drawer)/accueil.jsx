import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import useLiveRefresh from '../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../hooks/useBottomPadding';
import CarteAEA from '../../../components/CarteAEA';
import { formatFCFA } from '../../../components/MontantFCFA';

function periodeCourante() {
  const d = new Date();
  return { annee: d.getFullYear(), mois: d.getMonth() + 1 };
}

const STATUT_COLOR = {
  paye: 'text-green-600',
  partiel: 'text-amber-600',
  non_paye: 'text-red-600',
  non_du: 'text-slate-400',
};

export default function AccueilMembre() {
  const { user } = useAuth();
  const bottomPadding = useBottomPadding();
  const [solde, setSolde] = useState(null);
  const [maFiche, setMaFiche] = useState(null);
  const [actus, setActus] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [periode, setPeriode] = useState(periodeCourante);

  const chargerSolde = () => api.get('/caisse/solde').then(({ data }) => setSolde(data));
  const chargerMaFiche = () => api.get('/cotisations/ma-fiche').then(({ data }) => setMaFiche(data));
  const chargerActus = () => api.get('/actualites').then(({ data }) => setActus(data.slice(0, 3)));
  const chargerNotifications = () =>
    api.get('/notifications').then(({ data }) => setNotifications(data.filter((n) => !n.lu).slice(0, 5)));

  useEffect(() => {
    chargerSolde();
    chargerActus();
    chargerNotifications();
  }, []);

  useEffect(() => {
    chargerMaFiche();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periode.annee, periode.mois]);

  // L'app peut rester ouverte a cheval sur un changement de mois (pas de rechargement de
  // page comme sur le web) : on verifie la periode toutes les minutes pour rafraichir
  // automatiquement "Ma cotisation ce mois".
  useEffect(() => {
    const id = setInterval(() => {
      setPeriode((prev) => {
        const actuelle = periodeCourante();
        return prev.annee === actuelle.annee && prev.mois === actuelle.mois ? prev : actuelle;
      });
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useLiveRefresh('caisse:update', chargerSolde);
  useLiveRefresh('cotisations:update', chargerMaFiche);
  useLiveRefresh('actualites:update', chargerActus);
  useLiveRefresh('notification', chargerNotifications);

  const statutMoisActuel = maFiche?.mois.find((m) => m.mois === periode.mois);

  return (
    <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPadding }}>
      <View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Bonjour {user?.prenom} !</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400">Numero de membre : {user?.numero_membre}</Text>
      </View>

      <View className="gap-3">
        <Pressable onPress={() => router.push('/caisse')}>
          <CarteAEA className="bg-primary border-t-0">
            <FontAwesome6 name="wallet" size={18} color="#ffffff" />
            <Text className="text-sm mt-2 text-blue-100">Solde de la caisse</Text>
            <Text className="text-2xl font-bold mt-1 text-white">{solde ? formatFCFA(solde.solde) : '...'}</Text>
          </CarteAEA>
        </Pressable>

        <Pressable onPress={() => router.push('/ma-fiche-cotisation')}>
          <CarteAEA>
            <FontAwesome6 name="user-check" size={18} color="#1e3a8a" />
            <Text className="text-sm mt-2 text-slate-500 dark:text-slate-400">Ma cotisation ce mois</Text>
            <Text className={`text-lg font-bold mt-1 ${!maFiche ? 'text-slate-400' : STATUT_COLOR[statutMoisActuel?.statut] || 'text-slate-400'}`}>
              {!maFiche ? 'Chargement...' : statutMoisActuel ? statutMoisActuel.statut.replace('_', ' ') : 'Non configure'}
            </Text>
          </CarteAEA>
        </Pressable>

        <Pressable onPress={() => router.push('/notifications')}>
          <CarteAEA>
            <FontAwesome6 name="bell" size={18} color="#1e3a8a" />
            <Text className="text-sm mt-2 text-slate-500 dark:text-slate-400">Notifications non lues</Text>
            <Text className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{notifications.length}</Text>
          </CarteAEA>
        </Pressable>
      </View>

      <CarteAEA>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-slate-900 dark:text-white">Dernieres actualites</Text>
          <Text className="text-xs text-blue-700 dark:text-blue-300" onPress={() => router.push('/actualites')}>Voir tout</Text>
        </View>
        {actus.length === 0 && <Text className="text-sm text-slate-400">Aucune actualite.</Text>}
        {actus.map((a) => (
          <View key={a.id} className="border-b border-slate-100 dark:border-slate-700 pb-2 mb-2 last:border-0 last:mb-0">
            <Text className="text-sm font-medium text-slate-800 dark:text-slate-100" onPress={() => router.push(`/actualites/${a.id}`)}>
              {a.titre}
            </Text>
            <Text className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString('fr-FR')}</Text>
          </View>
        ))}
      </CarteAEA>

      <CarteAEA>
        <Text className="font-semibold text-slate-900 dark:text-white mb-3">Notifications recentes</Text>
        {notifications.length === 0 && <Text className="text-sm text-slate-400">Aucune notification non lue.</Text>}
        {notifications.map((n) => (
          <View key={n.id} className="border-b border-slate-100 dark:border-slate-700 pb-2 mb-2 last:border-0 last:mb-0">
            <Text className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.titre}</Text>
            {n.contenu ? <Text className="text-xs text-slate-400" numberOfLines={1}>{n.contenu}</Text> : null}
          </View>
        ))}
      </CarteAEA>
    </ScrollView>
  );
}
