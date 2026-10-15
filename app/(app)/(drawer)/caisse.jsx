import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Linking, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import useLiveRefresh from '../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../hooks/useBottomPadding';
import { resolveMediaUrl } from '../../../utils/media';
import CarteAEA from '../../../components/CarteAEA';
import { formatFCFA } from '../../../components/MontantFCFA';

const screenWidth = Dimensions.get('window').width;

export default function Caisse() {
  const { showToast } = useToast();
  const bottomPadding = useBottomPadding();
  const [solde, setSolde] = useState(null);
  const [moisCourant, setMoisCourant] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [operations, setOperations] = useState([]);
  const [signalement, setSignalement] = useState({ show: false, operationId: null, message: '' });

  const charger = async () => {
    const [s, m, e, o] = await Promise.all([
      api.get('/caisse/solde'),
      api.get('/caisse/mois-courant'),
      api.get('/caisse/evolution'),
      api.get('/caisse/operations'),
    ]);
    setSolde(s.data);
    setMoisCourant(m.data);
    setEvolution(e.data);
    setOperations(o.data);
  };

  useEffect(() => {
    charger();
  }, []);

  useLiveRefresh('caisse:update', charger);

  const envoyerSignalement = async () => {
    if (!signalement.message.trim()) return;
    try {
      await api.post('/caisse/signalements', { operation_id: signalement.operationId, message: signalement.message });
      setSignalement({ show: false, operationId: null, message: '' });
      showToast('Signalement transmis au bureau.', 'succes');
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'envoi du signalement.", 'erreur');
    }
  };

  const header = (
    <View className="gap-4 mb-4">
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">Caisse de l&apos;association</Text>

      <View className="gap-3">
        <CarteAEA className="bg-primary border-t-0">
          <Text className="text-sm text-blue-100">Solde total</Text>
          <Text className="text-2xl font-bold mt-1 text-white">{solde ? formatFCFA(solde.solde) : '...'}</Text>
        </CarteAEA>
        <View className="flex-row gap-3">
          <CarteAEA className="flex-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">Entrees ce mois</Text>
            <Text className="text-lg font-bold mt-1 text-green-600">{moisCourant ? formatFCFA(moisCourant.entrees) : '...'}</Text>
          </CarteAEA>
          <CarteAEA className="flex-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">Sorties ce mois</Text>
            <Text className="text-lg font-bold mt-1 text-red-600">{moisCourant ? formatFCFA(moisCourant.sorties) : '...'}</Text>
          </CarteAEA>
        </View>
      </View>

      {solde?.parFonds?.length > 0 && (
        <CarteAEA>
          <Text className="font-semibold text-slate-900 dark:text-white mb-3">Repartition par fonds</Text>
          <View className="gap-2">
            {solde.parFonds.map((f) => (
              <View key={f.fonds} className="rounded-lg bg-slate-50 dark:bg-slate-700 p-3 flex-row justify-between">
                <Text className="text-xs text-slate-500 dark:text-slate-400 capitalize">{f.fonds}</Text>
                <Text className="font-semibold text-slate-900 dark:text-white">{formatFCFA(f.solde)}</Text>
              </View>
            ))}
          </View>
        </CarteAEA>
      )}

      {evolution.length > 0 && (
        <CarteAEA>
          <Text className="font-semibold text-slate-900 dark:text-white mb-3">Evolution du solde (12 mois)</Text>
          <LineChart
            data={{
              labels: evolution.map((e) => e.mois.slice(5)),
              datasets: [{ data: evolution.map((e) => e.solde) }],
            }}
            width={screenWidth - 72}
            height={220}
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: () => '#1e3a8a',
              labelColor: () => '#64748b',
              propsForDots: { r: '0' },
            }}
            bezier
            style={{ borderRadius: 8, marginLeft: -16 }}
          />
        </CarteAEA>
      )}

      <Text className="font-semibold text-slate-900 dark:text-white">Dernieres operations</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-bgLight dark:bg-bgDark">
      <FlatList
        data={operations}
        keyExtractor={(op) => String(op.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text className="text-center text-sm text-slate-400">Aucune operation enregistree.</Text>}
        renderItem={({ item: op }) => (
          <View className="rounded-xl bg-white dark:bg-slate-800 p-4 mb-2 flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <View className="flex-row items-center gap-2">
                <FontAwesome6
                  name={op.type === 'entree' ? 'arrow-down' : 'arrow-up'}
                  size={12}
                  color={op.type === 'entree' ? '#16a34a' : '#dc2626'}
                />
                <Text className="text-sm font-medium text-slate-900 dark:text-white flex-1">{op.libelle}</Text>
              </View>
              {op.statut === 'annulee' && <Text className="text-xs text-slate-400 mt-0.5">(annulee)</Text>}
              {op.statut === 'en_attente_validation' && (
                <Text className="text-xs text-amber-600 mt-0.5">(en attente de validation)</Text>
              )}
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {new Date(op.date_operation).toLocaleDateString('fr-FR')} - {op.categorie}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">Saisi par {op.saisi_par_prenom} {op.saisi_par_nom}</Text>
              <View className="flex-row items-center gap-3 mt-2">
                {op.justificatif ? (
                  <Pressable onPress={() => Linking.openURL(resolveMediaUrl(op.justificatif))} className="flex-row items-center gap-1">
                    <FontAwesome6 name="file-lines" size={12} color="#1e3a8a" />
                    <Text className="text-xs text-blue-700 dark:text-blue-300">Justificatif</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => setSignalement({ show: true, operationId: op.id, message: '' })}
                  className="flex-row items-center gap-1"
                >
                  <FontAwesome6 name="flag" size={12} color="#94a3b8" />
                  <Text className="text-xs text-slate-400">Signaler</Text>
                </Pressable>
              </View>
            </View>
            <Text className={`font-semibold ${op.type === 'entree' ? 'text-green-600' : 'text-red-600'}`}>
              {op.type === 'entree' ? '+' : '-'}{formatFCFA(op.montant)}
            </Text>
          </View>
        )}
      />

      <Modal visible={signalement.show} transparent animationType="fade" onRequestClose={() => setSignalement({ show: false, operationId: null, message: '' })}>
        <View className="flex-1 bg-black/40 items-center justify-center px-4">
          <View className="w-full rounded-xl bg-white dark:bg-slate-800 p-5">
            <Text className="font-semibold text-slate-900 dark:text-white mb-3">Signaler une anomalie</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={signalement.message}
              onChangeText={(t) => setSignalement((s) => ({ ...s, message: t }))}
              placeholder="Decrivez l'anomalie constatee..."
              placeholderTextColor="#94a3b8"
              className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 p-3 text-sm"
              style={{ minHeight: 90, textAlignVertical: 'top' }}
            />
            <View className="flex-row justify-end gap-2 mt-3">
              <Pressable onPress={() => setSignalement({ show: false, operationId: null, message: '' })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                <Text className="text-sm text-slate-700 dark:text-slate-200">Annuler</Text>
              </Pressable>
              <Pressable onPress={envoyerSignalement} className="px-3 py-2 rounded-lg bg-primary">
                <Text className="text-sm text-white">Envoyer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
