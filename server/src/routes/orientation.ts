import { Response, Router } from 'express';
import { timingSafeEqual } from 'crypto';
import { ZodError } from 'zod';
import { etablissementsPour, filieres } from '../catalog';
import { config } from '../config';
import { AvisRequestSchema, ChatRequestSchema, OrientationRequestSchema, PreparationRequestSchema } from '../schemas';
import { getChatReponse, getPreparation, getRecommendations } from '../services/gemini';
import { enregistrer, lireStatistiques } from '../services/stats';
import { rateLimit } from '../middleware/rateLimit';

export const orientationRouter = Router();

// Partagé par les routes qui appellent l'IA : orientation, plan de rentrée, discussion
const limiteIA = rateLimit({ limit: 20, windowMs: 60_000 });

function donneesInvalides(res: Response, error: ZodError) {
  return res.status(400).json({
    success: false,
    code: 'INVALID_INPUT',
    message: 'Données invalides',
    details: error.flatten().fieldErrors,
  });
}

// POST /api/orientation — analyse du profil par l'IA
orientationRouter.post('/orientation', limiteIA, async (req, res, next) => {
  const parsed = OrientationRequestSchema.safeParse(req.body);
  if (!parsed.success) return donneesInvalides(res, parsed.error);

  try {
    const { result, model } = await getRecommendations(parsed.data);
    void enregistrer({
      type: 'orientation',
      serieBAC: parsed.data.serieBAC,
      domaines: parsed.data.domainesInteret,
      filieres: result.recommandations.map((r) => r.filiereId),
    });
    return res.json({ success: true, model, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/preparation — plan de rentrée pour la filière choisie
orientationRouter.post('/preparation', limiteIA, async (req, res, next) => {
  const parsed = PreparationRequestSchema.safeParse(req.body);
  if (!parsed.success) return donneesInvalides(res, parsed.error);

  try {
    const { result, model } = await getPreparation(parsed.data);
    void enregistrer({ type: 'choix', filiereId: result.filiereId });
    return res.json({ success: true, model, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat — question de l'étudiant sur son orientation
orientationRouter.post('/chat', limiteIA, async (req, res, next) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) return donneesInvalides(res, parsed.error);

  try {
    const { result, model } = await getChatReponse(parsed.data);
    return res.json({ success: true, model, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/avis — « Ces recommandations t'aident-elles ? » (anonyme)
orientationRouter.post('/avis', rateLimit({ limit: 10, windowMs: 60_000 }), async (req, res) => {
  const parsed = AvisRequestSchema.safeParse(req.body);
  if (!parsed.success) return donneesInvalides(res, parsed.error);

  await enregistrer({ type: 'avis', utile: parsed.data.utile });
  return res.json({ success: true });
});

// GET /api/filieres — catalogue complet, avec les établissements togolais de chaque filière
orientationRouter.get('/filieres', (_req, res) => {
  res.json({
    success: true,
    data: filieres.map((f) => ({ ...f, etablissements: etablissementsPour(f.id) })),
  });
});

function jetonValide(entete: string | undefined): boolean {
  const recu = Buffer.from(entete?.replace(/^Bearer\s+/i, '') ?? '');
  const attendu = Buffer.from(config.adminToken);
  return recu.length === attendu.length && timingSafeEqual(recu, attendu);
}

// GET /api/stats — statistiques anonymes de l'espace conseillers (en-tête Authorization: Bearer <ADMIN_TOKEN>)
orientationRouter.get('/stats', rateLimit({ limit: 30, windowMs: 60_000 }), async (req, res, next) => {
  if (!config.adminToken) {
    return res.status(503).json({
      success: false,
      code: 'STATS_DISABLED',
      message: 'L\'espace conseillers n\'est pas activé sur ce serveur (ADMIN_TOKEN manquant).',
    });
  }
  if (!jetonValide(req.headers.authorization)) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Mot de passe incorrect.' });
  }

  try {
    const stats = await lireStatistiques();
    return res.json({ success: true, data: { ...stats, filieres: filieres.map((f) => ({ id: f.id, nom: f.nom })) } });
  } catch (error) {
    next(error);
  }
});
