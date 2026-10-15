import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import api from '../../services/api';
import Logo from '../../components/Logo';

export default function MotDePasseOublie() {
  const [identifiant, setIdentifiant] = useState('');
  const [envoye, setEnvoye] = useState(false);

  const submit = async () => {
    await api.post('/auth/mot-de-passe-oublie', { identifiant });
    setEnvoye(true);
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="w-full rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-xl gap-4">
          <View className="items-center gap-2 mb-2">
            <Logo size={56} showText={false} />
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Mot de passe oublie</Text>
          </View>

          {envoye ? (
            <Text className="text-sm text-green-700 dark:text-green-300 text-center">
              Si ce compte existe, des instructions de reinitialisation ont ete envoyees par SMS ou e-mail.
            </Text>
          ) : (
            <>
              <View>
                <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Telephone ou e-mail</Text>
                <TextInput
                  autoCapitalize="none"
                  value={identifiant}
                  onChangeText={setIdentifiant}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 py-2.5 px-3 text-sm"
                />
              </View>
              <Pressable onPress={submit} className="w-full rounded-lg bg-primary py-3 items-center">
                <Text className="text-sm font-semibold text-white">Envoyer</Text>
              </Pressable>
            </>
          )}

          <Link href="/connexion">
            <Text className="text-xs text-blue-700 dark:text-blue-300 text-center">Retour a la connexion</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
