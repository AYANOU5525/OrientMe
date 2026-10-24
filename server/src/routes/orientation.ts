import { Router } from 'express';
import { filieres } from '../catalog';
import { OrientationRequestSchema } from '../schemas';
import { getRecommendations } from '../services/gemini';
import { rateLimit } from '../middleware/rateLimit';

export const orientationRouter = Router();

// POST /api/orientation — analyse du profil par le modèle Gemma (API Gemini)
orientationRouter.post(
  '/orientation',
  rateLimit({ limit: 10, windowMs: 60_000 }),
  async (req, res, next) => {
    const parsed = OrientationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'Données invalides',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const { result, model } = await getRecommendations(parsed.data);
      return res.json({ success: true, model, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/filieres — catalogue complet
orientationRouter.get('/filieres', (_req, res) => {
  res.json({ success: true, data: filieres });
});
