import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import useLiveRefresh from '../../../hooks/useLiveRefresh';
import usePaiementEnLigne from '../../../hooks/usePaiementEnLigne';
import useBottomPadding from '../../../hooks/useBottomPadding';
import { MOYENS_PAIEMENT } from '../../../constants/moyensPaiement';
import PaymentLogo from '../../../components/PaymentLogo';
import CarteAEA from '../../../components/CarteAEA';
import { formatFCFA } from '../../../components/MontantFCFA';

const MOIS_LABELS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const STATUT_COLOR = { paye: 'bg-green-500', partiel: 'bg-orange-500', non_paye: 'bg-red-500', non_du: 'bg-slate-300 dark:bg-slate-600' };
const MODE_LABELS = { especes: 'Especes', orange_money: 'Orange Money', mtn_momo: 'MTN MoMo', moov_money: 'Moov Money', wave: 'Wave' };
const CODE_JEKO_VERS_MODE = { wave: 'wave', orange: 'orange_money', mtn: 'mtn_momo', moov: 'moov_money' };
const FRAIS_PLATEFORME_FCFA = 100;

export default function MaFicheCotisation() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const bottomPadding = useBottomPadding();
  const [fiche, setFiche] = useState(null);
  const [config, setConfig] = useState(null);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [onglet, setOnglet] = useState('en_ligne');
  const [form, setForm] = useState({ montant: '', date_paiement: new Date().toISOString().slice(0, 10), mode_paiement: 'wave', mois: [] });
  const [payerPhone, setPayerPhone] = useState('');
  const [preuve, setPreuve] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const annee = new Date().getFullYear();

  const charger = async () => {
    const [{ data: ficheData }, { data: configData }] = await Promise.all([
      api.get('/cotisations/ma-fiche', { params: { annee } }),
      api.get('/cotisations/config', { params: { annee } }),
    ]);
    setFiche(ficheData);
    setConfig(configData);
  };

  useEffect(() => {
    charger();
  }, []);

  useEffect(() => {
    if (user?.telephone && !payerPhone) setPayerPhone(user.telephone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useLiveRefresh('cotisations:update', charger);

  const { payer: payerEnLigne, enCours: paiementEnCours } = usePaiementEnLigne({
    onResult: (data) => {
      if (data.statut === 'success') {
        showToast(`Paiement de ${formatFCFA(data.montant)} confirme.`, 'succes');
      } else {
        showToast('Le paiement a echoue cote operateur. Vous pouvez reessayer.', 'erreur');
      }
      charger();
    },
  });

  const operateurChoisi = MOYENS_PAIEMENT.find((m) => m.value === form.mode_paiement);
  const numeroReception = operateurChoisi && config ? config[operateurChoisi.configKey] : null;

  const copierNumero = async () => {
    if (!numeroReception) return;
    await Clipboard.setStringAsync(numeroReception);
    showToast('Numero copie dans le presse-papiers.', 'succes');
  };

  const toggleMois = (mois) => {
    setForm((f) => ({
      ...f,
      mois: f.mois.includes(mois) ? f.mois.filter((m) => m !== mois) : [...f.mois, mois],
    }));
  };

  const totalSelection = !fiche ? 0 : form.mois.reduce((sum, m) => {
    if (m === 0) {
      return sum + Math.max(0, Number(fiche.adhesion?.montant_du || 0) - Number(fiche.adhesion?.montant_paye || 0));
    }
    const ligne = fiche.mois.find((x) => x.mois === m);
    return sum + Math.max(0, Number(ligne?.montant_du || 0) - Number(ligne?.montant_paye || 0));
  }, 0);

  const payerMaintenant = async () => {
    if (form.mois.length === 0) {
      showToast('Selectionnez au moins un mois a payer.', 'erreur');
      return;
    }
    if (!payerPhone) {
      showToast('Renseignez le numero Mobile Money a debiter.', 'erreur');
      return;
    }
    try {
      await payerEnLigne({
        mode_paiement: form.mode_paiement,
        mois_couverts: form.mois.map((m) => ({ annee, mois: m })),
        payer_phone: payerPhone,
      });
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'initialisation du paiement.", 'erreur');
    }
  };

  const choisirPreuve = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (!result.canceled) setPreuve(result.assets[0]);
  };

  const envoyerDeclaration = async () => {
    if (!preuve || form.mois.length === 0) {
      showToast('Selectionnez au moins un mois et joignez une capture de la preuve de paiement.', 'erreur');
      return;
    }
    setEnvoi(true);
    try {
      const fd = new FormData();
      fd.append('montant', form.montant);
      fd.append('date_paiement', form.date_paiement);
      fd.append('mode_paiement', CODE_JEKO_VERS_MODE[form.mode_paiement] || form.mode_paiement);
      fd.append('mois_couverts', JSON.stringify(form.mois.map((m) => ({ annee, mois: m }))));
      fd.append('preuve', { uri: preuve.uri, name: preuve.name || 'preuve.jpg', type: preuve.mimeType || 'image/jpeg' });
      await api.post('/cotisations/declarations', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Declaration envoyee. Le tresorier va la verifier.', 'succes');
      setShowDeclaration(false);
      setForm({ montant: '', date_paiement: new Date().toISOString().slice(0, 10), mode_paiement: 'wave', mois: [] });
      setPreuve(null);
      charger();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'envoi de la declaration.", 'erreur');
    } finally {
      setEnvoi(false);
    }
  };

  if (!fiche) {
    return (
      <View className="flex-1 items-center justify-center bg-bgLight dark:bg-bgDark">
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  const totalDu = fiche.mois.reduce((s, m) => s + Number(m.montant_du), 0) + Number(fiche.adhesion?.montant_du || 0);
  const totalPaye = fiche.mois.reduce((s, m) => s + Number(m.montant_paye), 0) + Number(fiche.adhesion?.montant_paye || 0);

  return (
    <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPadding }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold text-slate-900 dark:text-white flex-1">Ma fiche de cotisation {annee}</Text>
      </View>
      <Pressable onPress={() => setShowDeclaration(true)} className="self-start rounded-lg bg-primary px-4 py-2.5 flex-row items-center gap-2">
        <FontAwesome6 name="mobile-screen" size={14} color="#ffffff" />
        <Text className="text-sm font-semibold text-white">Payer ma cotisation</Text>
      </Pressable>

      <View className="flex-row gap-3">
        <CarteAEA className="flex-1">
          <Text className="text-sm text-slate-500 dark:text-slate-400">Total du (annee)</Text>
          <Text className="text-lg font-bold mt-1 text-slate-900 dark:text-white">{formatFCFA(totalDu)}</Text>
        </CarteAEA>
        <CarteAEA className="flex-1">
          <Text className="text-sm text-slate-500 dark:text-slate-400">Total paye</Text>
          <Text className="text-lg font-bold mt-1 text-green-600">{formatFCFA(totalPaye)}</Text>
        </CarteAEA>
      </View>

      {fiche.adhesion ? (
        <CarteAEA className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="font-semibold text-slate-900 dark:text-white">Droit d&apos;adhesion</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Paiement unique du a l&apos;entree - {formatFCFA(fiche.adhesion.montant_du)}
            </Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${STATUT_COLOR[fiche.adhesion.statut]}`}>
            <Text className="text-xs font-medium text-white">{fiche.adhesion.statut.replace('_', ' ')}</Text>
          </View>
        </CarteAEA>
      ) : null}

      <CarteAEA>
        <Text className="font-semibold text-slate-900 dark:text-white mb-3">Detail mois par mois</Text>
        <View className="flex-row flex-wrap gap-2">
          {fiche.mois.map((m) => (
            <View key={m.mois} className="flex-row items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 px-3 py-2" style={{ width: '48%' }}>
              <Text className="text-sm text-slate-700 dark:text-slate-200">{MOIS_LABELS[m.mois - 1]}</Text>
              <View className={`rounded-full px-2 py-0.5 ${STATUT_COLOR[m.statut]}`}>
                <Text className="text-[10px] font-medium text-white">{m.statut.replace('_', ' ')}</Text>
              </View>
            </View>
          ))}
        </View>
      </CarteAEA>

      <CarteAEA>
        <Text className="font-semibold text-slate-900 dark:text-white mb-3">Historique des paiements / recus</Text>
        {fiche.paiements.length === 0 && <Text className="text-sm text-slate-400">Aucun paiement enregistre.</Text>}
        {fiche.paiements.map((p) => (
          <View key={p.id} className="flex-row items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-2 mb-2 last:border-0">
            <View>
              <Text className="font-medium text-sm text-slate-900 dark:text-white">
                {formatFCFA(p.montant)} - {MODE_LABELS[p.mode_paiement] || p.mode_paiement}
              </Text>
              <Text className="text-slate-400 text-xs">
                {new Date(p.date_paiement).toLocaleDateString('fr-FR')} {p.recu_numero ? `- ${p.recu_numero}` : ''}
              </Text>
            </View>
            <View className={`rounded-full px-2 py-0.5 ${p.statut_validation === 'valide' ? 'bg-green-500' : 'bg-orange-500'}`}>
              <Text className="text-[10px] text-white">{p.statut_validation}</Text>
            </View>
          </View>
        ))}
      </CarteAEA>

      <Modal visible={showDeclaration} animationType="slide" onRequestClose={() => setShowDeclaration(false)}>
        <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPadding }}>
          <Text className="font-semibold text-lg text-slate-900 dark:text-white">Payer ma cotisation</Text>

          <View className="flex-row rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
            <Pressable onPress={() => setOnglet('en_ligne')} className={`flex-1 rounded-md py-2 items-center ${onglet === 'en_ligne' ? 'bg-white dark:bg-slate-800' : ''}`}>
              <Text className={`text-sm ${onglet === 'en_ligne' ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500'}`}>Payer en ligne</Text>
            </Pressable>
            <Pressable onPress={() => setOnglet('manuelle')} className={`flex-1 rounded-md py-2 items-center ${onglet === 'manuelle' ? 'bg-white dark:bg-slate-800' : ''}`}>
              <Text className={`text-sm ${onglet === 'manuelle' ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500'}`}>J&apos;ai deja paye</Text>
            </Pressable>
          </View>

          <View>
            <Text className="text-xs text-slate-500 mb-1.5">Operateur</Text>
            <View className="flex-row gap-2">
              {MOYENS_PAIEMENT.map((m) => (
                <Pressable
                  key={m.value}
                  onPress={() => setForm((f) => ({ ...f, mode_paiement: m.value }))}
                  className={`flex-1 items-center gap-1 rounded-lg border p-2 ${form.mode_paiement === m.value ? 'border-primary bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600'}`}
                >
                  <PaymentLogo moyen={m} size={28} />
                  <Text className="text-[10px] text-center text-slate-700 dark:text-slate-200">{m.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-xs text-slate-500 mb-1">Mois concernes</Text>
            <View className="flex-row flex-wrap gap-1">
              {fiche.adhesion && fiche.adhesion.statut !== 'paye' && (
                <Pressable onPress={() => toggleMois(0)} className={`rounded-full border px-2.5 py-1 ${form.mois.includes(0) ? 'bg-amber-500 border-amber-500' : 'border-amber-400'}`}>
                  <Text className={`text-xs ${form.mois.includes(0) ? 'text-white' : 'text-amber-700 dark:text-amber-400'}`}>Droit d&apos;adhesion</Text>
                </Pressable>
              )}
              {MOIS_LABELS.map((label, idx) => (
                <Pressable key={label} onPress={() => toggleMois(idx + 1)} className={`rounded-full border px-2.5 py-1 ${form.mois.includes(idx + 1) ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                  <Text className={`text-xs ${form.mois.includes(idx + 1) ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{label.slice(0, 3)}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {onglet === 'en_ligne' ? (
            <>
              <View className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">Cotisation</Text>
                  <Text className="text-sm text-slate-500 dark:text-slate-400">{formatFCFA(totalSelection)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">Frais de transaction</Text>
                  <Text className="text-sm text-slate-500 dark:text-slate-400">{formatFCFA(FRAIS_PLATEFORME_FCFA)}</Text>
                </View>
                <View className="flex-row justify-between pt-1 border-t border-slate-200 dark:border-slate-600">
                  <Text className="font-semibold text-slate-900 dark:text-white">Total debite</Text>
                  <Text className="font-semibold text-slate-900 dark:text-white">{formatFCFA(totalSelection > 0 ? totalSelection + FRAIS_PLATEFORME_FCFA : 0)}</Text>
                </View>
              </View>
              <View>
                <Text className="text-xs text-slate-500">Numero {operateurChoisi?.label} a debiter</Text>
                <TextInput
                  keyboardType="phone-pad"
                  placeholder="07XXXXXXXX"
                  placeholderTextColor="#94a3b8"
                  value={payerPhone}
                  onChangeText={setPayerPhone}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mt-1"
                />
                <Text className="text-[11px] text-slate-400 mt-1">
                  Sur MTN et Moov, l&apos;operateur vous envoie une demande de code a valider sur votre telephone. Sur Wave et Orange, vous serez redirige vers leur application.
                </Text>
              </View>
              <View className="flex-row justify-end gap-2 pt-2">
                <Pressable onPress={() => setShowDeclaration(false)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                  <Text className="text-sm text-slate-700 dark:text-slate-200">Annuler</Text>
                </Pressable>
                <Pressable onPress={payerMaintenant} disabled={paiementEnCours || totalSelection <= 0} className="px-4 py-2 rounded-lg bg-primary" style={{ opacity: paiementEnCours || totalSelection <= 0 ? 0.6 : 1 }}>
                  {paiementEnCours ? <ActivityIndicator color="#fff" /> : <Text className="text-sm text-white">Payer {formatFCFA(totalSelection + FRAIS_PLATEFORME_FCFA)}</Text>}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">Envoyez le montant via {operateurChoisi?.label} au numero :</Text>
                {numeroReception ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-blue-800 dark:text-blue-300">{numeroReception}</Text>
                    <Pressable onPress={copierNumero} className="rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1 flex-row items-center gap-1">
                      <FontAwesome6 name="copy" size={11} color="#64748b" />
                      <Text className="text-xs text-slate-600 dark:text-slate-300">Copier</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text className="text-slate-400 text-xs">Numero non encore configure par le tresorier. Rapprochez-vous du bureau.</Text>
                )}
              </View>
              <View>
                <Text className="text-xs text-slate-500">Montant envoye (FCFA)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={form.montant}
                  onChangeText={(t) => setForm((f) => ({ ...f, montant: t }))}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mt-1"
                />
              </View>
              <View>
                <Text className="text-xs text-slate-500">Date du paiement (AAAA-MM-JJ)</Text>
                <TextInput
                  value={form.date_paiement}
                  onChangeText={(t) => setForm((f) => ({ ...f, date_paiement: t }))}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mt-1"
                />
              </View>
              <View>
                <Text className="text-xs text-slate-500 mb-1">Capture d&apos;ecran de la preuve</Text>
                <Pressable onPress={choisirPreuve} className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-3 items-center">
                  <FontAwesome6 name="file-arrow-up" size={16} color="#64748b" />
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">{preuve ? preuve.name : 'Choisir un fichier (image ou PDF)'}</Text>
                </Pressable>
              </View>
              <View className="flex-row justify-end gap-2 pt-2">
                <Pressable onPress={() => setShowDeclaration(false)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                  <Text className="text-sm text-slate-700 dark:text-slate-200">Annuler</Text>
                </Pressable>
                <Pressable onPress={envoyerDeclaration} disabled={envoi} className="px-4 py-2 rounded-lg bg-primary" style={{ opacity: envoi ? 0.6 : 1 }}>
                  {envoi ? <ActivityIndicator color="#fff" /> : <Text className="text-sm text-white">Envoyer</Text>}
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}
