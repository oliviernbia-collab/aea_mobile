import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import api from '../../../../services/api';
import useLiveRefresh from '../../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../../hooks/useBottomPadding';

const TABLES = [
  { value: '', label: 'Toutes' },
  { value: 'users', label: 'Membres' },
  { value: 'caisse_operations', label: 'Caisse' },
  { value: 'role_permissions', label: 'Permissions' },
];
const ACTIONS = [
  { value: '', label: 'Toutes' },
  { value: 'creation', label: 'Creation' },
  { value: 'modification', label: 'Modification' },
  { value: 'validation', label: 'Validation' },
  { value: 'annulation', label: 'Annulation' },
];
const ACTION_COLOR = { creation: 'bg-green-500', modification: 'bg-blue-500', validation: 'bg-amber-500', annulation: 'bg-red-500' };
const TABLE_LABELS = { users: 'Membre', caisse_operations: 'Operation de caisse', cotisations: 'Cotisation', role_permissions: 'Permission' };
const LIMIT = 50;

function resume(valeur) {
  if (!valeur) return null;
  try {
    const obj = typeof valeur === 'string' ? JSON.parse(valeur) : valeur;
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ');
  } catch {
    return String(valeur);
  }
}

export default function JournalActivite() {
  const bottomPadding = useBottomPadding();
  const [entries, setEntries] = useState([]);
  const [table, setTable] = useState('');
  const [action, setAction] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (nouvelOffset = 0) => {
    setLoading(true);
    try {
      const { data } = await api.get('/journal', { params: { table: table || undefined, action: action || undefined, limit: LIMIT, offset: nouvelOffset } });
      setEntries((prev) => (nouvelOffset === 0 ? data : [...prev, ...data]));
      setHasMore(data.length === LIMIT);
      setOffset(nouvelOffset);
    } finally {
      setLoading(false);
    }
  }, [table, action]);

  useEffect(() => {
    charger(0);
  }, [charger]);

  useLiveRefresh(['journal:update'], () => charger(0));

  return (
    <View className="flex-1 bg-bgLight dark:bg-bgDark">
      <FlatList
        data={entries}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: bottomPadding }}
        ListHeaderComponent={
          <View className="gap-3 mb-2">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Journal d&apos;activite</Text>
            <View className="flex-row flex-wrap gap-2">
              {TABLES.map((t) => (
                <Pressable key={t.value} onPress={() => setTable(t.value)} className={`rounded-full border px-3 py-1.5 ${table === t.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                  <Text className={`text-xs ${table === t.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <Pressable key={a.value} onPress={() => setAction(a.value)} className={`rounded-full border px-3 py-1.5 ${action === a.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                  <Text className={`text-xs ${action === a.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={!loading && <Text className="text-center text-sm text-slate-400">Aucune activite trouvee.</Text>}
        renderItem={({ item: e }) => (
          <View className="rounded-xl bg-white dark:bg-slate-800 p-3 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-400">{new Date(e.created_at).toLocaleString('fr-FR')}</Text>
              <View className={`rounded-full px-2 py-0.5 ${ACTION_COLOR[e.action] || 'bg-slate-400'}`}>
                <Text className="text-[10px] font-medium text-white">{e.action}</Text>
              </View>
            </View>
            <Text className="text-sm text-slate-900 dark:text-white">{e.auteur_prenom} {e.auteur_nom} <Text className="text-xs text-slate-400">({e.auteur_role})</Text></Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">{TABLE_LABELS[e.table_name] || e.table_name} #{e.record_id}</Text>
            {resume(e.nouvelle_valeur) || resume(e.ancienne_valeur) ? (
              <Text className="text-xs text-slate-400" numberOfLines={2}>{resume(e.nouvelle_valeur) || resume(e.ancienne_valeur)}</Text>
            ) : null}
          </View>
        )}
        ListFooterComponent={
          hasMore ? (
            <Pressable onPress={() => charger(offset + LIMIT)} disabled={loading} className="self-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 mt-2">
              {loading ? <ActivityIndicator color="#1e3a8a" /> : <Text className="text-sm text-slate-700 dark:text-slate-200">Charger plus</Text>}
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}
