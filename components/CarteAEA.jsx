import { View } from 'react-native';

// Carte blanche avec filet bleu de 3px en haut - motif visuel signature repris du web
// (`.rounded-xl.bg-white { border-top: 3px solid var(--aea-primary) }` dans index.css).
export default function CarteAEA({ children, className = '' }) {
  return (
    <View
      className={`rounded-xl bg-white dark:bg-slate-800 p-5 shadow border-t-[3px] border-primary ${className}`}
    >
      {children}
    </View>
  );
}
