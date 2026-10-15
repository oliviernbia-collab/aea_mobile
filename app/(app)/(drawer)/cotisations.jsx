import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../services/api';
import useLiveRefresh from '../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../hooks/useBottomPadding';
import { formatFCFA } from '../../../components/MontantFCFA';

const MOIS_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUT_COLOR = { paye: 'bg-green-500', partiel: 'bg-orange-500', non_paye: 'bg-red-500', non_du: 'bg-slate-300 dark:bg-slate-600' };
const NOM_WIDTH = 120;
const COL_WIDTH = 32;

export default function Cotisations() {
  const bottomPadding = useBottomPadding();
  const [annee, setAnnee] = useState(String(new Date().getFullYear()));
  const [membres, setMembres] = useState([]);
  const [taux, setTaux] = useState(null);
  const [filtres, setFiltres] = useState({ promotion: '', filiere: '' });

  const charger = async () => {
    const params = { annee, ...filtres };
    const [t, r] = await Promise.all([
      api.get('/cotisations/taux-recouvrement', { params: { annee } }),
      api.get('/cotisations/tableau', { params }),
    ]);
    setTaux(t.data);
    setMembres(r.data);
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee]);

  useLiveRefresh('cotisations:update', charger);

  return (
    <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPadding }}>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">Cotisations {annee}</Text>

      {taux ? (
        <View className="self-start rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1.5">
          <Text className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Taux de recouvrement (mois courant) : {taux.taux}% ({taux.ajour}/{taux.total})
          </Text>
        </View>
      ) : null}

      <View className="gap-2">
        <TextInput
          value={annee}
          onChangeText={setAnnee}
          keyboardType="number-pad"
          placeholder="Annee"
          placeholderTextColor="#94a3b8"
          className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
        />
        <TextInput
          placeholder="Filtrer par promotion"
          placeholderTextColor="#94a3b8"
          value={filtres.promotion}
          onChangeText={(t) => setFiltres((f) => ({ ...f, promotion: t }))}
          className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
        />
        <TextInput
          placeholder="Filtrer par filiere"
          placeholderTextColor="#94a3b8"
          value={filtres.filiere}
          onChangeText={(t) => setFiltres((f) => ({ ...f, filiere: t }))}
          className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
        />
        <Pressable onPress={charger} className="self-start rounded-lg bg-primary px-4 py-2 flex-row items-center gap-1.5">
          <FontAwesome6 name="filter" size={12} color="#ffffff" />
          <Text className="text-sm text-white">Filtrer</Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {[['Paye', 'bg-green-500'], ['Partiel', 'bg-orange-500'], ['Non paye', 'bg-red-500'], ['Non du', 'bg-slate-300']].map(([label, color]) => (
          <View key={label} className="flex-row items-center gap-1">
            <View className={`w-3 h-3 rounded-full ${color}`} />
            <Text className="text-xs text-slate-500 dark:text-slate-400">{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal className="rounded-xl bg-white dark:bg-slate-800 shadow">
        <View className="p-3">
          <View className="flex-row border-b border-slate-100 dark:border-slate-700 pb-2 mb-1">
            <Text style={{ width: NOM_WIDTH }} className="text-xs font-medium text-slate-500 dark:text-slate-400">Membre</Text>
            {MOIS_LABELS.map((m) => (
              <Text key={m} style={{ width: COL_WIDTH }} className="text-xs text-center text-slate-500 dark:text-slate-400">{m}</Text>
            ))}
            <Text style={{ width: 90 }} className="text-xs text-slate-500 dark:text-slate-400">Total paye</Text>
            <Text style={{ width: 70 }} className="text-xs text-slate-500 dark:text-slate-400">Retard</Text>
          </View>

          {membres.map((m) => (
            <View key={m.membre_id} className="flex-row items-center border-b border-slate-50 dark:border-slate-700/50 py-1.5">
              <View style={{ width: NOM_WIDTH }}>
                <Text className="text-xs font-medium text-slate-900 dark:text-white" numberOfLines={1}>{m.prenom} {m.nom}</Text>
                <Text className="text-[10px] text-slate-400" numberOfLines={1}>{m.numero_membre}</Text>
              </View>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((mois) => {
                const c = m.mois[mois];
                return (
                  <View key={mois} style={{ width: COL_WIDTH }} className="items-center">
                    <View className={`w-5 h-5 rounded ${STATUT_COLOR[c?.statut] || STATUT_COLOR.non_du}`} />
                  </View>
                );
              })}
              <Text style={{ width: 90 }} className="text-xs font-medium text-slate-900 dark:text-white">{formatFCFA(m.totalPaye)}</Text>
              <View style={{ width: 70 }}>
                {m.moisEnRetard > 0 ? (
                  <Text className="text-xs font-medium text-red-600">{m.moisEnRetard} mois</Text>
                ) : (
                  <Text className="text-xs text-green-600">a jour</Text>
                )}
              </View>
            </View>
          ))}

          {membres.length === 0 && (
            <Text className="text-center text-sm text-slate-400 py-6">Aucune donnee pour cette annee.</Text>
          )}
        </View>
      </ScrollView>
    </ScrollView>
  );
}
