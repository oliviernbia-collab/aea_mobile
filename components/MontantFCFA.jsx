import { Text } from 'react-native';

export function formatFCFA(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0)) + ' FCFA';
}

export default function MontantFCFA({ value, className = '', signe = false }) {
  const n = Number(value) || 0;
  const prefixe = signe ? (n >= 0 ? '+' : '-') : '';
  return <Text className={className}>{prefixe}{formatFCFA(Math.abs(n))}</Text>;
}
