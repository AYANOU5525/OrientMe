import { Response, Router } from 'express';
import { ZodError } from 'zod';
import { filieres } from '../catalog';
import { OrientationRequestSchema, PreparationRequestSchema } from '../schemas';
import { getPreparation, getRecommendations } from '../services/gemini';
import { rateLimit } from '../middleware/rateLimit';

export const orientationRouter = Router();

// Partagé par les deux routes : 10 appels à Gemma par minute et par IP au total
const limiteGemma = rateLimit({ limit: 10, windowMs: 60_000 });

function donneesInvalides(res: Response, error: ZodError) {
  return res.status(400).json({
    success: false,
    code: 'INVALID_INPUT',
    message: 'Données invalides',
    details: error.flatten().fieldErrors,
  });
}

// POST /api/orientation — analyse du profil par le modèle Gemma (API Gemini)
orientationRouter.post('/orientation', limiteGemma, async (req, res, next) => {
  const parsed = OrientationRequestSchema.safeParse(req.body);
  if (!parsed.success) return donneesInvalides(res, parsed.error);

  try {
    const { result, model } = await getRecommendations(parsed.data);
    return res.json({ success: true, model, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/preparation — plan de rentrée Gemma pour la filière choisie
orientationRouter.post('/preparation', limiteGemma, async (req, res, next) => {
  const parsed = PreparationRequestSchema.safeParse(req.body);
  if (!parsed.success) return donneesInvalides(res, parsed.error);

  try {
    const { result, model } = await getPreparation(parsed.data);
    return res.json({ success: true, model, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/filieres — catalogue complet
orientationRouter.get('/filieres', (_req, res) => {
  res.json({ success: true, data: filieres });
});
