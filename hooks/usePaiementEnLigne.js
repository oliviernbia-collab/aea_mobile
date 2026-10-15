import { useCallback, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import api from '../services/api';

const INTERVALLE_MS = 4000;
const TENTATIVES_MAX = 90; // ~6 minutes de polling avant abandon silencieux

// Le flux de paiement Jeko est pense pour un navigateur web (redirection finale vers le
// frontend React via successUrl/errorUrl, cote backend). Sur mobile, sans modification du
// backend, on ouvre `redirectUrl` dans un navigateur in-app et on interroge en parallele
// GET /cotisations/paiement-en-ligne/:reference jusqu'a obtenir success/error - la redirection
// finale (vers une page web) n'est jamais lue par l'application.
export default function usePaiementEnLigne({ onResult }) {
  const [enCours, setEnCours] = useState(false);
  const pollRef = useRef(null);

  const arreterPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const payer = useCallback(async ({ mode_paiement, mois_couverts, payer_phone }) => {
    setEnCours(true);
    try {
      const { data } = await api.post('/cotisations/paiement-en-ligne', { mode_paiement, mois_couverts, payer_phone });
      const { reference, redirectUrl } = data;

      let tentatives = 0;
      pollRef.current = setInterval(async () => {
        tentatives += 1;
        try {
          const { data: statutData } = await api.get(`/cotisations/paiement-en-ligne/${reference}`);
          if (statutData.statut === 'success' || statutData.statut === 'error') {
            arreterPoll();
            await WebBrowser.dismissBrowser();
            onResult(statutData);
          } else if (tentatives >= TENTATIVES_MAX) {
            arreterPoll();
          }
        } catch {
          // reference pas encore visible cote backend au tout premier appel : on retente.
        }
      }, INTERVALLE_MS);

      await WebBrowser.openBrowserAsync(redirectUrl);
      // Resolu quand le navigateur se ferme (dismissBrowser() ci-dessus, ou fermeture manuelle
      // par l'utilisateur) - dans ce dernier cas le polling continue jusqu'au timeout.
    } finally {
      setEnCours(false);
    }
  }, [arreterPoll, onResult]);

  return { payer, enCours };
}
