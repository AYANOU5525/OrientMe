import type { PlanRentree, ResultatOrientation } from '../types';

// Ouvre WhatsApp (application sur mobile, WhatsApp Web sur ordinateur) avec le message pré-rempli
export function partagerSurWhatsApp(texte: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, '_blank', 'noopener,noreferrer');
}

export function texteResultats(prenom: string, resultats: ResultatOrientation): string {
  const filieres = resultats.recommandations.map((r, i) => `${i + 1}. ${r.nom}`).join('\n');
  return [
    `🎓 ${prenom ? `${prenom} a découvert` : 'J\'ai découvert'} ses pistes d'orientation avec Orienteme :`,
    '',
    filieres,
    '',
    `💡 ${resultats.conseilGeneral}`,
  ].join('\n');
}

export function textePlan(prenom: string, plan: PlanRentree): string {
  const points = plan.aMaitriser.map((p, i) => `${i + 1}. ${p.titre}`).join('\n');
  const etapes = plan.planAvantRentree.map((e) => `• ${e.periode} : ${e.objectif}`).join('\n');
  return [
    `🎒 ${prenom ? `Le plan de rentrée de ${prenom}` : 'Mon plan de rentrée'} en ${plan.nom} (Orienteme) :`,
    '',
    'À maîtriser avant la rentrée :',
    points,
    '',
    'Le plan :',
    etapes,
  ].join('\n');
}
