import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome6 } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { useToast } from '../context/ToastContext';
import { resolveMediaUrl } from '../utils/media';

const LARGEUR = 340;
const HAUTEUR = 214; // ratio CR80 (85,6 x 54 mm)

// Theme visuel par role (couleur du badge) ; le statut 'honoraire' prend le pas sur le role.
function getTheme(role, statut) {
  if (statut === 'honoraire') {
    return { couleur: '#B8860B', couleurFonce: '#7c5a07', pills: [{ texte: "MEMBRE D'HONNEUR", bg: '#B8860B' }] };
  }
  const BUREAU = {
    president: { couleur: '#dc2626', couleurFonce: '#7f1d1d', label: 'PRESIDENT(E)' },
    secretaire_general: { couleur: '#16a34a', couleurFonce: '#14532d', label: 'SECRETAIRE GENERAL(E)' },
    tresorier: { couleur: '#2563eb', couleurFonce: '#1e3a8a', label: 'TRESORIER(ERE)' },
    resp_communication: { couleur: '#9333ea', couleurFonce: '#581c87', label: 'RESPONSABLE COMMUNICATION' },
    super_admin: { couleur: '#334155', couleurFonce: '#0f172a', label: 'SUPER ADMINISTRATEUR' },
  };
  if (BUREAU[role]) {
    const b = BUREAU[role];
    return { couleur: b.couleur, couleurFonce: b.couleurFonce, pills: [{ texte: b.label, bg: b.couleur }, { texte: 'BUREAU EXECUTIF', bg: '#1e293b' }] };
  }
  return {
    couleur: '#dc2626',
    couleurFonce: '#7f1d1d',
    pills: [
      { texte: 'CARTE DE MEMBRE', bg: '#dc2626' },
      { texte: statut === 'actif' ? 'MEMBRE ACTIF' : (statut || 'MEMBRE').toUpperCase(), bg: '#d97706' },
    ],
  };
}

function anneeAcademiqueParDefaut() {
  const maintenant = new Date();
  const debut = maintenant.getMonth() >= 8 ? maintenant.getFullYear() : maintenant.getFullYear() - 1;
  return `${debut} - ${debut + 1}`;
}

const ICONES_VALEURS = [
  { icone: 'book-open', mot: 'EDUQUER' },
  { icone: 'handshake', mot: 'UNIR' },
  { icone: 'lightbulb', mot: 'INNOVER' },
  { icone: 'people-group', mot: 'SERVIR' },
];

function CoinDecoratif() {
  return (
    <Svg width={60} height={60} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <LinearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1e293b" />
          <Stop offset="1" stopColor="#020617" />
        </LinearGradient>
      </Defs>
      <Polygon points="0,0 60,0 0,60" fill="url(#coin)" />
    </Svg>
  );
}

function VagueDecorative({ couleur, couleurFonce }) {
  return (
    <Svg width={LARGEUR} height={50} viewBox="0 0 340 50" style={{ position: 'absolute', bottom: 0, left: 0 }}>
      <Path d="M0,22 C65,48 125,2 185,16 C245,30 300,6 340,20 L340,50 L0,50 Z" fill={couleurFonce} opacity={0.35} />
      <Path d="M0,32 C70,52 135,12 205,26 C265,38 310,16 340,30 L340,50 L0,50 Z" fill={couleur} />
    </Svg>
  );
}

function Signature({ couleur = '#111827' }) {
  return (
    <Svg width={58} height={16} viewBox="0 0 58 16">
      <Path
        d="M2,13 C7,3 10,15 15,7 C19,1 22,14 27,9 C31,5 34,14 39,9 C43,5 45,13 50,8 C53,5 54,10 56,7"
        stroke={couleur}
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function Pastille({ texte, bg }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginRight: 3, marginBottom: 2 }}>
      <Text style={{ fontSize: 5.5, fontWeight: 'bold', color: '#fff' }}>{texte}</Text>
    </View>
  );
}

export default function BadgeMembre({ user }) {
  const { showToast } = useToast();
  const badgeRef = useRef(null);
  const [nomBadge, setNomBadge] = useState(user.nom);
  const [prenomBadge, setPrenomBadge] = useState(user.prenom);
  const [anneeAcademique, setAnneeAcademique] = useState(anneeAcademiqueParDefaut());
  const [photoSrc, setPhotoSrc] = useState(resolveMediaUrl(user.photo));
  const [partage, setPartage] = useState(false);

  const theme = getTheme(user.role, user.statut);
  const qrValue = `AEA|${user.numero_membre}|${prenomBadge} ${nomBadge}|${user.role}|${user.statut}`;

  const changerPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 18], quality: 0.8 });
    if (!result.canceled) setPhotoSrc(result.assets[0].uri);
  };

  // Capture le recto ET le verso en une seule image (ils sont empiles dans un unique
  // conteneur ViewShot ci-dessous), puis ouvre une seule feuille de partage - plutot que deux
  // captures + deux partages successifs, qui donnaient l'impression que le telechargement
  // s'arretait a mi-chemin. expo-media-library (enregistrement direct dans la pellicule)
  // demanderait un build natif personnalise, indisponible sous Expo Go ; expo-sharing
  // fonctionne nativement dans Expo Go et propose "Enregistrer l'image" sur les deux plateformes.
  const partager = async () => {
    setPartage(true);
    try {
      const uri = await badgeRef.current.capture();
      await Sharing.shareAsync(uri);
    } catch {
      showToast('Erreur lors de la generation du badge.', 'erreur');
    } finally {
      setPartage(false);
    }
  };

  return (
    <View className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow border-t-[3px] border-primary">
      <Text className="font-semibold text-slate-900 dark:text-white mb-1">
        <FontAwesome6 name="id-card" size={14} color="#1e3a8a" /> Mon badge de membre
      </Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Modifiez l&apos;affichage ci-dessous si besoin (le numero de membre ne peut pas etre change), puis enregistrez votre badge.
      </Text>

      <View className="items-center gap-4">
        {/* RECTO + VERSO : empiles dans un seul ViewShot pour n'obtenir qu'une seule image a partager/enregistrer. */}
        <ViewShot ref={badgeRef} options={{ format: 'png', quality: 1 }}>
          <View style={{ alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', padding: 12 }}>
          <View style={{ width: LARGEUR, height: HAUTEUR, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' }}>
            <CoinDecoratif />
            <VagueDecorative couleur={theme.couleur} couleurFonce={theme.couleurFonce} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12 }}>
              <Image source={require('../assets/images/AEA.jpg')} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: theme.couleur }} />
              <View>
                <Text style={{ fontSize: 6.5, fontWeight: 'bold', color: '#0f172a' }}>ASSOCIATION DES</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: theme.couleur }}>ETUDIANTS</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#0f172a' }}>D&apos;ASSOUMOUKRO</Text>
              </View>
            </View>
            <Text style={{ fontSize: 5.5, fontWeight: '600', letterSpacing: 1.5, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
              UNITE - SOLIDARITE - EXCELLENCE
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 8 }}>
              {photoSrc ? (
                <Image source={{ uri: photoSrc }} style={{ width: 64, height: 72, borderRadius: 8, borderWidth: 2, borderColor: theme.couleur }} />
              ) : (
                <View style={{ width: 64, height: 72, borderRadius: 8, borderWidth: 2, borderColor: theme.couleur, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome6 name="user" size={24} color="#cbd5e1" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {theme.pills.map((p) => <Pastille key={p.texte} texte={p.texte} bg={p.bg} />)}
                </View>
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }} numberOfLines={1}>
                  {prenomBadge} {nomBadge}
                </Text>
                <Text style={{ fontSize: 6, color: '#94a3b8', marginTop: 3 }}>N° MEMBRE</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#334155' }}>{user.numero_membre}</Text>
                <Text style={{ fontSize: 7, fontWeight: 'bold', color: theme.couleur, marginTop: 3 }}>{anneeAcademique}</Text>
                <Text style={{ fontSize: 5.5, color: '#94a3b8', marginTop: 3 }}>ASSOUMOUKRO, COTE D&apos;IVOIRE</Text>
              </View>
            </View>

            <View style={{ position: 'absolute', bottom: 8, left: 12, right: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ backgroundColor: '#fff', padding: 3, borderRadius: 6, borderWidth: 1, borderColor: theme.couleur }}>
                <QRCode value={qrValue} size={34} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Signature couleur="#ffffff" />
                <Text style={{ fontSize: 5.5, fontWeight: '600', color: '#ffffff' }}>Le President</Text>
              </View>
            </View>
          </View>

          {/* VERSO */}
          <View style={{ width: LARGEUR, height: HAUTEUR, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 12 }}>
            <CoinDecoratif />
            <VagueDecorative couleur={theme.couleur} couleurFonce={theme.couleurFonce} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image source={require('../assets/images/AEA.jpg')} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: theme.couleur }} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#0f172a' }}>AEA</Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.couleur, marginTop: 8 }}>NOTRE MISSION</Text>
            <Text style={{ fontSize: 6.3, color: '#475569', marginTop: 3, maxWidth: 240 }}>
              Promouvoir l&apos;union, la solidarite, l&apos;excellence academique et le developpement integral des etudiants d&apos;Assoumoukro.
            </Text>

            <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
              {ICONES_VALEURS.map((v) => (
                <View key={v.mot} style={{ alignItems: 'center', width: 50 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.couleur, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                    <FontAwesome6 name={v.icone} size={8} color={theme.couleur} />
                  </View>
                  <Text style={{ fontSize: 5, fontWeight: 'bold', color: '#334155' }}>{v.mot}</Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 5, color: '#94a3b8', marginTop: 8, maxWidth: 250 }}>
              CETTE CARTE EST STRICTEMENT PERSONNELLE ET NON TRANSFERABLE. ELLE RESTE LA PROPRIETE DE L&apos;AEA. EN CAS DE PERTE, CONTACTEZ LE BUREAU.
            </Text>

            <View style={{ position: 'absolute', bottom: 8, left: 12, right: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 5.5, fontWeight: '600', color: theme.couleur }}>AEA - ASSOUMOUKRO</Text>
                <Text style={{ fontSize: 5.5, fontWeight: '600', color: theme.couleur, marginTop: 1 }}>contact@aea-assoumoukro.org</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Signature />
                <Text style={{ fontSize: 5.5, fontWeight: '600', color: '#334155' }}>Le President</Text>
              </View>
            </View>
          </View>
          </View>
        </ViewShot>

        <View className="w-full gap-2">
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs text-slate-500">Nom (sur le badge)</Text>
              <TextInput value={nomBadge} onChangeText={setNomBadge} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-500">Prenom (sur le badge)</Text>
              <TextInput value={prenomBadge} onChangeText={setPrenomBadge} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
            </View>
          </View>
          <View>
            <Text className="text-xs text-slate-500">Annee academique</Text>
            <TextInput value={anneeAcademique} onChangeText={setAnneeAcademique} className="rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm" />
          </View>
          <Pressable onPress={changerPhoto} className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-2 items-center">
            <Text className="text-xs text-slate-500 dark:text-slate-400">Photo pour le badge</Text>
          </Pressable>
          <Pressable onPress={partager} disabled={partage} className="rounded-lg py-2.5 items-center" style={{ backgroundColor: theme.couleur, opacity: partage ? 0.6 : 1 }}>
            {partage ? <ActivityIndicator color="#fff" /> : (
              <View className="flex-row items-center gap-2">
                <FontAwesome6 name="share-nodes" size={14} color="#ffffff" />
                <Text className="text-sm font-semibold text-white">Telecharger / partager mon badge</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
