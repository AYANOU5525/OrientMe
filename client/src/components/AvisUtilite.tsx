import React, { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { envoyerAvis } from '../services/api';

// « Ces recommandations t'aident-elles ? » : avis anonyme, compté dans l'espace conseillers
export const AvisUtilite: React.FC = () => {
  const [envoye, setEnvoye] = useState(false);

  const repondre = (utile: boolean) => {
    setEnvoye(true);
    // Un avis perdu n'empêche rien : l'erreur réseau est volontairement ignorée
    envoyerAvis(utile).catch(() => undefined);
  };

  return (
    <div className="avis no-print" aria-live="polite">
      {envoye ? (
        <p className="avis-merci">Merci pour ton avis !</p>
      ) : (
        <>
          <p className="avis-question">Ces recommandations t'aident-elles ?</p>
          <div className="avis-boutons">
            <button className="btn btn-outline btn-sm" onClick={() => repondre(true)}>
              <ThumbsUp size={14} /> Oui
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => repondre(false)}>
              <ThumbsDown size={14} /> Pas vraiment
            </button>
          </div>
        </>
      )}
    </div>
  );
};
