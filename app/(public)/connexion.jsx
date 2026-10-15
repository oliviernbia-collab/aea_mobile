import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, Redirect, router } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import PasswordInput from '../../components/PasswordInput';

export default function Connexion() {
  const { user, login, verifierCodeDeuxFA } = useAuth();
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [code, setCode] = useState('');

  if (user) return <Redirect href="/accueil" />;

  const submit = async () => {
    setErreur('');
    setLoading(true);
    try {
      const resultat = await login(identifiant, password);
      if (resultat.requiresTwoFactor) {
        setTempToken(resultat.tempToken);
      } else {
        router.replace('/accueil');
      }
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setErreur('');
    setLoading(true);
    try {
      await verifierCodeDeuxFA(tempToken, code);
      router.replace('/accueil');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Code incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="w-full rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-xl">
          <View className="items-center gap-2 mb-6">
            <Logo size={64} showText={false} />
            <Text className="text-xl font-bold text-slate-900 dark:text-white">Espace Membre AEA</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
              Association des Etudiants d&apos;Assoumoukro
            </Text>
          </View>

          {erreur ? (
            <View className="mb-4 flex-row items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2">
              <FontAwesome6 name="circle-exclamation" size={14} color="#dc2626" />
              <Text className="text-sm text-red-700 dark:text-red-300 flex-1">{erreur}</Text>
            </View>
          ) : null}

          {tempToken ? (
            <View className="gap-4">
              <View className="items-center">
                <FontAwesome6 name="shield-halved" size={32} color="#1e3a8a" />
                <Text className="text-sm text-slate-600 dark:text-slate-300 text-center mt-2">
                  Entrez le code a 6 chiffres de votre application d&apos;authentification.
                </Text>
              </View>
              <TextInput
                autoFocus
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                placeholder="000000"
                placeholderTextColor="#94a3b8"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 py-2.5 px-3 text-center text-lg tracking-[8px]"
              />
              <Pressable
                onPress={submitCode}
                disabled={loading || code.length !== 6}
                className="w-full rounded-lg bg-primary py-3 items-center disabled:opacity-60"
                style={{ opacity: loading || code.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-sm font-semibold text-white">Valider</Text>}
              </Pressable>
              <Pressable onPress={() => { setTempToken(null); setCode(''); setErreur(''); }}>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center underline">Retour</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-4">
              <View>
                <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Telephone ou e-mail</Text>
                <View className="relative flex-row items-center">
                  <FontAwesome6 name="user" size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, zIndex: 1 }} />
                  <TextInput
                    autoCapitalize="none"
                    value={identifiant}
                    onChangeText={setIdentifiant}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 py-2.5 pl-9 pr-3 text-sm"
                  />
                </View>
              </View>
              <View>
                <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Mot de passe</Text>
                <PasswordInput value={password} onChangeText={setPassword} />
              </View>
              <Pressable
                onPress={submit}
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 items-center"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-sm font-semibold text-white">Se connecter</Text>}
              </Pressable>

              <View className="flex-row justify-between">
                <Link href="/mot-de-passe-oublie">
                  <Text className="text-xs text-blue-700 dark:text-blue-300">Mot de passe oublie ?</Text>
                </Link>
                <Link href="/inscription">
                  <Text className="text-xs text-blue-700 dark:text-blue-300">Creer un compte</Text>
                </Link>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
