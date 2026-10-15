import { MTN_MOMO_SVG, ORANGE_MONEY_SVG } from '../assets/images/svgLogos';

// Catalogue unique des operateurs Mobile Money geres par la plateforme : utilise a la fois
// par la fiche de cotisation du membre (choix de l'operateur + numero de reception) et par
// l'ecran Administration (saisie des numeros de reception de l'association).
// `value` reprend les codes operateur de l'agregateur Jeko (wave/orange/mtn/moov), utilises
// tels quels par /api/cotisations/paiement-en-ligne.
export const MOYENS_PAIEMENT = [
  { value: 'wave', label: 'Wave', logoType: 'png', logo: require('../assets/images/pay-wave.png'), configKey: 'numero_wave' },
  { value: 'mtn', label: 'MTN MoMo', logoType: 'svg', logo: MTN_MOMO_SVG, configKey: 'numero_mtn_momo' },
  { value: 'orange', label: 'Orange Money', logoType: 'svg', logo: ORANGE_MONEY_SVG, configKey: 'numero_orange_money' },
  { value: 'moov', label: 'Moov Money', logoType: 'png', logo: require('../assets/images/pay-moov-money.png'), configKey: 'numero_moov_money' },
];
