import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import useLiveRefresh from '../../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../../hooks/useBottomPadding';
import CarteAEA from '../../../../components/CarteAEA';
import { formatFCFA } from '../../../../components/MontantFCFA';

const MOIS_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
const MODES = [
  { value: 'especes', label: 'Especes' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'mtn_momo', label: 'MTN MoMo' },
  { value: 'moov_money', label: 'Moov Money' },
  { value: 'wave', label: 'Wave' },
];
const FONDS = [
  { value: 'fonctionnement', label: 'Fonctionnement' },
  { value: 'entraide', label: 'Entraide' },
  { value: 'evenements', label: 'Evenements' },
];

export default function SaisieFinanciere() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const bottomPadding = useBottomPadding();
  const [enAttente, setEnAttente] = useState([]);
  const [membres, setMembres] = useState([]);

  const [opForm, setOpForm] = useState({ type: 'sortie', fonds: 'fonctionnement', categorie: '', libelle: '', montant: '', date_operation: new Date().toISOString().slice(0, 10) });
  const [justificatif, setJustificatif] = useState(null);

  const [paieForm, setPaieForm] = useState({ membre_id: '', montant: '', date_paiement: new Date().toISOString().slice(0, 10), mode_paiement: 'especes', mois: [] });

  const charger = async () => {
    const [o, m] = await Promise.all([
      api.get('/caisse/operations', { params: { statut: 'en_attente_validation' } }),
      api.get('/membres', { params: { statut: 'actif' } }),
    ]);
    setEnAttente(o.data);
    setMembres(m.data);
  };

  useEffect(() => {
    charger();
  }, []);

  useLiveRefresh(['caisse:update', 'membres:update'], charger);

  const choisirJustificatif = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (!result.canceled) setJustificatif(result.assets[0]);
  };

  const soumettreOperation = async () => {
    try {
      const fd = new FormData();
      Object.entries(opForm).forEach(([k, v]) => fd.append(k, v));
      if (justificatif) fd.append('justificatif', { uri: justificatif.uri, name: justificatif.name || 'justificatif.jpg', type: justificatif.mimeType || 'image/jpeg' });
      const { data } = await api.post('/caisse/operations', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const message = data.statut === 'en_attente_validation' ? 'Depense enregistree, en attente de validation du President (montant > 25 000 FCFA).' : 'Operation enregistree.';
      showToast(message, data.statut === 'en_attente_validation' ? 'info' : 'succes');
      setOpForm({ type: 'sortie', fonds: 'fonctionnement', categorie: '', libelle: '', montant: '', date_operation: new Date().toISOString().slice(0, 10) });
      setJustificatif(null);
      charger();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement.", 'erreur');
    }
  };

  const validerDepense = async (id) => {
    try {
      await api.patch(`/caisse/operations/${id}/valider`);
      showToast('Depense validee.', 'succes');
      charger();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la validation.', 'erreur');
    }
  };

  const toggleMois = (mois) => {
    setPaieForm((f) => ({ ...f, mois: f.mois.includes(mois) ? f.mois.filter((m) => m !== mois) : [...f.mois, mois] }));
  };

  const soumettrePaiement = async () => {
    if (paieForm.mois.length === 0) {
      showToast('Selectionnez au moins un mois.', 'erreur');
      return;
    }
    try {
      const { data } = await api.post('/cotisations/paiements', {
        membre_id: paieForm.membre_id,
        montant: paieForm.montant,
        date_paiement: paieForm.date_paiement,
        mode_paiement: paieForm.mode_paiement,
        mois_couverts: paieForm.mois.map((m) => ({ annee: new Date().getFullYear(), mois: m })),
      });
      showToast(`Paiement enregistre. Recu ${data.recuNumero}.`, 'succes');
      setPaieForm({ membre_id: '', montant: '', date_paiement: new Date().toISOString().slice(0, 10), mode_paiement: 'especes', mois: [] });
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement du paiement.", 'erreur');
    }
  };

  return (
    <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPadding }}>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">Saisie financiere</Text>

      {user.role === 'president' && enAttente.length > 0 && (
        <CarteAEA className="bg-amber-50 dark:bg-amber-900/20 border-t-0">
          <Text className="font-semibold text-amber-800 dark:text-amber-200 mb-3">
            <FontAwesome6 name="triangle-exclamation" size={13} /> Depenses en attente de votre validation
          </Text>
          <View className="gap-2">
            {enAttente.map((op) => (
              <View key={op.id} className="flex-row items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5">
                <View className="flex-1 pr-2">
                  <Text className="font-medium text-sm text-slate-900 dark:text-white">{op.libelle}</Text>
                  <Text className="text-xs text-slate-400">{formatFCFA(op.montant)} - saisi par {op.saisi_par_prenom} {op.saisi_par_nom}</Text>
                </View>
                <Pressable onPress={() => validerDepense(op.id)} className="rounded-lg bg-green-700 px-3 py-1.5">
                  <Text className="text-sm text-white">Valider</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </CarteAEA>
      )}

      <CarteAEA className="gap-3">
        <Text className="font-semibold text-slate-900 dark:text-white">Nouvelle operation de caisse</Text>
        <View className="flex-row gap-2">
          <Pressable onPress={() => setOpForm((f) => ({ ...f, type: 'entree' }))} className={`flex-1 rounded-lg border p-2 items-center ${opForm.type === 'entree' ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
            <Text className={`text-sm ${opForm.type === 'entree' ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>Entree</Text>
          </Pressable>
          <Pressable onPress={() => setOpForm((f) => ({ ...f, type: 'sortie' }))} className={`flex-1 rounded-lg border p-2 items-center ${opForm.type === 'sortie' ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
            <Text className={`text-sm ${opForm.type === 'sortie' ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>Sortie (depense)</Text>
          </Pressable>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {FONDS.map((f) => (
            <Pressable key={f.value} onPress={() => setOpForm((o) => ({ ...o, fonds: f.value }))} className={`rounded-full border px-3 py-1.5 ${opForm.fonds === f.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
              <Text className={`text-xs ${opForm.fonds === f.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput placeholder="Categorie" placeholderTextColor="#94a3b8" value={opForm.categorie} onChangeText={(t) => setOpForm((f) => ({ ...f, categorie: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
        <TextInput placeholder="Libelle" placeholderTextColor="#94a3b8" value={opForm.libelle} onChangeText={(t) => setOpForm((f) => ({ ...f, libelle: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
        <TextInput placeholder="Montant (FCFA)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={opForm.montant} onChangeText={(t) => setOpForm((f) => ({ ...f, montant: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
        <TextInput placeholder="Date (AAAA-MM-JJ)" placeholderTextColor="#94a3b8" value={opForm.date_operation} onChangeText={(t) => setOpForm((f) => ({ ...f, date_operation: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
        <Pressable onPress={choisirJustificatif} className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-2.5 items-center">
          <Text className="text-xs text-slate-500 dark:text-slate-400">{justificatif ? justificatif.name : 'Justificatif (photo de recu ou PDF)'}</Text>
        </Pressable>
        {opForm.type === 'sortie' && Number(opForm.montant) > 25000 && (
          <Text className="text-xs text-amber-600"><FontAwesome6 name="circle-info" size={11} /> Cette depense exigera la validation du President.</Text>
        )}
        <Pressable onPress={soumettreOperation} className="rounded-lg bg-primary py-2.5 items-center">
          <Text className="text-sm font-semibold text-white">Enregistrer</Text>
        </Pressable>
      </CarteAEA>

      <CarteAEA className="gap-3">
        <Text className="font-semibold text-slate-900 dark:text-white">Enregistrer un paiement de cotisation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <View className="flex-row gap-2">
            {membres.map((m) => (
              <Pressable key={m.id} onPress={() => setPaieForm((f) => ({ ...f, membre_id: String(m.id) }))} className={`rounded-full border px-3 py-1.5 ${paieForm.membre_id === String(m.id) ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                <Text className={`text-xs ${paieForm.membre_id === String(m.id) ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} numberOfLines={1}>
                  {m.prenom} {m.nom}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <TextInput placeholder="Montant (FCFA)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={paieForm.montant} onChangeText={(t) => setPaieForm((f) => ({ ...f, montant: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
        <TextInput placeholder="Date (AAAA-MM-JJ)" placeholderTextColor="#94a3b8" value={paieForm.date_paiement} onChangeText={(t) => setPaieForm((f) => ({ ...f, date_paiement: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm" />
        <View className="flex-row flex-wrap gap-2">
          {MODES.map((m) => (
            <Pressable key={m.value} onPress={() => setPaieForm((f) => ({ ...f, mode_paiement: m.value }))} className={`rounded-full border px-3 py-1.5 ${paieForm.mode_paiement === m.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
              <Text className={`text-xs ${paieForm.mode_paiement === m.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
        <View>
          <Text className="text-xs text-slate-500 mb-1">Mois concernes (ou droit d&apos;adhesion)</Text>
          <View className="flex-row flex-wrap gap-1">
            <Pressable onPress={() => toggleMois(0)} className={`rounded-full border px-2.5 py-1 ${paieForm.mois.includes(0) ? 'bg-amber-500 border-amber-500' : 'border-amber-400'}`}>
              <Text className={`text-xs ${paieForm.mois.includes(0) ? 'text-white' : 'text-amber-700 dark:text-amber-400'}`}>Droit d&apos;adhesion</Text>
            </Pressable>
            {MOIS_LABELS.map((label, idx) => (
              <Pressable key={label} onPress={() => toggleMois(idx + 1)} className={`rounded-full border px-2.5 py-1 ${paieForm.mois.includes(idx + 1) ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                <Text className={`text-xs ${paieForm.mois.includes(idx + 1) ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Pressable onPress={soumettrePaiement} className="rounded-lg bg-primary py-2.5 items-center">
          <Text className="text-sm font-semibold text-white">Enregistrer le paiement</Text>
        </Pressable>
      </CarteAEA>
    </ScrollView>
  );
}
