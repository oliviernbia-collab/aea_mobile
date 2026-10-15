# AEA - Espace Membre (mobile)

Application mobile Expo (React Native) de l'Association des Etudiants d'Assoumoukro, portage complet du frontend web (`../frontend`) consommant la meme API backend (`../backend`), sans aucune modification cote serveur.

## Stack

- Expo (SDK 57) + Expo Router (routing par fichiers), JavaScript.
- NativeWind (Tailwind CSS pour React Native) pour le style.
- Axios + Socket.io-client pour l'API REST et le temps reel.
- expo-secure-store pour le token JWT, AsyncStorage pour les preferences (theme).
- expo-image-picker / expo-document-picker pour les uploads (photo, justificatifs, preuves).
- expo-web-browser + polling pour le paiement Mobile Money en ligne (agregateur Jeko).
- react-native-qrcode-svg + react-native-view-shot + expo-sharing pour le badge de membre (recto et verso captures ensemble en une seule image, partagee en un seul geste - `expo-media-library` aurait permis un enregistrement direct dans la pellicule mais exige un build natif personnalise, indisponible sous Expo Go).
- react-native-chart-kit pour le graphique d'evolution de la caisse.

## Demarrage

```bash
cd mobile
cp .env.example .env     # puis renseigner l'URL du backend (voir ci-dessous)
npm install
npx expo start
```

Scanner le QR code avec l'app Expo Go (Android/iOS), ou lancer sur un emulateur/simulateur.

### URL de l'API (`mobile/.env`)

Le backend (`cd backend && npm run dev`, port 4000) doit etre lance et accessible depuis le device :

- **Simulateur iOS** : `http://localhost:4000/api` fonctionne tel quel.
- **Emulateur Android** : remplacer `localhost` par `10.0.2.2`.
- **Device physique (Expo Go)** : utiliser l'IP LAN de la machine de dev (meme reseau Wi-Fi), ex. `http://192.168.1.50:4000/api`.
- **Hors reseau local** : tunnel ngrok vers le backend (comme deja pratique cote backend pour l'integration Jeko, cf. `backend/.env.example`).

## Points d'attention / ecarts volontaires par rapport au web

- **Notifications** : uniquement en app ouverte via Socket.io (pas de push FCM/APNs - le backend n'a pas d'infrastructure de device tokens).
- **Paiement en ligne Jeko** : ouvre l'operateur dans un navigateur in-app (`expo-web-browser`) et interroge `GET /cotisations/paiement-en-ligne/:reference` en polling pour detecter le resultat, car le flux `successUrl`/`errorUrl` du backend redirige vers le frontend web (non lu par l'app mobile).
- **Icones de l'application** : les icones par defaut du scaffold Expo sont utilisees en placeholder (`assets/icon.png`, etc.) - a remplacer par le logo AEA au format PNG carre (l'outillage disponible dans cet environnement ne permettait pas de convertir `AEA.jpg`).
- **Champ "Promotion" a l'inscription** : reprend a l'identique une anomalie du formulaire web (`frontend/src/pages/Inscription.jsx`), qui propose des libelles de role (Membre/Tresorier/...) plutot qu'une vraie liste de promotions academiques. A corriger dans les deux apps si confirme comme un bug plutot qu'un choix voulu.
- **Gestion des permissions** : presentee par role selectionne (liste de switches) plutot qu'en tableau 2D, illisible sur petit ecran - memes donnees et memes appels API que le web.
- **Photos/images anciennes** : certains membres ont une photo enregistree avant la migration vers Cloudinary (chemin relatif `/uploads/...` servi par le backend). Le web la resout via le proxy Vite (meme origine) ; le mobile n'a pas cette notion d'origine, donc `utils/media.js` (`resolveMediaUrl`) complete ces chemins relatifs avec `EXPO_PUBLIC_SOCKET_URL` avant de les passer a `<Image>`. Toute nouvelle image (Cloudinary) est deja une URL absolue et traverse cette fonction sans etre modifiee.
