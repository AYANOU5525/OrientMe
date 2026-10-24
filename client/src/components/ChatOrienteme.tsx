import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { poserQuestion, ErreurOrientation } from '../services/api';
import type { DemandeOrientation, MessageChat, Recommandation } from '../types';

interface ChatOrientemeProps {
  demande: DemandeOrientation;
  recommandations: Recommandation[];
}

// Messages envoyés comme contexte à chaque question (le serveur en accepte 12 au plus)
const HISTORIQUE_MAX = 10;

export const ChatOrienteme: React.FC<ChatOrientemeProps> = ({ demande, recommandations }) => {
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [saisie, setSaisie] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, enCours]);

  const [premiere, seconde] = recommandations;
  const suggestions = [
    premiere && `Combien de temps durent les études en ${premiere.nom} ?`,
    'Où puis-je étudier ces filières au Togo ?',
    premiere && seconde && `Quelle différence entre ${premiere.nom} et ${seconde.nom} ?`,
    'Que faire si je ne réussis pas le concours ?',
  ].filter((s): s is string => Boolean(s));

  const envoyer = async (question: string) => {
    const texte = question.trim();
    if (!texte || enCours) return;

    const historique = messages.slice(-HISTORIQUE_MAX);
    setMessages((prev) => [...prev, { role: 'etudiant', texte }]);
    setSaisie('');
    setErreur('');
    setEnCours(true);

    try {
      const response = await poserQuestion({
        profil: demande,
        recommandations: recommandations.map(({ filiereId, nom }) => ({ filiereId, nom })),
        historique,
        question: texte,
      });
      setMessages((prev) => [...prev, { role: 'orienteme', texte: response.data.reponse }]);
    } catch (error) {
      // La question sans réponse est retirée pour garder l'alternance étudiant / Orienteme
      setMessages((prev) => prev.slice(0, -1));
      setSaisie(texte);
      setErreur(error instanceof ErreurOrientation ? error.message : 'Une erreur inattendue est survenue.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <section className="chat no-print">
      <h2 className="prep-section-title">
        <MessageCircle size={22} /> Pose tes questions à Orienteme
      </h2>
      <p className="recommandations-hint">
        Une hésitation ? Demande ce que tu veux sur ces filières, les études ou les métiers.
      </p>

      <div className="chat-fenetre">
        {messages.length === 0 && (
          <div className="chat-suggestions">
            {suggestions.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => envoyer(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`chat-message chat-${m.role}`}>
            {m.texte}
          </div>
        ))}

        {enCours && (
          <div className="chat-message chat-orienteme chat-ecrit" aria-live="polite">
            Orienteme écrit<span className="chat-points">…</span>
          </div>
        )}
        <div ref={finRef} />
      </div>

      {erreur && <p className="form-error chat-erreur">{erreur}</p>}

      <form
        className="chat-saisie"
        onSubmit={(e) => {
          e.preventDefault();
          envoyer(saisie);
        }}
      >
        <input
          className="form-input"
          placeholder="Écris ta question…"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          maxLength={500}
          aria-label="Ta question"
          disabled={enCours}
        />
        <button className="btn btn-primary" type="submit" disabled={enCours || !saisie.trim()} aria-label="Envoyer">
          <Send size={16} />
        </button>
      </form>
    </section>
  );
};
