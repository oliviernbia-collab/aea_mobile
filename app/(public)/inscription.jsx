import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import api from '../../services/api';
import Logo from '../../components/Logo';
import PasswordInput from '../../components/PasswordInput';

const CHAMPS = [
  { name: 'nom', label: 'Nom', requis: true },
  { name: 'prenom', label: 'Prenom', requis: true },
  { name: 'email', label: 'E-mail', requis: true, keyboardType: 'email-address' },
  { name: 'telephone', label: 'Telephone', requis: true, keyboardType: 'phone-pad' },
  { name: 'filiere', label: 'Filiere' },
  { name: 'niveau', label: 'Niveau' },
];

// Reprend tel quel la liste du formulaire web (champ "Promotion" qui reutilise en realite
// des libelles de role) - anomalie preexistante du frontend web, conservee ici a l'identique
// pour une parite stricte entre les deux apps.
const PROMOTIONS = [
  { value: 'membre', label: 'Membre' },
  { value: 'tresorier', label: 'Tresorier(ere)' },
  { value: 'secretaire_general', label: 'Secretaire General(e)' },
  { value: 'resp_communication', label: 'Resp. Communication' },
  { value: 'president', label: 'President(e)' },
];

export default function Inscription() {
  const [form, setForm] = useState({});
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async () => {
    setErreur('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/inscription', form);
      setSucces(`Inscription enregistree ! Votre numero de membre : ${data.numeroMembre}. Elle sera validee par le Secretaire General avant votre premiere connexion.`);
      setTimeout(() => router.replace('/connexion'), 4000);
    } catch (err) {
      setErreur(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="w-full rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-xl gap-4">
          <View className="items-center gap-2 mb-2">
            <Logo size={56} showText={false} />
            <Text className="text-xl font-bold text-slate-900 dark:text-white">Adhesion a l&apos;AEA</Text>
          </View>

          {erreur ? (
            <View className="rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2">
              <Text className="text-sm text-red-700 dark:text-red-300">{erreur}</Text>
            </View>
          ) : null}
          {succes ? (
            <View className="rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">
              <Text className="text-sm text-green-700 dark:text-green-300">{succes}</Text>
            </View>
          ) : null}

          {!succes && (
            <>
              {CHAMPS.map((c) => (
                <View key={c.name}>
                  <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{c.label}</Text>
                  <TextInput
                    autoCapitalize={c.name === 'email' ? 'none' : 'sentences'}
                    keyboardType={c.keyboardType}
                    onChangeText={(t) => change(c.name, t)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 py-2.5 px-3 text-sm"
                  />
                </View>
              ))}

              <View>
                <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Promotion</Text>
                <View className="flex-row flex-wrap gap-2">
                  {PROMOTIONS.map((p) => (
                    <Pressable
                      key={p.value}
                      onPress={() => change('promotion', p.value)}
                      className={`rounded-full border px-3 py-1.5 ${form.promotion === p.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                      <Text className={`text-xs ${form.promotion === p.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Mot de passe</Text>
                <PasswordInput icon={false} onChangeText={(t) => change('password', t)} />
              </View>

              <Pressable onPress={submit} disabled={loading} className="w-full rounded-lg bg-primary py-3 items-center" style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-sm font-semibold text-white">S&apos;inscrire</Text>}
              </Pressable>
            </>
          )}

          <Link href="/connexion">
            <Text className="text-xs text-blue-700 dark:text-blue-300 text-center">Deja membre ? Se connecter</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
