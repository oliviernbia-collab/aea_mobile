import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../../services/api';
import { useToast } from '../../../../context/ToastContext';
import useLiveRefresh from '../../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../../hooks/useBottomPadding';
import PasswordInput from '../../../../components/PasswordInput';
import CarteAEA from '../../../../components/CarteAEA';
import { MOYENS_PAIEMENT } from '../../../../constants/moyensPaiement';
import PaymentLogo from '../../../../components/PaymentLogo';

const ROLES = [
  { value: 'membre', label: 'Membre' },
  { value: 'tresorier', label: 'Tresorier(ere)' },
  { value: 'secretaire_general', label: 'Secretaire General(e)' },
  { value: 'resp_communication', label: 'Resp. Communication' },
  { value: 'president', label: 'President(e)' },
  { value: 'super_admin', label: 'Super administrateur' },
];
const STATUTS = ['actif', 'inactif', 'suspendu', 'honoraire'];

function vierge() {
  return { nom: '', prenom: '', email: '', telephone: '', password: '', filiere: '', niveau: '', promotion: '', role: 'membre', statut: 'actif' };
}

export default function Administration() {
  const { showToast } = useToast();
  const bottomPadding = useBottomPadding();
  const [onglet, setOnglet] = useState('inscriptions');
  const [enAttente, setEnAttente] = useState([]);
  const [membres, setMembres] = useState([]);
  const [adhesions, setAdhesions] = useState([]);
  const [config, setConfig] = useState({
    annee: new Date().getFullYear(), montant_membre: 500, montant_bureau: 1000, montant_adhesion: 1000,
    numero_wave: '', numero_mtn_momo: '', numero_orange_money: '', numero_moov_money: '',
  });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(vierge());
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState(null);

  const charger = async () => {
    const [ea, m, c, a] = await Promise.all([
      api.get('/membres/en-attente'),
      api.get('/membres'),
      api.get('/cotisations/config', { params: { annee: new Date().getFullYear() } }),
      api.get('/cotisations/adhesions', { params: { annee: new Date().getFullYear() } }),
    ]);
    setEnAttente(ea.data);
    setMembres(m.data);
    if (c.data) setConfig(c.data);
    setAdhesions(a.data);
  };

  const statutAdhesion = (membreId) => adhesions.find((a) => a.membre_id === membreId)?.statut || 'non_paye';

  useEffect(() => {
    charger();
  }, []);

  useLiveRefresh(['membres:update', 'cotisations:update'], charger);

  const validerInscription = async (id, nom) => {
    try {
      await api.patch(`/membres/${id}/statut`, { statut: 'actif' });
      showToast(`Inscription de ${nom} validee.`, 'succes');
      charger();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la validation.', 'erreur');
    }
  };

  const rejeterInscription = (id, nom) => {
    Alert.alert('Rejeter l’inscription', `Rejeter l'inscription de ${nom} ? Le compte restera inactif et ne pourra pas se connecter.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Rejeter',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/membres/${id}/statut`, { statut: 'inactif' });
            showToast(`Inscription de ${nom} rejetee.`, 'succes');
            charger();
          } catch (err) {
            showToast(err.response?.data?.message || 'Erreur lors du rejet.', 'erreur');
          }
        },
      },
    ]);
  };

  const changerStatut = async (id, statut) => {
    try {
      await api.patch(`/membres/${id}/statut`, { statut });
      showToast(`Statut mis a jour : ${statut}.`, 'succes');
      charger();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du changement de statut.', 'erreur');
    }
  };

  const changerRole = async (id, role) => {
    try {
      await api.patch(`/membres/${id}/role`, { role });
      showToast('Role mis a jour.', 'succes');
      charger();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du changement de role.', 'erreur');
    }
  };

  const creerMembre = async () => {
    setCreateLoading(true);
    try {
      const { data } = await api.post('/membres', createForm);
      setCreateResult(data);
      showToast('Membre cree avec succes.', 'succes');
      charger();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la creation du membre.', 'erreur');
    } finally {
      setCreateLoading(false);
    }
  };

  const fermerCreation = () => {
    setShowCreate(false);
    setCreateForm(vierge());
    setCreateResult(null);
  };

  const copierIdentifiants = async () => {
    const texte = `Numero de membre : ${createResult.numeroMembre}\nIdentifiant : ${createForm.email}\nMot de passe : ${createResult.motDePasseInitial}`;
    await Clipboard.setStringAsync(texte);
    showToast('Identifiants copies dans le presse-papiers.', 'succes');
  };

  const enregistrerConfig = async () => {
    try {
      await api.post('/cotisations/config', config);
      showToast('Configuration des cotisations enregistree. Les lignes de cotisation ont ete reinitialisees pour tous les membres actifs.', 'succes');
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement.", 'erreur');
    }
  };

  return (
    <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPadding }}>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">Administration</Text>

      <View className="flex-row border-b border-slate-200 dark:border-slate-700">
        {[
          { key: 'inscriptions', label: `Inscriptions (${enAttente.length})` },
          { key: 'membres', label: 'Membres' },
          { key: 'cotisations', label: 'Cotisations' },
        ].map((t) => (
          <Pressable key={t.key} onPress={() => setOnglet(t.key)} className={`px-3 py-2 ${onglet === t.key ? 'border-b-2 border-primary' : ''}`}>
            <Text className={`text-sm font-medium ${onglet === t.key ? 'text-primary' : 'text-slate-400'}`}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {onglet === 'inscriptions' && (
        <CarteAEA>
          {enAttente.length === 0 && <Text className="text-sm text-slate-400">Aucune inscription en attente.</Text>}
          {enAttente.map((m) => (
            <View key={m.id} className="border-b border-slate-50 dark:border-slate-700/50 pb-2 mb-2 last:border-0 last:mb-0">
              <Text className="font-medium text-sm text-slate-900 dark:text-white">{m.prenom} {m.nom} - {m.numero_membre}</Text>
              <Text className="text-xs text-slate-400 mb-2">{m.email} - {m.telephone} - {m.filiere || 'N/A'}</Text>
              <View className="flex-row gap-2">
                <Pressable onPress={() => validerInscription(m.id, `${m.prenom} ${m.nom}`)} className="rounded-lg bg-green-700 px-3 py-1.5 flex-row items-center gap-1">
                  <FontAwesome6 name="check" size={11} color="#fff" />
                  <Text className="text-sm text-white">Valider</Text>
                </Pressable>
                <Pressable onPress={() => rejeterInscription(m.id, `${m.prenom} ${m.nom}`)} className="rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 flex-row items-center gap-1">
                  <FontAwesome6 name="xmark" size={11} color="#dc2626" />
                  <Text className="text-sm text-red-700 dark:text-red-300">Rejeter</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </CarteAEA>
      )}

      {onglet === 'membres' && (
        <View className="gap-3">
          <Pressable onPress={() => setShowCreate(true)} className="self-end rounded-lg bg-primary px-4 py-2 flex-row items-center gap-1.5">
            <FontAwesome6 name="user-plus" size={12} color="#fff" />
            <Text className="text-sm text-white">Nouveau membre</Text>
          </Pressable>
          {membres.map((m) => (
            <CarteAEA key={m.id} className="gap-2">
              <View>
                <Text className="font-medium text-sm text-slate-900 dark:text-white">{m.prenom} {m.nom}</Text>
                <Text className="text-xs text-slate-400">{m.numero_membre}</Text>
              </View>
              <View className="flex-row gap-2 flex-wrap">
                {STATUTS.map((s) => (
                  <Pressable key={s} onPress={() => changerStatut(m.id, s)} className={`rounded-full border px-2.5 py-1 ${m.statut === s ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                    <Text className={`text-xs ${m.statut === s ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row gap-1.5 flex-wrap">
                {ROLES.map((r) => (
                  <Pressable key={r.value} onPress={() => changerRole(m.id, r.value)} className={`rounded-full border px-2 py-1 ${m.role === r.value ? 'bg-slate-700 border-slate-700' : 'border-slate-300 dark:border-slate-600'}`}>
                    <Text className={`text-[10px] ${m.role === r.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View className={`self-start rounded-full px-2.5 py-1 ${statutAdhesion(m.id) === 'paye' ? 'bg-green-500' : statutAdhesion(m.id) === 'partiel' ? 'bg-orange-500' : 'bg-red-500'}`}>
                <Text className="text-[10px] text-white">Adhesion : {statutAdhesion(m.id).replace('_', ' ')}</Text>
              </View>
            </CarteAEA>
          ))}
        </View>
      )}

      {onglet === 'cotisations' && (
        <CarteAEA className="gap-3">
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            Le droit d&apos;adhesion est du une seule fois par tout nouveau membre. La cotisation mensuelle depend du role.
          </Text>
          <TextInput placeholder="Annee" placeholderTextColor="#94a3b8" keyboardType="numeric" value={String(config.annee)} onChangeText={(t) => setConfig((c) => ({ ...c, annee: Number(t) || c.annee }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
          <View>
            <Text className="text-xs text-slate-500">Droit d&apos;adhesion, une fois (FCFA)</Text>
            <TextInput keyboardType="numeric" value={String(config.montant_adhesion)} onChangeText={(t) => setConfig((c) => ({ ...c, montant_adhesion: Number(t) || 0 }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mt-1" />
          </View>
          <View>
            <Text className="text-xs text-slate-500">Cotisation mensuelle - Membre (FCFA)</Text>
            <TextInput keyboardType="numeric" value={String(config.montant_membre)} onChangeText={(t) => setConfig((c) => ({ ...c, montant_membre: Number(t) || 0 }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mt-1" />
          </View>
          <View>
            <Text className="text-xs text-slate-500">Cotisation mensuelle - Roles du bureau (FCFA)</Text>
            <TextInput keyboardType="numeric" value={String(config.montant_bureau)} onChangeText={(t) => setConfig((c) => ({ ...c, montant_bureau: Number(t) || 0 }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mt-1" />
          </View>

          <Text className="text-sm font-medium text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-700">Numeros Mobile Money de l&apos;association</Text>
          {MOYENS_PAIEMENT.map((m) => (
            <View key={m.value} className="flex-row items-center gap-2">
              <PaymentLogo moyen={m} size={24} />
              <TextInput
                placeholder={`Numero ${m.label}`}
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={config[m.configKey] || ''}
                onChangeText={(t) => setConfig((c) => ({ ...c, [m.configKey]: t }))}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
              />
            </View>
          ))}

          <Pressable onPress={enregistrerConfig} className="rounded-lg bg-primary py-2.5 items-center">
            <Text className="text-sm font-semibold text-white">Enregistrer</Text>
          </Pressable>
        </CarteAEA>
      )}

      <Modal visible={showCreate} animationType="slide" onRequestClose={fermerCreation}>
        <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPadding }}>
          {createResult ? (
            <View className="gap-3">
              <Text className="font-semibold text-green-700 dark:text-green-300">
                <FontAwesome6 name="circle-check" size={16} /> Membre cree avec succes
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                Transmettez ces identifiants au membre. Le mot de passe ne sera plus affiche ensuite.
              </Text>
              <View className="rounded-lg bg-slate-50 dark:bg-slate-700 p-3 gap-1">
                <Text className="text-sm text-slate-900 dark:text-white">Numero : {createResult.numeroMembre}</Text>
                <Text className="text-sm text-slate-900 dark:text-white">Identifiant : {createForm.email}</Text>
                <Text className="text-sm text-slate-900 dark:text-white">Mot de passe : {createResult.motDePasseInitial}</Text>
              </View>
              <View className="flex-row justify-end gap-2">
                <Pressable onPress={copierIdentifiants} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">
                  <Text className="text-sm text-slate-700 dark:text-slate-200">Copier</Text>
                </Pressable>
                <Pressable onPress={fermerCreation} className="px-3 py-1.5 rounded-lg bg-primary">
                  <Text className="text-sm text-white">Fermer</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="gap-3">
              <Text className="font-semibold text-slate-900 dark:text-white">Nouveau membre</Text>
              <View className="flex-row gap-2">
                <TextInput placeholder="Nom" placeholderTextColor="#94a3b8" value={createForm.nom} onChangeText={(t) => setCreateForm((f) => ({ ...f, nom: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
                <TextInput placeholder="Prenom" placeholderTextColor="#94a3b8" value={createForm.prenom} onChangeText={(t) => setCreateForm((f) => ({ ...f, prenom: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
              </View>
              <TextInput placeholder="E-mail" placeholderTextColor="#94a3b8" autoCapitalize="none" value={createForm.email} onChangeText={(t) => setCreateForm((f) => ({ ...f, email: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
              <TextInput placeholder="Telephone" placeholderTextColor="#94a3b8" value={createForm.telephone} onChangeText={(t) => setCreateForm((f) => ({ ...f, telephone: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
              <View className="flex-row gap-2">
                <TextInput placeholder="Filiere" placeholderTextColor="#94a3b8" value={createForm.filiere} onChangeText={(t) => setCreateForm((f) => ({ ...f, filiere: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
                <TextInput placeholder="Niveau" placeholderTextColor="#94a3b8" value={createForm.niveau} onChangeText={(t) => setCreateForm((f) => ({ ...f, niveau: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
                <TextInput placeholder="Promotion" placeholderTextColor="#94a3b8" value={createForm.promotion} onChangeText={(t) => setCreateForm((f) => ({ ...f, promotion: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
              </View>
              <View>
                <Text className="text-xs text-slate-500 mb-1">Role</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {ROLES.map((r) => (
                    <Pressable key={r.value} onPress={() => setCreateForm((f) => ({ ...f, role: r.value }))} className={`rounded-full border px-2.5 py-1 ${createForm.role === r.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      <Text className={`text-[11px] ${createForm.role === r.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{r.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text className="text-xs text-slate-500 mb-1">Statut</Text>
                <View className="flex-row gap-1.5">
                  {STATUTS.map((s) => (
                    <Pressable key={s} onPress={() => setCreateForm((f) => ({ ...f, statut: s }))} className={`rounded-full border px-2.5 py-1 ${createForm.statut === s ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      <Text className={`text-xs ${createForm.statut === s ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text className="text-xs text-slate-500 mb-1">Mot de passe initial (facultatif, min. 8 caracteres)</Text>
                <PasswordInput icon={false} minLength={8} placeholder="Laisser vide pour generer automatiquement" value={createForm.password} onChangeText={(t) => setCreateForm((f) => ({ ...f, password: t }))} />
              </View>
              <View className="flex-row justify-end gap-2 pt-2">
                <Pressable onPress={fermerCreation} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                  <Text className="text-sm text-slate-700 dark:text-slate-200">Annuler</Text>
                </Pressable>
                <Pressable onPress={creerMembre} disabled={createLoading} className="px-4 py-2 rounded-lg bg-primary" style={{ opacity: createLoading ? 0.6 : 1 }}>
                  {createLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-sm text-white">Creer le membre</Text>}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}
