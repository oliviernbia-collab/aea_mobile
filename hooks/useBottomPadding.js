import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Marge basse supplementaire pour les ecrans defilants (ScrollView/FlatList) : sans elle,
// le dernier element reste partiellement cache sous la barre de gestes (Android) ou
// l'indicateur d'accueil (iOS), donnant l'impression que le scroll "n'arrive pas assez bas".
export default function useBottomPadding(extra = 24) {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}
