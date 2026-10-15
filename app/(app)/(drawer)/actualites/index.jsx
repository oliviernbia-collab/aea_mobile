import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import useLiveRefresh from '../../../../hooks/useLiveRefresh';
import useBottomPadding from '../../../../hooks/useBottomPadding';
import { resolveMediaUrl } from '../../../../utils/media';

const CATEGORIES = [
  { value: 'annonce_officielle', label: 'Annonce officielle' },
  { value: 'vie_academique', label: 'Vie academique' },
  { value: 'culture', label: 'Culture' },
  { value: 'social', label: 'Social' },
  { value: 'opportunites', label: 'Opportunites' },
];

export default function Actualites() {
  const { isBureau } = useAuth();
  const { showToast } = useToast();
  const bottomPadding = useBottomPadding();
  const [actus, setActus] = useState([]);
  const [categorie, setCategorie] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titre: '', texte: '', categorie: 'annonce_officielle', visibilite: 'membres', epingle: false });
  const [image, setImage] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    const { data } = await api.get('/actualites', { params: categorie ? { categorie } : {} });
    setActus(data);
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorie]);

  useLiveRefresh('actualites:update', charger);

  const choisirImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const publier = async () => {
    setEnvoi(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (image) fd.append('image', { uri: image.uri, name: 'image.jpg', type: 'image/jpeg' });
      await api.post('/actualites', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Actualite publiee.', 'succes');
      setShowForm(false);
      setForm({ titre: '', texte: '', categorie: 'annonce_officielle', visibilite: 'membres', epingle: false });
      setImage(null);
      charger();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la publication.', 'erreur');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View className="flex-1 bg-bgLight dark:bg-bgDark">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPadding }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Actualites</Text>
          {isBureau && (
            <Pressable onPress={() => setShowForm(true)} className="rounded-lg bg-primary px-3 py-2 flex-row items-center gap-1.5">
              <FontAwesome6 name="plus" size={12} color="#ffffff" />
              <Text className="text-sm text-white">Publier</Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Pressable onPress={() => setCategorie('')} className={`rounded-full border px-3 py-1.5 ${!categorie ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
            <Text className={`text-xs ${!categorie ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>Toutes</Text>
          </Pressable>
          {CATEGORIES.map((c) => (
            <Pressable key={c.value} onPress={() => setCategorie(c.value)} className={`rounded-full border px-3 py-1.5 ${categorie === c.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
              <Text className={`text-xs ${categorie === c.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        {actus.length === 0 && <Text className="text-sm text-slate-400">Aucune actualite.</Text>}
        {actus.map((a) => (
          <Pressable key={a.id} onPress={() => router.push(`/actualites/${a.id}`)} className="rounded-xl bg-white dark:bg-slate-800 shadow overflow-hidden">
            {a.image ? <Image source={{ uri: resolveMediaUrl(a.image) }} className="h-36 w-full" resizeMode="cover" /> : null}
            <View className="p-4">
              {a.epingle ? (
                <View className="flex-row items-center gap-1 mb-1">
                  <FontAwesome6 name="thumbtack" size={10} color="#d97706" />
                  <Text className="text-xs font-semibold text-amber-600">Epingle</Text>
                </View>
              ) : null}
              <Text className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                {CATEGORIES.find((c) => c.value === a.categorie)?.label}
              </Text>
              <Text className="font-semibold text-slate-900 dark:text-white">{a.titre}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1" numberOfLines={2}>{a.texte}</Text>
              <Text className="text-xs text-slate-400 mt-2">{a.auteur_prenom} {a.auteur_nom} - {new Date(a.created_at).toLocaleDateString('fr-FR')}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <ScrollView className="flex-1 bg-bgLight dark:bg-bgDark" contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPadding }}>
          <Text className="font-semibold text-lg text-slate-900 dark:text-white">Nouvelle actualite</Text>
          <TextInput
            placeholder="Titre"
            placeholderTextColor="#94a3b8"
            value={form.titre}
            onChangeText={(t) => setForm((f) => ({ ...f, titre: t }))}
            className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
          />
          <TextInput
            placeholder="Texte"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={form.texte}
            onChangeText={(t) => setForm((f) => ({ ...f, texte: t }))}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
            className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
          />
          <View>
            <Text className="text-xs text-slate-500 mb-1">Categorie</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Pressable key={c.value} onPress={() => setForm((f) => ({ ...f, categorie: c.value }))} className={`rounded-full border px-3 py-1.5 ${form.categorie === c.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                  <Text className={`text-xs ${form.categorie === c.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View>
            <Text className="text-xs text-slate-500 mb-1">Visibilite</Text>
            <View className="flex-row gap-2">
              <Pressable onPress={() => setForm((f) => ({ ...f, visibilite: 'membres' }))} className={`flex-1 rounded-lg border p-2 items-center ${form.visibilite === 'membres' ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                <Text className={`text-xs ${form.visibilite === 'membres' ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>Reservee aux membres</Text>
              </Pressable>
              <Pressable onPress={() => setForm((f) => ({ ...f, visibilite: 'publique' }))} className={`flex-1 rounded-lg border p-2 items-center ${form.visibilite === 'publique' ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                <Text className={`text-xs ${form.visibilite === 'publique' ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>Publique</Text>
              </Pressable>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-slate-700 dark:text-slate-200">Epingler en haut du fil</Text>
            <Switch value={form.epingle} onValueChange={(v) => setForm((f) => ({ ...f, epingle: v }))} />
          </View>
          <Pressable onPress={choisirImage} className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-3 items-center">
            <FontAwesome6 name="image" size={16} color="#64748b" />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">{image ? 'Image selectionnee' : 'Choisir une image (facultatif)'}</Text>
          </Pressable>
          <View className="flex-row justify-end gap-2 pt-2">
            <Pressable onPress={() => setShowForm(false)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
              <Text className="text-sm text-slate-700 dark:text-slate-200">Annuler</Text>
            </Pressable>
            <Pressable onPress={publier} disabled={envoi} className="px-4 py-2 rounded-lg bg-primary" style={{ opacity: envoi ? 0.6 : 1 }}>
              {envoi ? <ActivityIndicator color="#fff" /> : <Text className="text-sm text-white">Publier</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}
