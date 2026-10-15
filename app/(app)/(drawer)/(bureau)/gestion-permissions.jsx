import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';
import api from '../../../../services/api';
import { useToast } from '../../../../context/ToastContext';
import useLiveRefresh from '../../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../../hooks/useBottomPadding';
import CarteAEA from '../../../../components/CarteAEA';

const ROLE_LABELS = {
  membre: 'Membre',
  tresorier: 'Tresorier(ere)',
  secretaire_general: 'Secretaire General(e)',
  resp_communication: 'Resp. Communication',
  president: 'President(e)',
  super_admin: 'Super administrateur',
};

export default function GestionPermissions() {
  const { showToast } = useToast();
  const bottomPadding = useBottomPadding();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleActif, setRoleActif] = useState(null);
  const [saving, setSaving] = useState(null);

  const charger = useCallback(async () => {
    try {
      const { data } = await api.get('/permissions');
      setRoles(data.roles);
      setPermissions(data.permissions);
      setRoleActif((prev) => prev || data.roles.find((r) => r !== 'super_admin'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useLiveRefresh(['permissions:update'], charger);

  const basculer = async (key, valeurActuelle) => {
    const cellId = `${key}:${roleActif}`;
    setSaving(cellId);
    setPermissions((prev) => prev.map((p) => (p.key === key ? { ...p, roles: { ...p.roles, [roleActif]: !valeurActuelle } } : p)));
    try {
      await api.put('/permissions', { role: roleActif, key, autorise: !valeurActuelle });
    } catch (err) {
      setPermissions((prev) => prev.map((p) => (p.key === key ? { ...p, roles: { ...p.roles, [roleActif]: valeurActuelle } } : p)));
      showToast(err.response?.data?.message || 'Erreur lors de la mise a jour du droit.', 'erreur');
    } finally {
      setSaving(null);
    }
  };

  const modules = [...new Set(permissions.map((p) => p.module))];
  const rolesEditables = roles.filter((r) => r !== 'super_admin');

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bgLight dark:bg-bgDark">
        <ActivityIndicator color="#1e3a8a" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPadding }}>
      <View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des permissions</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Le Super administrateur conserve toujours tous les droits, afin d&apos;eviter de verrouiller l&apos;application par erreur.
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {rolesEditables.map((r) => (
          <Text
            key={r}
            onPress={() => setRoleActif(r)}
            className={`rounded-full border px-3 py-1.5 text-xs ${roleActif === r ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
          >
            {ROLE_LABELS[r] || r}
          </Text>
        ))}
      </View>

      {modules.map((module) => (
        <CarteAEA key={module}>
          <Text className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{module}</Text>
          {permissions.filter((p) => p.module === module).map((p) => {
            const valeur = !!p.roles[roleActif];
            const cellId = `${p.key}:${roleActif}`;
            return (
              <View key={p.key} className="flex-row items-center justify-between border-b border-slate-50 dark:border-slate-700/50 py-2 last:border-0">
                <Text className="text-sm text-slate-900 dark:text-white flex-1 pr-2">{p.label}</Text>
                {saving === cellId ? (
                  <ActivityIndicator color="#1e3a8a" />
                ) : (
                  <Switch value={valeur} onValueChange={() => basculer(p.key, valeur)} />
                )}
              </View>
            );
          })}
        </CarteAEA>
      ))}
    </ScrollView>
  );
}
