import { appendFile, mkdir, readFile } from 'fs/promises';
import { dirname } from 'path';
import { config } from '../config';

// Statistiques anonymes pour l'espace conseillers : jamais de prénom, de notes ni de texte libre
type Evenement =
  | { type: 'orientation'; date: string; serieBAC: string; domaines: string[]; filieres: string[] }
  | { type: 'choix'; date: string; filiereId: string }
  | { type: 'avis'; date: string; utile: boolean };

type NouvelEvenement =
  | Omit<Extract<Evenement, { type: 'orientation' }>, 'date'>
  | Omit<Extract<Evenement, { type: 'choix' }>, 'date'>
  | Omit<Extract<Evenement, { type: 'avis' }>, 'date'>;

export interface Statistiques {
  orientations: number;
  choix: number;
  // Réponses à « Ces recommandations t'aident-elles ? »
  avisPositifs: number;
  avisNegatifs: number;
  parSerie: Record<string, number>;
  parDomaine: Record<string, number>;
  filieresRecommandees: Record<string, number>;
  filieresChoisies: Record<string, number>;
  parJour: Record<string, number>;
  depuis: string | null;
}

// L'enregistrement ne doit jamais faire échouer la requête de l'étudiant
export async function enregistrer(evenement: NouvelEvenement): Promise<void> {
  try {
    await mkdir(dirname(config.statsFile), { recursive: true });
    const ligne = JSON.stringify({ ...evenement, date: new Date().toISOString() });
    await appendFile(config.statsFile, `${ligne}\n`, 'utf-8');
  } catch (error) {
    console.warn('⚠️  Statistiques non enregistrées :', error instanceof Error ? error.message : error);
  }
}

function incrementer(compteur: Record<string, number>, cle: string) {
  compteur[cle] = (compteur[cle] ?? 0) + 1;
}

export function agreger(evenements: Evenement[]): Statistiques {
  const stats: Statistiques = {
    orientations: 0,
    choix: 0,
    avisPositifs: 0,
    avisNegatifs: 0,
    parSerie: {},
    parDomaine: {},
    filieresRecommandees: {},
    filieresChoisies: {},
    parJour: {},
    depuis: evenements[0]?.date ?? null,
  };

  for (const e of evenements) {
    if (e.type === 'orientation') {
      stats.orientations++;
      incrementer(stats.parSerie, e.serieBAC);
      incrementer(stats.parJour, e.date.slice(0, 10));
      e.domaines.forEach((d) => incrementer(stats.parDomaine, d));
      e.filieres.forEach((f) => incrementer(stats.filieresRecommandees, f));
    } else if (e.type === 'choix') {
      stats.choix++;
      incrementer(stats.filieresChoisies, e.filiereId);
    } else if (e.utile) {
      stats.avisPositifs++;
    } else {
      stats.avisNegatifs++;
    }
  }
  return stats;
}

export async function lireStatistiques(): Promise<Statistiques> {
  let contenu = '';
  try {
    contenu = await readFile(config.statsFile, 'utf-8');
  } catch {
    // Pas encore de fichier : aucune orientation enregistrée
  }

  const evenements: Evenement[] = [];
  for (const ligne of contenu.split('\n')) {
    if (!ligne.trim()) continue;
    try {
      evenements.push(JSON.parse(ligne));
    } catch {
      // Ligne corrompue (écriture interrompue) : ignorée
    }
  }
  return agreger(evenements);
}
