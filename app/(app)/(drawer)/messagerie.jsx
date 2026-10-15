import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { getSocket } from '../../../services/socket';
import useBottomPadding from '../../../hooks/useBottomPadding';

export default function Messagerie() {
  const { user, isBureau } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const [onglet, setOnglet] = useState('bureau');
  const [conversations, setConversations] = useState([]);
  const [membres, setMembres] = useState([]);
  const [contactActif, setContactActif] = useState(null);
  const [messagesPrives, setMessagesPrives] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [texte, setTexte] = useState('');
  const listeRef = useRef(null);

  const chargerConversations = async () => {
    const { data } = await api.get('/messages/conversations');
    setConversations(data);
  };
  const chargerBroadcasts = async () => {
    const { data } = await api.get('/messages/broadcast');
    setBroadcasts(data);
  };
  const chargerMembres = async () => {
    const { data } = await api.get('/membres', { params: { statut: 'actif' } });
    setMembres(data.filter((m) => m.id !== user.id));
  };

  useEffect(() => {
    chargerConversations();
    chargerBroadcasts();
    chargerMembres();

    const socket = getSocket();
    const onPrive = (msg) => {
      setContactActif((c) => {
        if (c && (msg.expediteur_id === c.id || msg.destinataire_id === c.id)) {
          setMessagesPrives((prev) => [...prev, msg]);
        }
        return c;
      });
      chargerConversations();
    };
    const onBroadcast = () => chargerBroadcasts();
    socket?.on('message:prive', onPrive);
    socket?.on('message:broadcast', onBroadcast);
    return () => {
      socket?.off('message:prive', onPrive);
      socket?.off('message:broadcast', onBroadcast);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ouvrirConversation = async (contact) => {
    setContactActif(contact);
    setOnglet('conversation');
    const { data } = await api.get(`/messages/prive/${contact.id}`);
    setMessagesPrives(data);
  };

  const envoyerPrive = async () => {
    if (!texte.trim() || !contactActif) return;
    const { data } = await api.post('/messages/prive', { destinataire_id: contactActif.id, contenu: texte });
    setMessagesPrives((prev) => [...prev, data]);
    setTexte('');
    chargerConversations();
  };

  const envoyerBroadcast = async () => {
    if (!texte.trim()) return;
    await api.post('/messages/broadcast', { contenu: texte });
    setTexte('');
    chargerBroadcasts();
  };

  const contacts = [...new Map([...conversations, ...membres].map((c) => [c.id, c])).values()];

  if (onglet === 'conversation' && contactActif) {
    return (
      <View className="flex-1 bg-bgLight dark:bg-bgDark">
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Pressable onPress={() => setOnglet('prive')} hitSlop={8}>
            <FontAwesome6 name="arrow-left" size={14} color="#1d4ed8" />
          </Pressable>
          <Text className="font-semibold text-slate-900 dark:text-white">{contactActif.prenom} {contactActif.nom}</Text>
        </View>
        <FlatList
          ref={listeRef}
          data={messagesPrives}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listeRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: m }) => (
            <View
              className={`max-w-[75%] rounded-lg px-3 py-2 ${m.expediteur_id === user.id ? 'self-end bg-primary' : 'self-start bg-slate-100 dark:bg-slate-700'}`}
            >
              <Text className={m.expediteur_id === user.id ? 'text-white' : 'text-slate-900 dark:text-slate-100'}>{m.contenu}</Text>
            </View>
          )}
        />
        <View className="flex-row gap-2 p-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800" style={{ paddingBottom: insets.bottom + 12 }}>
          <TextInput
            value={texte}
            onChangeText={setTexte}
            placeholder="Ecrire un message..."
            placeholderTextColor="#94a3b8"
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
          />
          <Pressable onPress={envoyerPrive} className="rounded-lg bg-primary px-4 items-center justify-center">
            <FontAwesome6 name="paper-plane" size={14} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bgLight dark:bg-bgDark">
      <View className="flex-row bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <Pressable onPress={() => setOnglet('bureau')} className={`flex-1 py-3 items-center ${onglet === 'bureau' ? 'border-b-2 border-primary' : ''}`}>
          <Text className={`text-sm font-medium ${onglet === 'bureau' ? 'text-primary' : 'text-slate-400'}`}>Bureau</Text>
        </Pressable>
        <Pressable onPress={() => setOnglet('prive')} className={`flex-1 py-3 items-center ${onglet === 'prive' ? 'border-b-2 border-primary' : ''}`}>
          <Text className={`text-sm font-medium ${onglet === 'prive' ? 'text-primary' : 'text-slate-400'}`}>Prives</Text>
        </Pressable>
      </View>

      {onglet === 'bureau' ? (
        <>
          <FlatList
            data={broadcasts}
            keyExtractor={(b) => String(b.id)}
            contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: isBureau ? 16 : bottomPadding }}
            ListEmptyComponent={<Text className="text-sm text-slate-400">Aucun message du bureau.</Text>}
            renderItem={({ item: b }) => (
              <View className="rounded-lg bg-slate-50 dark:bg-slate-700 p-3">
                <Text className="text-xs text-slate-400">{b.auteur_prenom} {b.auteur_nom} - {new Date(b.created_at).toLocaleString('fr-FR')}</Text>
                <Text className="text-sm mt-1 text-slate-900 dark:text-slate-100">{b.contenu}</Text>
              </View>
            )}
          />
          {isBureau && (
            <View className="flex-row gap-2 p-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800" style={{ paddingBottom: insets.bottom + 12 }}>
              <TextInput
                value={texte}
                onChangeText={setTexte}
                placeholder="Message a tous les membres..."
                placeholderTextColor="#94a3b8"
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
              />
              <Pressable onPress={envoyerBroadcast} className="rounded-lg bg-primary px-4 items-center justify-center">
                <FontAwesome6 name="paper-plane" size={14} color="#ffffff" />
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 8, paddingBottom: bottomPadding }}
          ListEmptyComponent={<Text className="p-4 text-sm text-slate-400">Aucun contact.</Text>}
          renderItem={({ item: c }) => (
            <Pressable onPress={() => ouvrirConversation(c)} className="flex-row items-center gap-3 px-4 py-3 rounded-lg">
              <FontAwesome6 name="circle-user" size={22} color="#94a3b8" />
              <Text className="text-sm text-slate-900 dark:text-slate-100">{c.prenom} {c.nom}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
