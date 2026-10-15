import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import useBottomPadding from '../../../hooks/useBottomPadding';
import { resolveMediaUrl } from '../../../utils/media';
import PasswordInput from '../../../components/PasswordInput';
import BadgeMembre from '../../../components/BadgeMembre';
import CarteAEA from '../../../components/CarteAEA';

export default function MonProfil() {
  const { user, refresh } = useAuth();
  const { showToast } = useToast();
  const bottomPadding = useBottomPadding();
  const [form, setForm] = useState({ nom: user.nom, prenom: user.prenom, email: user.email, telephone: user.telephone, filiere: user.filiere || '', niveau: user.niveau || '', promotion: user.promotion || '' });
  const [photo, setPhoto] = useState(null);

  const [pwdForm, setPwdForm] = useState({ motDePasseActuel: '', nouveauMotDePasse: '', confirmation: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const [deuxFAActive, setDeuxFAActive] = useState(!!user.two_fa_enabled);
  const [setupDeuxFA, setSetupDeuxFA] = useState(null);
  const [codeDeuxFA, setCodeDeuxFA] = useState('');
  const [codeDesactivation, setCodeDesactivation] = useState('');
  const [deuxFALoading, setDeuxFALoading] = useState(false);

  const choisirPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const submit = async () => {
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', { uri: photo.uri, name: 'photo.jpg', type: 'image/jpeg' });
      await api.put(`/membres/${user.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Profil mis a jour.', 'succes');
      refresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise a jour.', 'erreur');
    }
  };

  const changerMotDePasse = async () => {
    if (pwdForm.nouveauMotDePasse.length < 8) {
      showToast('Le nouveau mot de passe doit contenir au moins 8 caracteres.', 'erreur');
      return;
    }
    if (pwdForm.nouveauMotDePasse !== pwdForm.confirmation) {
      showToast('La confirmation ne correspond pas au nouveau mot de passe.', 'erreur');
      return;
    }
    setPwdLoading(true);
    try {
      await api.put('/auth/mot-de-passe', { motDePasseActuel: pwdForm.motDePasseActuel, nouveauMotDePasse: pwdForm.nouveauMotDePasse });
      showToast('Mot de passe modifie avec succes.', 'succes');
      setPwdForm({ motDePasseActuel: '', nouveauMotDePasse: '', confirmation: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du changement de mot de passe.', 'erreur');
    } finally {
      setPwdLoading(false);
    }
  };

  const initierDeuxFA = async () => {
    setDeuxFALoading(true);
    try {
      const { data } = await api.post('/auth/2fa/init');
      setSetupDeuxFA(data);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'initialisation.", 'erreur');
    } finally {
      setDeuxFALoading(false);
    }
  };

  const activerDeuxFA = async () => {
    setDeuxFALoading(true);
    try {
      await api.post('/auth/2fa/activer', { code: codeDeuxFA });
      showToast('Double authentification activee.', 'succes');
      setDeuxFAActive(true);
      setSetupDeuxFA(null);
      setCodeDeuxFA('');
      refresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Code incorrect.', 'erreur');
    } finally {
      setDeuxFALoading(false);
    }
  };

  const desactiverDeuxFA = async () => {
    setDeuxFALoading(true);
    try {
      await api.post('/auth/2fa/desactiver', { code: codeDesactivation });
      showToast('Double authentification desactivee.', 'succes');
      setDeuxFAActive(false);
      setCodeDesactivation('');
      refresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Code incorrect.', 'erreur');
    } finally {
      setDeuxFALoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPadding }}>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">Mon profil</Text>

      <CarteAEA className="flex-row items-center gap-4">
        {user.photo ? (
          <Image source={{ uri: resolveMediaUrl(user.photo) }} className="w-16 h-16 rounded-full" />
        ) : (
          <FontAwesome6 name="circle-user" size={56} color="#cbd5e1" />
        )}
        <View>
          <Text className="font-semibold text-slate-900 dark:text-white">{user.prenom} {user.nom}</Text>
          <Text className="text-sm text-slate-400">{user.numero_membre} - {user.role.replace('_', ' ')}</Text>
        </View>
      </CarteAEA>

      <BadgeMembre user={user} />

      <CarteAEA className="gap-3">
        <View className="flex-row gap-3">
          <TextInput placeholder="Nom" value={form.nom} onChangeText={(t) => setForm((f) => ({ ...f, nom: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
          <TextInput placeholder="Prenom" value={form.prenom} onChangeText={(t) => setForm((f) => ({ ...f, prenom: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
        </View>
        <TextInput placeholder="E-mail" value={form.email} onChangeText={(t) => setForm((f) => ({ ...f, email: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
        <TextInput placeholder="Telephone" value={form.telephone} onChangeText={(t) => setForm((f) => ({ ...f, telephone: t }))} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
        <View className="flex-row gap-2">
          <TextInput placeholder="Filiere" value={form.filiere} onChangeText={(t) => setForm((f) => ({ ...f, filiere: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
          <TextInput placeholder="Niveau" value={form.niveau} onChangeText={(t) => setForm((f) => ({ ...f, niveau: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
          <TextInput placeholder="Promotion" value={form.promotion} onChangeText={(t) => setForm((f) => ({ ...f, promotion: t }))} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
        </View>
        <Pressable onPress={choisirPhoto} className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-2 items-center">
          <Text className="text-xs text-slate-500 dark:text-slate-400">{photo ? 'Photo selectionnee' : 'Choisir une photo de profil'}</Text>
        </Pressable>
        <Pressable onPress={submit} className="rounded-lg bg-primary py-2.5 items-center">
          <Text className="text-sm font-semibold text-white">Enregistrer</Text>
        </Pressable>
      </CarteAEA>

      <CarteAEA className="gap-3">
        <Text className="font-semibold text-slate-900 dark:text-white">
          <FontAwesome6 name="key" size={13} color="#1e3a8a" /> Changer le mot de passe
        </Text>
        <View>
          <Text className="text-xs text-slate-500">Mot de passe actuel</Text>
          <PasswordInput icon={false} value={pwdForm.motDePasseActuel} onChangeText={(t) => setPwdForm((f) => ({ ...f, motDePasseActuel: t }))} />
        </View>
        <View>
          <Text className="text-xs text-slate-500">Nouveau mot de passe</Text>
          <PasswordInput icon={false} value={pwdForm.nouveauMotDePasse} onChangeText={(t) => setPwdForm((f) => ({ ...f, nouveauMotDePasse: t }))} />
        </View>
        <View>
          <Text className="text-xs text-slate-500">Confirmer le nouveau mot de passe</Text>
          <PasswordInput icon={false} value={pwdForm.confirmation} onChangeText={(t) => setPwdForm((f) => ({ ...f, confirmation: t }))} />
        </View>
        <Pressable onPress={changerMotDePasse} disabled={pwdLoading} className="rounded-lg bg-primary py-2.5 items-center" style={{ opacity: pwdLoading ? 0.6 : 1 }}>
          {pwdLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-sm font-semibold text-white">Modifier le mot de passe</Text>}
        </Pressable>
      </CarteAEA>

      <CarteAEA className="gap-3">
        <Text className="font-semibold text-slate-900 dark:text-white">
          <FontAwesome6 name="shield-halved" size={13} color="#1e3a8a" /> Double authentification (2FA)
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          Recommandee pour les membres du bureau : un code a 6 chiffres genere par une application
          (Google Authenticator, Microsoft Authenticator...) sera demande a chaque connexion.
        </Text>

        {deuxFAActive ? (
          <View className="gap-2">
            <Text className="text-sm font-medium text-green-700 dark:text-green-300">
              <FontAwesome6 name="circle-check" size={12} /> Activee
            </Text>
            <Text className="text-xs text-slate-500">Entrez un code actuel pour desactiver</Text>
            <TextInput
              inputMode="numeric"
              maxLength={6}
              value={codeDesactivation}
              onChangeText={(t) => setCodeDesactivation(t.replace(/\D/g, ''))}
              placeholder="000000"
              placeholderTextColor="#94a3b8"
              className="w-40 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm text-center tracking-[6px]"
            />
            <Pressable onPress={desactiverDeuxFA} disabled={deuxFALoading || codeDesactivation.length !== 6} className="self-start rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5" style={{ opacity: deuxFALoading || codeDesactivation.length !== 6 ? 0.6 : 1 }}>
              <Text className="text-sm text-red-700 dark:text-red-300">Desactiver</Text>
            </Pressable>
          </View>
        ) : setupDeuxFA ? (
          <View className="gap-3">
            <View className="items-center gap-2">
              <Image source={{ uri: setupDeuxFA.qrCode }} style={{ width: 160, height: 160, borderRadius: 8 }} />
              <Text className="text-xs text-slate-400 text-center">Ou saisissez la cle : {setupDeuxFA.secret}</Text>
            </View>
            <Text className="text-xs text-slate-500">Code affiche par l&apos;application</Text>
            <TextInput
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={codeDeuxFA}
              onChangeText={(t) => setCodeDeuxFA(t.replace(/\D/g, ''))}
              placeholder="000000"
              placeholderTextColor="#94a3b8"
              className="w-40 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm text-center tracking-[6px]"
            />
            <View className="flex-row gap-2">
              <Pressable onPress={() => { setSetupDeuxFA(null); setCodeDeuxFA(''); }} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">
                <Text className="text-sm text-slate-700 dark:text-slate-200">Annuler</Text>
              </Pressable>
              <Pressable onPress={activerDeuxFA} disabled={deuxFALoading || codeDeuxFA.length !== 6} className="px-3 py-1.5 rounded-lg bg-primary" style={{ opacity: deuxFALoading || codeDeuxFA.length !== 6 ? 0.6 : 1 }}>
                <Text className="text-sm text-white">Confirmer l&apos;activation</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={initierDeuxFA} disabled={deuxFALoading} className="self-start rounded-lg bg-primary px-4 py-2" style={{ opacity: deuxFALoading ? 0.6 : 1 }}>
            {deuxFALoading ? <ActivityIndicator color="#fff" /> : <Text className="text-sm text-white">Activer la double authentification</Text>}
          </Pressable>
        )}
      </CarteAEA>
    </ScrollView>
  );
}
