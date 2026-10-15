import { Image } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Affiche le logo d'un operateur Mobile Money, qu'il soit fourni en PNG (Wave, Moov) ou
// en SVG inline (MTN, Orange) - voir constants/moyensPaiement.js.
export default function PaymentLogo({ moyen, size = 32 }) {
  if (moyen.logoType === 'svg') {
    return <SvgXml xml={moyen.logo} width={size} height={size} />;
  }
  return <Image source={moyen.logo} style={{ width: size, height: size }} resizeMode="contain" />;
}
