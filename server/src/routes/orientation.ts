import { Router, Request, Response } from 'express';
import { OrientationRequestSchema } from '../schemas';
import { getGeminiRecommendations } from '../services/gemini';
import { demoResult, demoProfile } from '../services/demo';
import { filieres } from '../services/gemini';

export const orientationRouter = Router();

// POST /api/orientation — appel Gemini
orientationRouter.post('/orientation', async (req: Request, res: Response) => {
  try {
    // Validation de la requête
    const parsed = OrientationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Données invalides',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    // Vérifier que la clé API est configurée
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message:
          'Le service d\'orientation IA n\'est pas configuré. Veuillez utiliser le mode démonstration.',
      });
    }

    // Timeout de 30 secondes pour Gemini
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Délai d\'attente dépassé (30s). Veuillez réessayer.')),
        30000
      )
    );

    const result = await Promise.race([
      getGeminiRecommendations(parsed.data),
      timeoutPromise,
    ]);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Erreur orientation:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur interne du serveur';
    return res.status(500).json({ error: message });
  }
});

// GET /api/demo — résultat de démonstration
orientationRouter.get('/demo', (_req: Request, res: Response) => {
  res.json({
    success: true,
    isDemo: true,
    profile: demoProfile,
    data: demoResult,
  });
});

// GET /api/filieres — catalogue complet
orientationRouter.get('/filieres', (_req: Request, res: Response) => {
  res.json({ success: true, data: filieres });
});
